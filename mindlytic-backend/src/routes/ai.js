const REQUEST_TIMEOUT_MS = 80000;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

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
    provider: { type: "string", enum: ["auto", "gemini", "groq"] },
    model: { type: "string", maxLength: 200 },
    systemPrompt: { type: "string", maxLength: 4000 },
    temperature: { type: "number", minimum: 0, maximum: 2 },
    maxOutputTokens: { type: "integer", minimum: 1, maximum: 8192 },
  },
  additionalProperties: false,
};

const imageBodySchema = {
  type: "object",
  required: ["prompt"],
  properties: {
    prompt: { type: "string", maxLength: 4000 },
    model: { type: "string", maxLength: 200 },
    size: { type: "string", maxLength: 64 },
    invokeUrl: { type: "string", maxLength: 1000 },
    apiKey: { type: "string", maxLength: 1024 },
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
const isLikelyImage = (contentType = "") => contentType.toLowerCase().startsWith("image/");
const isNvidiaStabilityInvokeUrl = (invokeUrl = "") =>
  /ai\.api\.nvidia\.com\/v1\/genai\/stabilityai\//i.test(invokeUrl);

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

const buildImagePayload = ({ prompt, invokeUrl, model, size }) => {
  if (/huggingface|api-inference\.huggingface/i.test(invokeUrl)) {
    return {
      inputs: prompt,
      options: { wait_for_model: true },
    };
  }

  if (isNvidiaStabilityInvokeUrl(invokeUrl)) {
    return { prompt };
  }

  const payload = { prompt };
  if (model) payload.model = model;
  if (size) payload.size = size;
  return payload;
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
  const preferred = requestedProvider || envConfig.aiDefaultProvider || "auto";

  if (preferred === "gemini") return hasGemini ? "gemini" : "";
  if (preferred === "groq") return hasGroq ? "groq" : "";

  if (hasGemini) return "gemini";
  if (hasGroq) return "groq";
  return "";
};

export const registerAiRoutes = async (app) => {
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

      const provider = resolveChatProvider(requestedProvider || "auto", app.envConfig);
      if (!provider) {
        return reply
          .code(503)
          .send({ error: "No AI text provider is configured. Set GEMINI_API_KEY or GROQ_API_KEY in backend .env." });
      }

      const model =
        (request.body.model ||
          (provider === "gemini" ? app.envConfig.geminiChatModel : app.envConfig.groqChatModel) ||
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
        } else {
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

      const text = provider === "gemini" ? getTextFromGeminiResponse(payload) : getTextFromGroqResponse(payload);
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

  app.post(
    "/api/ai/image",
    {
      schema: {
        body: imageBodySchema,
      },
    },
    async (request, reply) => {
      const prompt = String(request.body.prompt || "").trim();
      if (!prompt) {
        return reply.code(400).send({ error: "Prompt is required" });
      }

      const invokeUrl = (app.envConfig.imageInvokeUrl || request.body.invokeUrl || "").trim();
      const apiKey = (app.envConfig.imageApiKey || request.body.apiKey || "").trim();
      const model = (request.body.model || app.envConfig.imageModel || "").trim();
      const size = (request.body.size || app.envConfig.imageSize || "").trim();

      if (!invokeUrl) {
        return reply.code(400).send({ error: "Image invoke URL is missing. Set IMAGE_INVOKE_URL in backend or pass invokeUrl." });
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json, image/*",
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
        headers["x-api-key"] = apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let upstreamResponse;
      try {
        upstreamResponse = await fetch(invokeUrl, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify(buildImagePayload({ prompt, invokeUrl, model, size })),
        });
      } catch (error) {
        clearTimeout(timeoutId);
        if (error?.name === "AbortError") {
          return reply.code(504).send({ error: "Image request timed out." });
        }
        request.log.error({ err: error }, "Image upstream fetch failed");
        return reply.code(502).send({ error: `Unable to reach image API: ${error?.message || "network error"}` });
      }

      clearTimeout(timeoutId);

      if (!upstreamResponse.ok) {
        const message = await readUpstreamError(upstreamResponse);
        return reply.code(502).send({ error: message });
      }

      const contentTypeHeader = upstreamResponse.headers.get("content-type") || "";
      const contentType = contentTypeHeader.split(";")[0].trim().toLowerCase();

      if (isLikelyImage(contentType)) {
        const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
        return reply.code(200).send({
          image_base64: buffer.toString("base64"),
          mime_type: contentType || "image/png",
        });
      }

      if (isLikelyJson(contentTypeHeader)) {
        const data = await upstreamResponse.json().catch(() => null);
        return reply.code(200).send({ data });
      }

      const text = await upstreamResponse.text().catch(() => "");
      return reply.code(200).send({ data: text });
    },
  );
};
