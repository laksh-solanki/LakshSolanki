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

const parseCorsOrigins = (value) => {
  const raw = value?.trim();
  if (!raw) return ["*"];
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
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
  });
};
