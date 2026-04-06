const REQUEST_TIMEOUT_MS = 80000;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const chatBodySchema = {
  type: "object",
  required: ["messages"],
  properties: {
    messages: {
      type: "array",
      minItems: 1,
      maxItems: 80,
      items: {
        type: "object",
        required: ["role", "text"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          text: { type: "string", maxLength: 12000 },
        },
        additionalProperties: false,
      },
    },
    provider: { type: "string", enum: ["auto", "gemini", "groq", "openai"] },
    model: { type: "string", maxLength: 200 },
    systemPrompt: { type: "string", maxLength: 4000 },
    temperature: { type: "number", minimum: 0, maximum: 2 },
    maxOutputTokens: { type: "integer", minimum: 1, maximum: 8192 },
  },
  additionalProperties: false,
};

const captchaVerifyBodySchema = {
  type: "object",
  required: ["token"],
  properties: {
    token: { type: "string", minLength: 8, maxLength: 4096 },
  },
  additionalProperties: false,
};

const clampNumber = (value, fallback, { min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
};

const clampInteger = (value, fallback, { min, max }) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
};

const isLikelyJson = (contentType = "") => contentType.toLowerCase().includes("application/json");

const getTextFromGeminiResponse = (data) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim() || "";

const getTextFromGroqResponse = (data) => {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
};

const getTextFromOpenAIResponse = (data) => {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
};

const sanitizeChatMessages = (messages = []) =>
  messages
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      text: String(message?.text || "").trim(),
    }))
    .filter((message) => message.text.length > 0);

const buildGeminiContents = (messages = []) =>
  messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.text }],
  }));

const buildGroqMessages = (messages = [], systemPrompt = "") => {
  const conversation = messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.text,
  }));
  if (!systemPrompt) return conversation;
  return [{ role: "system", content: systemPrompt }, ...conversation];
};

const readUpstreamError = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (isLikelyJson(contentType)) {
    const data = await response.json().catch(() => null);
    const message = data?.error?.message || data?.error || data?.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }

  const text = await response.text().catch(() => "");
  if (text.trim()) return text.trim().slice(0, 500);
  return `Upstream AI API failed (${response.status}).`;
};

const resolveChatProvider = (requestedProvider, envConfig) => {
  const hasGemini = Boolean(envConfig.geminiApiKey);
  const hasGroq = Boolean(envConfig.groqApiKey);
  const hasOpenAI = Boolean(envConfig.openaiApiKey);
  const preferred = requestedProvider || envConfig.aiDefaultProvider || "auto";

  if (preferred === "gemini") return hasGemini ? "gemini" : "";
  if (preferred === "groq") return hasGroq ? "groq" : "";
  if (preferred === "openai") return hasOpenAI ? "openai" : "";

  if (hasGemini) return "gemini";
  if (hasGroq) return "groq";
  if (hasOpenAI) return "openai";
  return "";
};

const getTurnstileErrorMessage = (payload = {}) => {
  const codes = Array.isArray(payload?.["error-codes"]) ? payload["error-codes"] : [];
  if (!codes.length) return "Captcha verification failed. Please retry.";
  return `Captcha verification failed (${codes.join(", ")}).`;
};

export const registerAiRoutes = async (app) => {
  app.post(
    "/api/ai/captcha/verify",
    {
      schema: {
        body: captchaVerifyBodySchema,
      },
    },
    async (request, reply) => {
      const secretKey = String(app.envConfig.cloudflareTurnstileSecretKey || "").trim();
      if (!secretKey) {
        return reply.code(503).send({
          success: false,
          error: "Cloudflare Turnstile secret key is not configured on backend.",
        });
      }

      const token = String(request.body.token || "").trim();
      if (!token) {
        return reply.code(400).send({
          success: false,
          error: "Captcha token is required.",
        });
      }

      const body = new URLSearchParams();
      body.set("secret", secretKey);
      body.set("response", token);
      if (request.ip) body.set("remoteip", request.ip);

      let verifyResponse;
      try {
        verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });
      } catch (error) {
        request.log.error({ err: error }, "Turnstile verification failed");
        return reply.code(502).send({
          success: false,
          error: "Unable to verify captcha right now. Please try again.",
        });
      }

      const payload = await verifyResponse.json().catch(() => null);
      if (!payload || typeof payload.success !== "boolean") {
        return reply.code(502).send({
          success: false,
          error: "Captcha verification service returned an invalid response.",
        });
      }

      if (!payload.success) {
        return reply.code(400).send({
          success: false,
          error: getTurnstileErrorMessage(payload),
          details: Array.isArray(payload?.["error-codes"]) ? payload["error-codes"] : [],
        });
      }

      return reply.code(200).send({
        success: true,
      });
    },
  );

  app.post(
    "/api/ai/chat",
    {
      schema: {
        body: chatBodySchema,
      },
    },
    async (request, reply) => {
      const messages = sanitizeChatMessages(request.body.messages || []);
      if (!messages.length) {
        return reply.code(400).send({ error: "At least one non-empty message is required." });
      }

      const requestedProvider = String(request.body.provider || "").trim().toLowerCase();
      if (requestedProvider === "gemini" && !app.envConfig.geminiApiKey) {
        return reply.code(503).send({ error: "Gemini is not configured on the backend." });
      }
      if (requestedProvider === "groq" && !app.envConfig.groqApiKey) {
        return reply.code(503).send({ error: "Groq is not configured on the backend." });
      }
      if (requestedProvider === "openai" && !app.envConfig.openaiApiKey) {
        return reply.code(503).send({ error: "OpenAI is not configured on the backend." });
      }

      const provider = resolveChatProvider(requestedProvider || "auto", app.envConfig);
      if (!provider) {
        return reply
          .code(503)
          .send({
            error: "No AI text provider is configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in backend .env.",
          });
      }

      const model =
        (request.body.model ||
          (provider === "gemini"
            ? app.envConfig.geminiChatModel
            : provider === "groq"
              ? app.envConfig.groqChatModel
              : app.envConfig.openaiChatModel) ||
          "")
          .trim();
      if (!model) {
        return reply.code(500).send({ error: "AI model is not configured on the backend." });
      }

      const systemPrompt = String(request.body.systemPrompt || app.envConfig.aiSystemPrompt || "").trim();
      const temperature = clampNumber(request.body.temperature, app.envConfig.aiTemperature, { min: 0, max: 2 });
      const maxOutputTokens = clampInteger(request.body.maxOutputTokens, app.envConfig.aiMaxOutputTokens, {
        min: 1,
        max: 8192,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let upstreamResponse;
      try {
        if (provider === "gemini") {
          const payload = {
            contents: buildGeminiContents(messages),
            generationConfig: {
              temperature,
              maxOutputTokens,
            },
          };
          if (systemPrompt) {
            payload.system_instruction = { parts: [{ text: systemPrompt }] };
          }

          const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
            app.envConfig.geminiApiKey,
          )}`;

          upstreamResponse = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify(payload),
          });
        } else if (provider === "groq") {
          const endpoint = `${app.envConfig.groqApiBase}/chat/completions`;
          const payload = {
            model,
            messages: buildGroqMessages(messages, systemPrompt),
            temperature,
            max_tokens: maxOutputTokens,
            stream: false,
          };

          upstreamResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${app.envConfig.groqApiKey}`,
            },
            signal: controller.signal,
            body: JSON.stringify(payload),
          });
        } else {
          const endpoint = `${app.envConfig.openaiBaseUrl}/chat/completions`;
          const payload = {
            model,
            messages: buildGroqMessages(messages, systemPrompt),
            temperature,
            max_tokens: maxOutputTokens,
            stream: false,
          };

          upstreamResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${app.envConfig.openaiApiKey}`,
            },
            signal: controller.signal,
            body: JSON.stringify(payload),
          });
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error?.name === "AbortError") {
          return reply.code(504).send({ error: "AI text request timed out." });
        }
        request.log.error({ err: error, provider }, "AI text upstream fetch failed");
        return reply.code(502).send({ error: `Unable to reach ${provider} API: ${error?.message || "network error"}` });
      }

      clearTimeout(timeoutId);

      if (!upstreamResponse.ok) {
        const message = await readUpstreamError(upstreamResponse);
        return reply.code(502).send({ error: message });
      }

      const payload = await upstreamResponse.json().catch(() => null);
      if (!payload) {
        return reply.code(502).send({ error: "AI provider returned invalid JSON." });
      }

      const text =
        provider === "gemini"
          ? getTextFromGeminiResponse(payload)
          : provider === "groq"
            ? getTextFromGroqResponse(payload)
            : getTextFromOpenAIResponse(payload);
      if (!text) {
        return reply.code(502).send({ error: `${provider} returned an empty response.` });
      }

      return reply.code(200).send({
        provider,
        model,
        text,
      });
    },
  );
};
