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

export const getEnv = (overrides = {}) => {
  const source = { ...process.env, ...overrides };
  const nodeEnv = source.NODE_ENV?.trim() || "development";

  return Object.freeze({
    nodeEnv,
    host: source.HOST?.trim() || "0.0.0.0",
    port: toPositiveInt(source.PORT, 5001),
    logLevel: source.LOG_LEVEL?.trim() || (nodeEnv === "production" ? "info" : "debug"),
    mongodbUri: source.MONGODB_URI?.trim() || "",
    mongodbDbName: source.MONGODB_DB?.trim() || "Mindlytic",
    corsOrigins: parseCorsOrigins(source.CORS_ORIGIN),
    adminApiKey: source.ADMIN_API_KEY?.trim() || "",
    defaultPageSize: toPositiveInt(source.DEFAULT_PAGE_SIZE, 20),
    maxPageSize: toPositiveInt(source.MAX_PAGE_SIZE, 100),
    maxRequestBodyBytes: toPositiveInt(source.REQUEST_BODY_LIMIT_BYTES, 262144),
    rateLimitMax: toPositiveInt(source.RATE_LIMIT_MAX, 120),
    rateLimitWindowMs: toPositiveInt(source.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitAllowList: parseCommaSeparated(source.RATE_LIMIT_ALLOWLIST),
    enableCompression: toBoolean(source.ENABLE_COMPRESSION, true),
    enableSecurityHeaders: toBoolean(source.ENABLE_SECURITY_HEADERS, true),
    trustProxy: toBoolean(source.TRUST_PROXY, false),
  });
};
