import { isValidEmail, normalizeEmail } from "./lib/email.js";
import { createMongoDataApiDb } from "./lib/mongo-data-api.js";
import { createRepositories } from "./services/repositories.js";
import { createFirebaseTokenVerifier } from "./lib/firebase-auth.js";

const REQUEST_TIMEOUT_MS = 80000;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

let workerStatePromise;
let workerStateKey = "";
let mongoRuntimePromise;

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
  if (["auto", "gemini", "groq", "openai"].includes(normalized)) {
    return normalized;
  }
  return "auto";
};

const getMongoRuntime = async () => {
  if (!mongoRuntimePromise) {
    mongoRuntimePromise = import("mongodb").then((module) => ({
      MongoClient: module.MongoClient,
      ServerApiVersion: module.ServerApiVersion,
    }));
  }

  return mongoRuntimePromise;
};

const ensureIndexes = async (db) => {
  try {
    await Promise.all([
      db.collection("courses").createIndex({ name: 1 }, { name: "idx_course_name" }),
      db.collection("courses").createIndex(
        { normalizedName: 1 },
        {
          name: "uq_course_normalized_name",
          unique: true,
          partialFilterExpression: {
            normalizedName: { $type: "string" },
          },
        },
      ),
      db.collection("media").createIndex(
        { normalizedKey: 1 },
        {
          name: "uq_media_normalized_key",
          unique: true,
          partialFilterExpression: {
            normalizedKey: { $type: "string" },
          },
        },
      ),
      db.collection("media").createIndex(
        { type: 1, createdAt: -1 },
        { name: "idx_media_type_created" },
      ),
      db.collection("subscriptions").createIndex(
        { normalizedEmail: 1 },
        { unique: true, name: "uq_subscription_normalized_email" },
      ),
      db.collection("subscriptions").createIndex(
        { status: 1, createdAt: -1 },
        { name: "idx_subscription_status_created" },
      ),
      db.collection("tts_snippets").createIndex(
        { ownerKey: 1, createdAt: -1 },
        { name: "idx_tts_snippets_owner_created" },
      ),
      db.collection("tts_snippets").createIndex(
        { ownerKey: 1, normalizedContent: 1 },
        { name: "uq_tts_snippets_owner_content", unique: true },
      ),
      db.collection("ai_conversations").createIndex(
        { ownerUid: 1, updatedAt: -1 },
        { name: "idx_ai_conversations_owner_updated" },
      ),
      db.collection("ai_conversations").createIndex(
        { ownerUid: 1, id: 1 },
        { name: "uq_ai_conversations_owner_id", unique: true },
      ),
    ]);
  } catch (error) {
    logger.warn("Index creation skipped due to existing index/conflicting data.", error);
  }
};

const getEnvConfig = (bindings = {}) => {
  const source = bindings;
  const nodeEnv = source.NODE_ENV?.trim() || "production";

  return Object.freeze({
    nodeEnv,
    mongodbUri: source.MONGODB_URI?.trim() || "",
    mongodbDbName:
      source.MONGODB_DB_NAME?.trim() ||
      source.MONGODB_DB?.trim() ||
      source.DB_NAME?.trim() ||
      "LakshSolanki",
    mongodbDataApiUrl: source.MONGODB_DATA_API_URL?.trim() || "",
    mongodbDataApiKey: source.MONGODB_DATA_API_KEY?.trim() || "",
    mongodbDataSource: source.MONGODB_DATA_SOURCE?.trim() || "Cluster0",
    mongodbDataApiTimeoutMs: toPositiveInt(source.MONGODB_DATA_API_TIMEOUT_MS, 8000),
    mongodbServerSelectionTimeoutMs: toPositiveInt(source.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 6000),
    mongodbConnectTimeoutMs: toPositiveInt(source.MONGODB_CONNECT_TIMEOUT_MS, 6000),
    corsOrigins: parseCorsOrigins(source.CORS_ORIGIN),
    maxRequestBodyBytes: toPositiveInt(source.REQUEST_BODY_LIMIT_BYTES, 262144),
    enableSecurityHeaders: toBoolean(source.ENABLE_SECURITY_HEADERS, true),
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

const createDatabaseStatus = ({ mode, enabled, connected, reason }) => ({
  mode,
  enabled,
  connected,
  reason,
  updatedAt: new Date().toISOString(),
});

const createMemoryOnlyStatus = (reason) =>
  createDatabaseStatus({
    mode: "memory",
    enabled: false,
    connected: false,
    reason,
  });

const createDataApiConnectedStatus = () =>
  createDatabaseStatus({
    mode: "mongo-data-api",
    enabled: true,
    connected: true,
    reason: "",
  });

const createDataApiDisconnectedStatus = (reason) =>
  createDatabaseStatus({
    mode: "mongo-data-api",
    enabled: true,
    connected: false,
    reason,
  });

const createMongoConnectedStatus = () =>
  createDatabaseStatus({
    mode: "mongo",
    enabled: true,
    connected: true,
    reason: "",
  });

const createMongoDisconnectedStatus = (reason) =>
  createDatabaseStatus({
    mode: "mongo",
    enabled: true,
    connected: false,
    reason,
  });

const getUnconfiguredReason = (envConfig) => {
  if (!envConfig.mongodbUri && !envConfig.mongodbDataApiUrl && !envConfig.mongodbDataApiKey) {
    return "MongoDB is not configured.";
  }

  if (envConfig.mongodbDataApiUrl && !envConfig.mongodbDataApiKey) {
    return "MONGODB_DATA_API_URL is set but MONGODB_DATA_API_KEY is missing.";
  }

  if (!envConfig.mongodbDataApiUrl && envConfig.mongodbDataApiKey) {
    return "MONGODB_DATA_API_KEY is set but MONGODB_DATA_API_URL is missing.";
  }

  return "Worker is running in memory mode.";
};

const connectNativeMongo = async (envConfig) => {
  const mongoRuntime = await getMongoRuntime();
  const { MongoClient, ServerApiVersion } = mongoRuntime;

  const client = new MongoClient(envConfig.mongodbUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: envConfig.mongodbServerSelectionTimeoutMs,
    connectTimeoutMS: envConfig.mongodbConnectTimeoutMs,
  });

  await client.connect();
  const db = client.db(envConfig.mongodbDbName);
  await db.command({ ping: 1 });
  await ensureIndexes(db);

  return { client, db };
};

const getState = async (bindings) => {
  const stateKey = JSON.stringify({
    nodeEnv: bindings?.NODE_ENV || "",
    mongodbUri: bindings?.MONGODB_URI || "",
    mongodbDbName: bindings?.MONGODB_DB_NAME || bindings?.MONGODB_DB || bindings?.DB_NAME || "",
    mongodbDataApiUrl: bindings?.MONGODB_DATA_API_URL || "",
    mongodbDataApiKey: bindings?.MONGODB_DATA_API_KEY || "",
    mongodbDataSource: bindings?.MONGODB_DATA_SOURCE || "",
    mongodbServerSelectionTimeoutMs: bindings?.MONGODB_SERVER_SELECTION_TIMEOUT_MS || "",
    mongodbConnectTimeoutMs: bindings?.MONGODB_CONNECT_TIMEOUT_MS || "",
    firebaseProjectId: bindings?.FIREBASE_PROJECT_ID || "",
    firebaseJwksUrl: bindings?.FIREBASE_JWKS_URL || "",
    firebaseAuthTestMode: bindings?.FIREBASE_AUTH_TEST_MODE || "",
  });

  if (!workerStatePromise || workerStateKey !== stateKey) {
    workerStateKey = stateKey;
    workerStatePromise = (async () => {
      const envConfig = getEnvConfig(bindings);
      let db = null;
      let dbStatus = createMemoryOnlyStatus(getUnconfiguredReason(envConfig));
      let mongoClient = null;

      if (envConfig.mongodbUri) {
        try {
          const connected = await connectNativeMongo(envConfig);
          mongoClient = connected.client;
          db = connected.db;
          dbStatus = createMongoConnectedStatus();
          logger.info("MongoDB URI connected for Worker runtime.");
        } catch (error) {
          logger.error("MongoDB URI connection failed in Worker runtime.", error);
          dbStatus = createMongoDisconnectedStatus(
            "MongoDB URI connection failed. Check MONGODB_URI network/auth settings.",
          );
          db = null;
        }
      }

      const canUseDataApi = Boolean(envConfig.mongodbDataApiUrl && envConfig.mongodbDataApiKey);
      if (!db && canUseDataApi) {
        try {
          db = createMongoDataApiDb({
            baseUrl: envConfig.mongodbDataApiUrl,
            apiKey: envConfig.mongodbDataApiKey,
            dataSource: envConfig.mongodbDataSource,
            database: envConfig.mongodbDbName,
            timeoutMs: envConfig.mongodbDataApiTimeoutMs,
          });

          await db.collection("courses").find({}).limit(1).toArray();
          dbStatus = createDataApiConnectedStatus();
          logger.info("MongoDB Data API connected for Worker runtime.");
        } catch (error) {
          logger.error("MongoDB Data API connection failed in Worker runtime.", error);
          db = null;
          dbStatus = createDataApiDisconnectedStatus(
            "MongoDB Data API connection failed. Check URL, API key, data source, and DB name.",
          );
        }
      }

      if (!db && dbStatus.mode === "memory") {
        dbStatus = createMemoryOnlyStatus(getUnconfiguredReason(envConfig));
      }

      return {
        startedAt: Date.now(),
        envConfig,
        dbStatus,
        mongoClient,
        firebaseTokenVerifier: null,
        repositories: createRepositories({
          db,
          logger,
        }),
      };
    })();
  }

  return workerStatePromise;
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

  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key");

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

const validateMediaPayload = (body) => {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object";
  }
  if (typeof body.url !== "string" || body.url.trim().length < 3 || body.url.trim().length > 2048) {
    return "url is required and must be 3-2048 characters";
  }
  if (body.name !== undefined && (typeof body.name !== "string" || body.name.length > 140)) {
    return "name must be a string with max 140 characters";
  }
  if (body.type !== undefined && (typeof body.type !== "string" || body.type.length > 40)) {
    return "type must be a string with max 40 characters";
  }
  if (body.alt !== undefined && (typeof body.alt !== "string" || body.alt.length > 300)) {
    return "alt must be a string with max 300 characters";
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 30) {
      return "tags must be an array with max 30 items";
    }
    const invalidTag = body.tags.some((tag) => typeof tag !== "string" || tag.length > 40);
    if (invalidTag) {
      return "each tag must be a string with max 40 characters";
    }
  }
  return "";
};

const handleMediaGet = async (request, state) => {
  const { envConfig, repositories } = state;
  const url = new URL(request.url);
  const type = ensureString(url.searchParams.get("type")).slice(0, 40);
  const sort = ensureString(url.searchParams.get("sort") || "desc").toLowerCase();
  if (!["asc", "desc"].includes(sort)) {
    return jsonResponse(request, envConfig, 400, { error: "sort must be 'asc' or 'desc'" });
  }

  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw === null ? 50 : Number.parseInt(limitRaw, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return jsonResponse(request, envConfig, 400, { error: "limit must be an integer between 1 and 100" });
  }

  const media = await repositories.listMedia({ type, limit, sort });
  return jsonResponse(
    request,
    envConfig,
    200,
    {
      count: media.length,
      data: media,
    },
    {
      "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
    },
  );
};

const handleMediaPost = async (request, state) => {
  const { envConfig, repositories } = state;
  const body = await parseRequestBody(request, envConfig);
  const validationError = validateMediaPayload(body);
  if (validationError) {
    return jsonResponse(request, envConfig, 400, { error: validationError });
  }

  try {
    const created = await repositories.addMedia(body);
    return jsonResponse(request, envConfig, 201, {
      message: "Media created successfully",
      data: created,
    });
  } catch (error) {
    if (error?.statusCode && error.statusCode >= 400) {
      const payload = {
        error: error.message,
      };
      if (error.media) {
        payload.data = error.media;
      }
      return jsonResponse(request, envConfig, error.statusCode, payload);
    }
    throw error;
  }
};

const isValidSnippetOwnerKey = (value) => typeof value === "string" && value.trim().length >= 8;

const validateSnippetPayload = (body) => {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object";
  }

  if (!isValidSnippetOwnerKey(body.ownerKey)) {
    return "ownerKey is required and must be at least 8 characters";
  }

  if (typeof body.content !== "string" || body.content.trim().length < 1 || body.content.length > 12000) {
    return "content is required and must be 1-12000 characters";
  }

  if (body.title !== undefined && (typeof body.title !== "string" || body.title.length > 120)) {
    return "title must be a string with max 120 characters";
  }

  return "";
};

const handleTtsSnippetsGet = async (request, state) => {
  const { envConfig, repositories } = state;
  const url = new URL(request.url);
  const ownerKey = ensureString(url.searchParams.get("ownerKey")).trim();

  if (!isValidSnippetOwnerKey(ownerKey)) {
    return jsonResponse(request, envConfig, 400, {
      error: "ownerKey is required and must be at least 8 characters",
    });
  }

  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw === null ? 6 : Number.parseInt(limitRaw, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    return jsonResponse(request, envConfig, 400, {
      error: "limit must be an integer between 1 and 20",
    });
  }

  const snippets = await repositories.listTtsSnippets({ ownerKey, limit });
  return jsonResponse(
    request,
    envConfig,
    200,
    {
      count: snippets.length,
      data: snippets,
    },
    {
      "Cache-Control": "no-store",
    },
  );
};

const handleTtsSnippetsPost = async (request, state) => {
  const { envConfig, repositories } = state;
  const body = await parseRequestBody(request, envConfig);
  const validationError = validateSnippetPayload(body);
  if (validationError) {
    return jsonResponse(request, envConfig, 400, { error: validationError });
  }

  try {
    const created = await repositories.addTtsSnippet(body);
    return jsonResponse(request, envConfig, 201, {
      message: "Snippet saved successfully",
      data: created,
    });
  } catch (error) {
    if (error?.statusCode && error.statusCode >= 400) {
      const payload = {
        error: error.message,
      };
      if (error.snippet) {
        payload.data = error.snippet;
      }
      return jsonResponse(request, envConfig, error.statusCode, payload);
    }
    throw error;
  }
};

const handleTtsSnippetsDelete = async (request, state, snippetId) => {
  const { envConfig, repositories } = state;
  const url = new URL(request.url);
  const ownerKey = ensureString(url.searchParams.get("ownerKey")).trim();
  const id = ensureString(snippetId).trim();

  if (!id) {
    return jsonResponse(request, envConfig, 400, { error: "Snippet id is required" });
  }

  if (!isValidSnippetOwnerKey(ownerKey)) {
    return jsonResponse(request, envConfig, 400, {
      error: "ownerKey is required and must be at least 8 characters",
    });
  }

  const result = await repositories.removeTtsSnippet({ ownerKey, id });
  if (!result.removed) {
    return jsonResponse(request, envConfig, 404, { error: "Snippet not found" });
  }

  return jsonResponse(request, envConfig, 200, {
    message: "Snippet removed successfully",
  });
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
  if (requestedProvider && !["auto", "gemini", "groq", "openai"].includes(requestedProvider)) {
    return jsonResponse(request, envConfig, 400, { error: "provider must be one of: auto, gemini, groq, openai" });
  }
  if (requestedProvider === "gemini" && !envConfig.geminiApiKey) {
    return jsonResponse(request, envConfig, 503, { error: "Gemini is not configured on the backend." });
  }
  if (requestedProvider === "groq" && !envConfig.groqApiKey) {
    return jsonResponse(request, envConfig, 503, { error: "Groq is not configured on the backend." });
  }
  if (requestedProvider === "openai" && !envConfig.openaiApiKey) {
    return jsonResponse(request, envConfig, 503, { error: "OpenAI is not configured on the backend." });
  }

  const provider = resolveChatProvider(requestedProvider || "auto", envConfig);
  if (!provider) {
    return jsonResponse(request, envConfig, 503, {
      error: "No AI text provider is configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in backend .env.",
    });
  }

  const model = ensureString(
    body.model ||
      (provider === "gemini"
        ? envConfig.geminiChatModel
        : provider === "groq"
          ? envConfig.groqChatModel
          : envConfig.openaiChatModel) ||
      "",
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
    } else if (provider === "groq") {
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
    } else {
      const endpoint = `${envConfig.openaiBaseUrl}/chat/completions`;
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
          Authorization: `Bearer ${envConfig.openaiApiKey}`,
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

  const text =
    provider === "gemini"
      ? getTextFromGeminiResponse(payload)
      : provider === "groq"
        ? getTextFromGroqResponse(payload)
        : getTextFromOpenAIResponse(payload);
  if (!text) {
    return jsonResponse(request, envConfig, 502, { error: `${provider} returned an empty response.` });
  }

  return jsonResponse(request, envConfig, 200, {
    provider,
    model,
    text,
  });
};

const isValidHistoryId = (value) => typeof value === "string" && value.trim().length >= 6 && value.trim().length <= 120;

const validateHistoryPayload = (body) => {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object";
  }

  if (body.title !== undefined && (typeof body.title !== "string" || body.title.length > 120)) {
    return "title must be a string with max 120 characters";
  }

  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 80) {
    return "messages must be an array with 1-80 items";
  }

  for (const message of body.messages) {
    if (typeof message !== "object" || message === null) {
      return "each message must be an object";
    }
    if (!["user", "assistant"].includes(String(message.role || ""))) {
      return "message role must be either user or assistant";
    }
    const text = String(message.text || "").trim();
    if (!text || text.length > 12000) {
      return "message text must be 1-12000 characters";
    }
    if (message.createdAt !== undefined && (typeof message.createdAt !== "string" || message.createdAt.length > 64)) {
      return "message createdAt must be a string with max 64 characters";
    }
  }

  return "";
};

const getAuthenticatedUser = async (request, state) => {
  const { envConfig } = state;

  if (!envConfig.firebaseProjectId && !envConfig.firebaseAuthTestMode) {
    return {
      errorResponse: jsonResponse(request, envConfig, 503, {
        error: "Firebase auth is not configured on this backend.",
      }),
    };
  }

  if (!state.firebaseTokenVerifier) {
    state.firebaseTokenVerifier = createFirebaseTokenVerifier({
      projectId: envConfig.firebaseProjectId,
      jwksUrl: envConfig.firebaseJwksUrl,
      testMode: envConfig.firebaseAuthTestMode,
    });
  }

  try {
    const user = await state.firebaseTokenVerifier.verifyAuthorizationHeader(request.headers.get("authorization"));
    return { user };
  } catch (error) {
    return {
      errorResponse: jsonResponse(request, envConfig, 401, {
        error: "Unauthorized",
        details: error?.message || "Invalid Firebase token.",
      }),
    };
  }
};

const handleAiHistoryListGet = async (request, state) => {
  const { envConfig, repositories } = state;
  const authResult = await getAuthenticatedUser(request, state);
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw === null ? 30 : Number.parseInt(limitRaw, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return jsonResponse(request, envConfig, 400, { error: "limit must be an integer between 1 and 50" });
  }

  const items = await repositories.listAiConversations({
    ownerUid: authResult.user.uid,
    limit,
  });

  return jsonResponse(
    request,
    envConfig,
    200,
    {
      count: items.length,
      data: items,
    },
    {
      "Cache-Control": "no-store",
    },
  );
};

const handleAiHistoryGet = async (request, state, conversationId) => {
  const { envConfig, repositories } = state;
  const authResult = await getAuthenticatedUser(request, state);
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }

  const normalizedId = ensureString(conversationId).trim();
  if (!isValidHistoryId(normalizedId)) {
    return jsonResponse(request, envConfig, 400, { error: "Conversation id is invalid" });
  }

  const conversation = await repositories.getAiConversation({
    ownerUid: authResult.user.uid,
    id: normalizedId,
  });
  if (!conversation) {
    return jsonResponse(request, envConfig, 404, { error: "Conversation not found" });
  }

  return jsonResponse(
    request,
    envConfig,
    200,
    {
      data: conversation,
    },
    {
      "Cache-Control": "no-store",
    },
  );
};

const handleAiHistoryPut = async (request, state, conversationId) => {
  const { envConfig, repositories } = state;
  const authResult = await getAuthenticatedUser(request, state);
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }

  const normalizedId = ensureString(conversationId).trim();
  if (!isValidHistoryId(normalizedId)) {
    return jsonResponse(request, envConfig, 400, { error: "Conversation id is invalid" });
  }

  const body = await parseRequestBody(request, envConfig);
  const validationError = validateHistoryPayload(body);
  if (validationError) {
    return jsonResponse(request, envConfig, 400, { error: validationError });
  }

  const saved = await repositories.upsertAiConversation({
    ownerUid: authResult.user.uid,
    ownerEmail: authResult.user.email,
    ownerName: authResult.user.name,
    id: normalizedId,
    title: ensureString(body.title),
    messages: body.messages,
  });

  return jsonResponse(request, envConfig, 200, {
    message: "Conversation saved successfully",
    data: saved,
  });
};

const handleAiHistoryDelete = async (request, state, conversationId) => {
  const { envConfig, repositories } = state;
  const authResult = await getAuthenticatedUser(request, state);
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }

  const normalizedId = ensureString(conversationId).trim();
  if (!isValidHistoryId(normalizedId)) {
    return jsonResponse(request, envConfig, 400, { error: "Conversation id is invalid" });
  }

  const result = await repositories.removeAiConversation({
    ownerUid: authResult.user.uid,
    id: normalizedId,
  });
  if (!result.removed) {
    return jsonResponse(request, envConfig, 404, { error: "Conversation not found" });
  }

  return jsonResponse(request, envConfig, 200, {
    message: "Conversation removed successfully",
  });
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
    const isDbConfigured = Boolean(
      envConfig.mongodbDataApiUrl || envConfig.mongodbDataApiKey || envConfig.mongodbUri,
    );
    const ready = !isDbConfigured || dbStatus.connected;
    return jsonResponse(request, envConfig, ready ? 200 : 503, {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  }

  if (path === "/api/courses" && method === "GET") {
    return handleCoursesGet(request, state);
  }

  if (path === "/api/projects/certificate-gen" && method === "GET") {
    return handleCoursesGet(request, state);
  }

  if (path === "/api/courses" && method === "POST") {
    return handleCoursesPost(request, state);
  }

  if (path === "/api/media" && method === "GET") {
    return handleMediaGet(request, state);
  }

  if (path === "/api/media" && method === "POST") {
    return handleMediaPost(request, state);
  }

  if (path === "/api/tts/snippets" && method === "GET") {
    return handleTtsSnippetsGet(request, state);
  }

  if (path === "/api/tts/snippets" && method === "POST") {
    return handleTtsSnippetsPost(request, state);
  }

  if (path.startsWith("/api/tts/snippets/") && method === "DELETE") {
    const snippetId = decodeURIComponent(path.slice("/api/tts/snippets/".length));
    return handleTtsSnippetsDelete(request, state, snippetId);
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

  if (path === "/api/ai/history" && method === "GET") {
    return handleAiHistoryListGet(request, state);
  }

  if (path.startsWith("/api/ai/history/")) {
    const conversationId = decodeURIComponent(path.slice("/api/ai/history/".length));
    if (method === "GET") {
      return handleAiHistoryGet(request, state, conversationId);
    }
    if (method === "PUT") {
      return handleAiHistoryPut(request, state, conversationId);
    }
    if (method === "DELETE") {
      return handleAiHistoryDelete(request, state, conversationId);
    }
  }

  return jsonResponse(request, envConfig, 404, {
    error: "Route not found",
    path: `${path}${url.search}`,
  });
};

export default {
  async fetch(request, env) {
    const state = await getState(env);
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
