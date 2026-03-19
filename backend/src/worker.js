import { isValidEmail, normalizeEmail } from "./lib/email.js";
import { createRepositories } from "./services/repositories.js";

const REQUEST_TIMEOUT_MS = 80000;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

let workerState;

const logger = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const toNumberInRange = (value, fallback, { min, max }) => {
  const parsed = Number.parseFloat(value ?? "");
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (Number.isFinite(min) && parsed < min) {
    return min;
  }
  if (Number.isFinite(max) && parsed > max) {
    return max;
  }
  return parsed;
};

const toBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const parseCommaSeparated = (value) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const parseCorsOrigins = (value) => {
  const raw = value?.trim();
  if (!raw) return ["*"];
  return parseCommaSeparated(raw);
};

const parseAiProvider = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["auto", "gemini", "groq"].includes(normalized)) {
    return normalized;
  }
  return "auto";
};

const getEnvConfig = (bindings = {}) => {
  const source = bindings;
  const nodeEnv = source.NODE_ENV?.trim() || "production";

  return Object.freeze({
    nodeEnv,
    mongodbUri: source.MONGODB_URI?.trim() || "",
    mongodbDbName: source.MONGODB_DB_NAME?.trim() || "Mindlytic",
    corsOrigins: parseCorsOrigins(source.CORS_ORIGIN),
    maxRequestBodyBytes: toPositiveInt(source.REQUEST_BODY_LIMIT_BYTES, 262144),
    enableSecurityHeaders: toBoolean(source.ENABLE_SECURITY_HEADERS, true),
    geminiApiKey: source.GEMINI_API_KEY?.trim() || source.GOOGLE_API_KEY?.trim() || "",
    geminiChatModel: source.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-flash",
    groqApiKey: source.GROQ_API_KEY?.trim() || "",
    groqApiBase: source.GROQ_API_BASE?.trim().replace(/\/+$/, "") || "https://api.groq.com/openai/v1",
    groqChatModel: source.GROQ_CHAT_MODEL?.trim() || "llama-3.3-70b-versatile",
    aiDefaultProvider: parseAiProvider(source.AI_DEFAULT_PROVIDER),
    aiSystemPrompt:
      source.AI_SYSTEM_PROMPT?.trim() ||
      "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first, then add implementation details, edge cases, and simple teaching guidance when useful.",
    aiTemperature: toNumberInRange(source.AI_TEMPERATURE, 1.5, { min: 0, max: 2 }),
    aiMaxOutputTokens: toPositiveInt(source.AI_MAX_OUTPUT_TOKENS, 2000),
    imageApiKey: source.IMAGE_API_KEY?.trim() || "",
    imageInvokeUrl: source.IMAGE_INVOKE_URL?.trim() || "",
    imageModel: source.IMAGE_MODEL?.trim() || "",
    imageSize: source.IMAGE_SIZE?.trim() || "1024x1024",
  });
};

const createDatabaseStatus = (envConfig) => {
  if (!envConfig.mongodbUri) {
    return {
      mode: "memory",
      enabled: false,
      connected: false,
      reason: "MONGODB_URI not configured",
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    mode: "memory",
    enabled: false,
    connected: false,
    reason: "MongoDB driver is disabled in Cloudflare Worker mode.",
    updatedAt: new Date().toISOString(),
  };
};

const getState = (bindings) => {
  if (!workerState) {
    const envConfig = getEnvConfig(bindings);

    workerState = {
      startedAt: Date.now(),
      envConfig,
      dbStatus: createDatabaseStatus(envConfig),
      repositories: createRepositories({
        db: null,
        logger,
      }),
    };
  }

  return workerState;
};

const getUptimeSeconds = (startedAt) => Number(((Date.now() - startedAt) / 1000).toFixed(1));

const getCorsOriginHeader = (request, envConfig) => {
  if (envConfig.corsOrigins.includes("*")) {
    return "*";
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return "";
  }

  const isAllowed = envConfig.corsOrigins.some(
    (allowedOrigin) => allowedOrigin.toLowerCase() === origin.toLowerCase(),
  );

  return isAllowed ? origin : "";
};

const isCorsRejected = (request, envConfig) => {
  if (envConfig.corsOrigins.includes("*")) {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  return !envConfig.corsOrigins.some(
    (allowedOrigin) => allowedOrigin.toLowerCase() === origin.toLowerCase(),
  );
};

const getSecurityHeaders = (envConfig) => {
  if (!envConfig.enableSecurityHeaders) {
    return {};
  }

  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  if (envConfig.nodeEnv === "production") {
    headers["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains";
  }

  return headers;
};

const createBaseHeaders = (request, envConfig, extras = {}) => {
  const headers = new Headers();
  const corsOrigin = getCorsOriginHeader(request, envConfig);
  if (corsOrigin) {
    headers.set("Access-Control-Allow-Origin", corsOrigin);
    if (corsOrigin !== "*") {
      headers.set("Vary", "Origin");
    }
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");

  for (const [name, value] of Object.entries(getSecurityHeaders(envConfig))) {
    headers.set(name, value);
  }

  for (const [name, value] of Object.entries(extras)) {
    headers.set(name, value);
  }

  return headers;
};

const jsonResponse = (request, envConfig, status, payload, extras = {}) => {
  const headers = createBaseHeaders(request, envConfig, {
    "Content-Type": "application/json; charset=utf-8",
    ...extras,
  });

  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
};

const emptyResponse = (request, envConfig, status, extras = {}) =>
  new Response(null, {
    status,
    headers: createBaseHeaders(request, envConfig, extras),
  });

const getClientIp = (request) => {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) {
    return cfIp.trim();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded?.trim()) {
    return "";
  }

  return forwarded.split(",")[0]?.trim() || "";
};

const parseRequestBody = async (request, envConfig) => {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    const error = new Error("Content-Type must be application/json");
    error.statusCode = 415;
    throw error;
  }

  const text = await request.text();
  const bodySize = new TextEncoder().encode(text).byteLength;
  if (bodySize > envConfig.maxRequestBodyBytes) {
    const error = new Error("Request payload too large");
    error.statusCode = 413;
    throw error;
  }

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Invalid JSON payload");
    error.statusCode = 400;
    throw error;
  }
};

const isLikelyJson = (contentType = "") => contentType.toLowerCase().includes("application/json");
const isLikelyImage = (contentType = "") => contentType.toLowerCase().startsWith("image/");
const isNvidiaStabilityInvokeUrl = (invokeUrl = "") =>
  /ai\.api\.nvidia\.com\/v1\/genai\/stabilityai\//i.test(invokeUrl);

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

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const ensureString = (value) => (typeof value === "string" ? value : "");

const handleCoursesGet = async (request, state) => {
  const { envConfig, repositories } = state;
  const url = new URL(request.url);
  const search = ensureString(url.searchParams.get("search")).slice(0, 120);
  const sort = ensureString(url.searchParams.get("sort") || "asc").toLowerCase();
  if (!["asc", "desc"].includes(sort)) {
    return jsonResponse(request, envConfig, 400, { error: "sort must be 'asc' or 'desc'" });
  }

  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw === null ? 50 : Number.parseInt(limitRaw, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return jsonResponse(request, envConfig, 400, { error: "limit must be an integer between 1 and 100" });
  }

  const courses = await repositories.listCourses({ search, limit, sort });
  return jsonResponse(
    request,
    envConfig,
    200,
    {
      count: courses.length,
      data: courses,
    },
    {
      "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
    },
  );
};

const validateCoursePayload = (body) => {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object";
  }
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 140) {
    return "name is required and must be 2-140 characters";
  }
  if (body.category !== undefined && (typeof body.category !== "string" || body.category.length > 80)) {
    return "category must be a string with max 80 characters";
  }
  if (body.level !== undefined && (typeof body.level !== "string" || body.level.length > 40)) {
    return "level must be a string with max 40 characters";
  }
  if (
    body.durationHours !== undefined &&
    (!Number.isFinite(body.durationHours) || body.durationHours < 1 || body.durationHours > 1000)
  ) {
    return "durationHours must be between 1 and 1000";
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 20) {
      return "tags must be an array with max 20 items";
    }
    const invalidTag = body.tags.some((tag) => typeof tag !== "string" || tag.length > 30);
    if (invalidTag) {
      return "each tag must be a string with max 30 characters";
    }
  }
  return "";
};

const handleCoursesPost = async (request, state) => {
  const { envConfig, repositories } = state;
  const body = await parseRequestBody(request, envConfig);
  const validationError = validateCoursePayload(body);
  if (validationError) {
    return jsonResponse(request, envConfig, 400, { error: validationError });
  }

  try {
    const created = await repositories.addCourse(body);
    return jsonResponse(request, envConfig, 201, {
      message: "Course created successfully",
      data: created,
    });
  } catch (error) {
    if (error?.statusCode && error.statusCode >= 400) {
      const payload = {
        error: error.message,
      };
      if (error.course) {
        payload.data = error.course;
      }
      return jsonResponse(request, envConfig, error.statusCode, payload);
    }
    throw error;
  }
};

const handleSubscribePost = async (request, state) => {
  const { envConfig, repositories } = state;
  const body = await parseRequestBody(request, envConfig);
  const email = ensureString(body.email);
  const name = ensureString(body.name);
  const source = ensureString(body.source || "website");

  if (!isValidEmail(email)) {
    return jsonResponse(request, envConfig, 400, { error: "Email is invalid" });
  }

  const result = await repositories.subscribe({
    email: normalizeEmail(email),
    name,
    source,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") || "",
  });

  if (result.status === "already_subscribed") {
    return jsonResponse(request, envConfig, 409, { error: "Email already subscribed" });
  }

  if (result.status === "reactivated") {
    return jsonResponse(request, envConfig, 200, {
      message: "Subscription restored successfully",
      id: result.subscription?.id,
    });
  }

  return jsonResponse(request, envConfig, 201, {
    message: "Subscribed successfully",
    id: result.subscription?.id,
  });
};

const handleSubscribeStatusGet = async (request, state) => {
  const { envConfig, repositories } = state;
  const url = new URL(request.url);
  const email = ensureString(url.searchParams.get("email"));

  if (!isValidEmail(email)) {
    return jsonResponse(request, envConfig, 200, {
      subscribed: false,
      status: "invalid_email",
    });
  }

  const result = await repositories.getSubscriptionStatus({ email });

  return jsonResponse(request, envConfig, 200, {
    email: normalizeEmail(email),
    subscribed: result.subscribed,
    status: result.status,
    details: result.subscription,
  });
};

const handleSubscribeDelete = async (request, state) => {
  const { envConfig, repositories } = state;
  const body = await parseRequestBody(request, envConfig);
  const email = ensureString(body.email);

  if (!isValidEmail(email)) {
    return jsonResponse(request, envConfig, 400, { error: "Email is invalid" });
  }

  const result = await repositories.unsubscribe({ email });

  if (result.status === "not_found") {
    return jsonResponse(request, envConfig, 404, { error: "Subscription not found" });
  }

  if (result.status === "already_unsubscribed") {
    return jsonResponse(request, envConfig, 200, { message: "Already unsubscribed" });
  }

  return jsonResponse(request, envConfig, 200, { message: "Unsubscribed successfully" });
};

const handleAiChatPost = async (request, state) => {
  const { envConfig } = state;
  const body = await parseRequestBody(request, envConfig);

  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 80) {
    return jsonResponse(request, envConfig, 400, { error: "messages must be an array with 1-80 items" });
  }

  const messages = sanitizeChatMessages(body.messages);
  if (!messages.length) {
    return jsonResponse(request, envConfig, 400, { error: "At least one non-empty message is required." });
  }

  const requestedProvider = ensureString(body.provider).trim().toLowerCase();
  if (requestedProvider && !["auto", "gemini", "groq"].includes(requestedProvider)) {
    return jsonResponse(request, envConfig, 400, { error: "provider must be one of: auto, gemini, groq" });
  }
  if (requestedProvider === "gemini" && !envConfig.geminiApiKey) {
    return jsonResponse(request, envConfig, 503, { error: "Gemini is not configured on the backend." });
  }
  if (requestedProvider === "groq" && !envConfig.groqApiKey) {
    return jsonResponse(request, envConfig, 503, { error: "Groq is not configured on the backend." });
  }

  const provider = resolveChatProvider(requestedProvider || "auto", envConfig);
  if (!provider) {
    return jsonResponse(request, envConfig, 503, {
      error: "No AI text provider is configured. Set GEMINI_API_KEY or GROQ_API_KEY in backend .env.",
    });
  }

  const model = ensureString(
    body.model || (provider === "gemini" ? envConfig.geminiChatModel : envConfig.groqChatModel) || "",
  ).trim();
  if (!model) {
    return jsonResponse(request, envConfig, 500, { error: "AI model is not configured on the backend." });
  }

  const systemPrompt = ensureString(body.systemPrompt || envConfig.aiSystemPrompt).trim();
  const temperature = clampNumber(body.temperature, envConfig.aiTemperature, { min: 0, max: 2 });
  const maxOutputTokens = clampInteger(body.maxOutputTokens, envConfig.aiMaxOutputTokens, {
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
        envConfig.geminiApiKey,
      )}`;

      upstreamResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
    } else {
      const endpoint = `${envConfig.groqApiBase}/chat/completions`;
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
          Authorization: `Bearer ${envConfig.groqApiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      return jsonResponse(request, envConfig, 504, { error: "AI text request timed out." });
    }
    return jsonResponse(request, envConfig, 502, {
      error: `Unable to reach ${provider} API: ${error?.message || "network error"}`,
    });
  }

  clearTimeout(timeoutId);

  if (!upstreamResponse.ok) {
    const message = await readUpstreamError(upstreamResponse);
    return jsonResponse(request, envConfig, 502, { error: message });
  }

  const payload = await upstreamResponse.json().catch(() => null);
  if (!payload) {
    return jsonResponse(request, envConfig, 502, { error: "AI provider returned invalid JSON." });
  }

  const text = provider === "gemini" ? getTextFromGeminiResponse(payload) : getTextFromGroqResponse(payload);
  if (!text) {
    return jsonResponse(request, envConfig, 502, { error: `${provider} returned an empty response.` });
  }

  return jsonResponse(request, envConfig, 200, {
    provider,
    model,
    text,
  });
};

const handleAiImagePost = async (request, state) => {
  const { envConfig } = state;
  const body = await parseRequestBody(request, envConfig);

  const prompt = ensureString(body.prompt).trim();
  if (!prompt) {
    return jsonResponse(request, envConfig, 400, { error: "Prompt is required" });
  }

  const invokeUrl = ensureString(envConfig.imageInvokeUrl || body.invokeUrl).trim();
  const apiKey = ensureString(envConfig.imageApiKey || body.apiKey).trim();
  const model = ensureString(body.model || envConfig.imageModel).trim();
  const size = ensureString(body.size || envConfig.imageSize).trim();

  if (!invokeUrl) {
    return jsonResponse(request, envConfig, 400, {
      error: "Image invoke URL is missing. Set IMAGE_INVOKE_URL in backend or pass invokeUrl.",
    });
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
      return jsonResponse(request, envConfig, 504, { error: "Image request timed out." });
    }
    return jsonResponse(request, envConfig, 502, {
      error: `Unable to reach image API: ${error?.message || "network error"}`,
    });
  }

  clearTimeout(timeoutId);

  if (!upstreamResponse.ok) {
    const message = await readUpstreamError(upstreamResponse);
    return jsonResponse(request, envConfig, 502, { error: message });
  }

  const contentTypeHeader = upstreamResponse.headers.get("content-type") || "";
  const contentType = contentTypeHeader.split(";")[0].trim().toLowerCase();

  if (isLikelyImage(contentType)) {
    const imageBase64 = arrayBufferToBase64(await upstreamResponse.arrayBuffer());
    return jsonResponse(request, envConfig, 200, {
      image_base64: imageBase64,
      mime_type: contentType || "image/png",
    });
  }

  if (isLikelyJson(contentTypeHeader)) {
    const data = await upstreamResponse.json().catch(() => null);
    return jsonResponse(request, envConfig, 200, { data });
  }

  const text = await upstreamResponse.text().catch(() => "");
  return jsonResponse(request, envConfig, 200, { data: text });
};

const handleRoute = async (request, state) => {
  const { envConfig, dbStatus, startedAt } = state;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const path = url.pathname;

  if (method === "OPTIONS") {
    return emptyResponse(request, envConfig, 204);
  }

  if (path === "/" && method === "GET") {
    return jsonResponse(request, envConfig, 200, {
      status: "Backend working",
      time: new Date().toISOString(),
      uptimeSeconds: getUptimeSeconds(startedAt),
      mode: dbStatus.mode,
    });
  }

  if (path === "/health" && method === "GET") {
    return jsonResponse(request, envConfig, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: getUptimeSeconds(startedAt),
    });
  }

  if (path === "/ready" && method === "GET") {
    const ready = true;
    return jsonResponse(request, envConfig, 200, {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  }

  if (path === "/api/courses" && method === "GET") {
    return handleCoursesGet(request, state);
  }

  if (path === "/api/courses" && method === "POST") {
    return handleCoursesPost(request, state);
  }

  if (path === "/api/subscribe" && method === "POST") {
    return handleSubscribePost(request, state);
  }

  if (path === "/api/subscribe/status" && method === "GET") {
    return handleSubscribeStatusGet(request, state);
  }

  if (path === "/api/subscribe" && method === "DELETE") {
    return handleSubscribeDelete(request, state);
  }

  if (path === "/api/ai/chat" && method === "POST") {
    return handleAiChatPost(request, state);
  }

  if (path === "/api/ai/image" && method === "POST") {
    return handleAiImagePost(request, state);
  }

  return jsonResponse(request, envConfig, 404, {
    error: "Route not found",
    path: `${path}${url.search}`,
  });
};

export default {
  async fetch(request, env) {
    const state = getState(env);
    const { envConfig } = state;

    if (isCorsRejected(request, envConfig)) {
      return jsonResponse(request, envConfig, 403, {
        error: "Origin not allowed by CORS",
      });
    }

    try {
      if (!METHODS_WITHOUT_BODY.has(request.method.toUpperCase())) {
        const contentLength = Number.parseInt(request.headers.get("content-length") || "", 10);
        if (Number.isFinite(contentLength) && contentLength > envConfig.maxRequestBodyBytes) {
          return jsonResponse(request, envConfig, 413, {
            error: "Request payload too large",
          });
        }
      }

      return await handleRoute(request, state);
    } catch (error) {
      const statusCode =
        Number.isInteger(error?.statusCode) && error.statusCode >= 400 ? error.statusCode : 500;

      const payload = {
        error: statusCode >= 500 ? "Internal Server Error" : error.message,
      };

      if (statusCode >= 500 && envConfig.nodeEnv !== "production" && error?.message) {
        payload.details = error.message;
      }

      logger.error("Unhandled request error", error);
      return jsonResponse(request, envConfig, statusCode, payload);
    }
  },
};
