import dotenv from "dotenv";

const dotenvResult = dotenv.config({ quiet: true });
export const envInjectionSuccessful = !dotenvResult.error;

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
  if (["auto", "gemini", "groq", "openai"].includes(normalized)) {
    return normalized;
  }
  return "auto";
};

export const getEnv = (overrides = {}) => {
  const source = { ...process.env, ...overrides };
  const nodeEnv = source.NODE_ENV?.trim() || "development";
  const mongodbDbName =
    source.MONGODB_DB_NAME?.trim() ||
    source.MONGODB_DB?.trim() ||
    source.DB_NAME?.trim() ||
    "LakshSolanki";

  return Object.freeze({
    nodeEnv,
    host: source.HOST?.trim() || "0.0.0.0",
    port: toPositiveInt(source.PORT, 5001),
    logLevel: source.LOG_LEVEL?.trim() || (nodeEnv === "production" ? "info" : "debug"),
    mongodbUri: source.MONGODB_URI?.trim() || "",
    mongodbDbName,
    mongodbServerSelectionTimeoutMs: toPositiveInt(source.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 5000),
    mongodbConnectTimeoutMs: toPositiveInt(source.MONGODB_CONNECT_TIMEOUT_MS, 5000),
    corsOrigins: parseCorsOrigins(source.CORS_ORIGIN),
    maxRequestBodyBytes: toPositiveInt(source.REQUEST_BODY_LIMIT_BYTES, 262144),
    rateLimitMax: toPositiveInt(source.RATE_LIMIT_MAX, 120),
    rateLimitWindowMs: toPositiveInt(source.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitAllowList: parseCommaSeparated(source.RATE_LIMIT_ALLOWLIST),
    enableCompression: toBoolean(source.ENABLE_COMPRESSION, true),
    enableSecurityHeaders: toBoolean(source.ENABLE_SECURITY_HEADERS, true),
    trustProxy: toBoolean(source.TRUST_PROXY, false),
    firebaseProjectId: source.FIREBASE_PROJECT_ID?.trim() || "",
    firebaseJwksUrl:
      source.FIREBASE_JWKS_URL?.trim() ||
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
    firebaseAuthTestMode: nodeEnv !== "production" && toBoolean(source.FIREBASE_AUTH_TEST_MODE, false),
    geminiApiKey: source.GEMINI_API_KEY?.trim() || source.GOOGLE_API_KEY?.trim() || "",
    geminiChatModel: source.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-flash",
    groqApiKey: source.GROQ_API_KEY?.trim() || "",
    groqApiBase: source.GROQ_API_BASE?.trim().replace(/\/+$/, "") || "https://api.groq.com/openai/v1",
    groqChatModel: source.GROQ_CHAT_MODEL?.trim() || "llama-3.3-70b-versatile",
    openaiApiKey: source.OPENAI_API_KEY?.trim() || source.NVIDIA_API_KEY?.trim() || "",
    openaiBaseUrl: source.OPENAI_BASE_URL?.trim().replace(/\/+$/, "") || "https://integrate.api.nvidia.com/v1",
    openaiChatModel: source.OPENAI_CHAT_MODEL?.trim() || "microsoft/phi-3.5-mini-instruct",
    aiDefaultProvider: parseAiProvider(source.AI_DEFAULT_PROVIDER),
    aiSystemPrompt:
      source.AI_SYSTEM_PROMPT?.trim() ||
      "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first, then add implementation details, edge cases, and simple teaching guidance when useful.",
    aiTemperature: toNumberInRange(source.AI_TEMPERATURE, 1.5, { min: 0, max: 2 }),
    aiMaxOutputTokens: toPositiveInt(source.AI_MAX_OUTPUT_TOKENS, 2000),
  });
};
