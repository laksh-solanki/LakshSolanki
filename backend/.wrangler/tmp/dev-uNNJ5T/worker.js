var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");

// node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/.pnpm/@cloudflare+unenv-preset@2._c15130b02139244a0eacc776aa5b24d4/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// src/lib/email.js
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var normalizeEmail = /* @__PURE__ */ __name((value) => value?.trim().toLowerCase() || "", "normalizeEmail");
var isValidEmail = /* @__PURE__ */ __name((value) => EMAIL_REGEX.test(normalizeEmail(value)), "isValidEmail");

// src/services/repositories.js
var escapeRegExp = /* @__PURE__ */ __name((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "escapeRegExp");
var normalizeCourseName = /* @__PURE__ */ __name((value) => value.trim().replace(/\s+/g, " ").toLowerCase(), "normalizeCourseName");
var createCourseRecord = /* @__PURE__ */ __name(({ name, category, level, durationHours, tags = [] }) => {
  const trimmedName = name.trim().replace(/\s+/g, " ");
  return {
    name: trimmedName,
    normalizedName: normalizeCourseName(trimmedName),
    category: category?.trim() || null,
    level: level?.trim() || null,
    durationHours: Number.isFinite(durationHours) ? durationHours : null,
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : []
  };
}, "createCourseRecord");
var toPublicDocument = /* @__PURE__ */ __name((document) => {
  if (!document) return null;
  const { _id, normalizedName, ...rest } = document;
  return {
    id: _id ? _id.toString() : rest.id,
    ...rest
  };
}, "toPublicDocument");
var nowIso = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "nowIso");
var generateId = /* @__PURE__ */ __name(() => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}, "generateId");
var clone = /* @__PURE__ */ __name((value) => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}, "clone");
var createRepositories = /* @__PURE__ */ __name(({ db, logger: logger2 }) => {
  const memoryStore = {
    courses: [],
    subscriptions: []
  };
  const coursesCollection = db?.collection("courses");
  const subscriptionsCollection = db?.collection("subscriptions");
  const listCourses = /* @__PURE__ */ __name(async ({ search = "", limit = 50, sort = "asc" }) => {
    const normalizedSearch = search.trim();
    const direction = sort === "desc" ? -1 : 1;
    if (coursesCollection) {
      const filter = normalizedSearch ? { name: { $regex: escapeRegExp(normalizedSearch), $options: "i" } } : {};
      const courses = await coursesCollection.find(filter).sort({ name: direction }).limit(limit).toArray();
      return courses.map(toPublicDocument);
    }
    const lowered = normalizedSearch.toLowerCase();
    const filtered = memoryStore.courses.filter(
      (course) => normalizedSearch ? course.name.toLowerCase().includes(lowered) : true
    );
    const sorted = filtered.sort(
      (a, b) => direction === 1 ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    return clone(sorted.slice(0, limit));
  }, "listCourses");
  const addCourse = /* @__PURE__ */ __name(async ({ name, category, level, durationHours, tags = [] }) => {
    const now = nowIso();
    const course = {
      ...createCourseRecord({ name, category, level, durationHours, tags }),
      createdAt: now,
      updatedAt: now
    };
    if (coursesCollection) {
      const existingCourse2 = await coursesCollection.findOne({
        $or: [
          { normalizedName: course.normalizedName },
          { name: { $regex: `^${escapeRegExp(course.name)}$`, $options: "i" } }
        ]
      });
      if (existingCourse2) {
        const error = new Error("Course already exists");
        error.statusCode = 409;
        error.course = toPublicDocument(existingCourse2);
        throw error;
      }
      try {
        const result = await coursesCollection.insertOne(course);
        return toPublicDocument({ _id: result.insertedId, ...course });
      } catch (error) {
        if (error?.code === 11e3) {
          const existingDuplicate = await coursesCollection.findOne({
            $or: [
              { normalizedName: course.normalizedName },
              { name: { $regex: `^${escapeRegExp(course.name)}$`, $options: "i" } }
            ]
          });
          const duplicateError = new Error("Course already exists");
          duplicateError.statusCode = 409;
          duplicateError.course = toPublicDocument(existingDuplicate);
          throw duplicateError;
        }
        throw error;
      }
    }
    const existingCourse = memoryStore.courses.find(
      (record2) => record2.normalizedName === course.normalizedName
    );
    if (existingCourse) {
      const error = new Error("Course already exists");
      error.statusCode = 409;
      error.course = toPublicDocument(existingCourse);
      throw error;
    }
    const record = { id: generateId(), ...course };
    memoryStore.courses.push(record);
    return toPublicDocument(record);
  }, "addCourse");
  const subscribe = /* @__PURE__ */ __name(async ({ email, name = "", source = "web", ip = "", userAgent = "" }) => {
    const normalized = normalizeEmail(email);
    const now = nowIso();
    if (subscriptionsCollection) {
      const existing2 = await subscriptionsCollection.findOne({ normalizedEmail: normalized });
      if (existing2?.status === "active") {
        return { status: "already_subscribed", subscription: toPublicDocument(existing2) };
      }
      if (existing2 && existing2.status !== "active") {
        await subscriptionsCollection.updateOne(
          { _id: existing2._id },
          {
            $set: {
              status: "active",
              name: name || existing2.name || "",
              source,
              ip,
              userAgent,
              updatedAt: now,
              unsubscribedAt: null
            }
          }
        );
        const updated = await subscriptionsCollection.findOne({ _id: existing2._id });
        return { status: "reactivated", subscription: toPublicDocument(updated) };
      }
      const subscription2 = {
        email: normalized,
        normalizedEmail: normalized,
        name: name.trim(),
        source,
        status: "active",
        ip,
        userAgent,
        createdAt: now,
        updatedAt: now,
        unsubscribedAt: null
      };
      try {
        const result = await subscriptionsCollection.insertOne(subscription2);
        return {
          status: "created",
          subscription: toPublicDocument({ _id: result.insertedId, ...subscription2 })
        };
      } catch (error) {
        if (error?.code === 11e3) {
          logger2.warn({ email: normalized }, "Duplicate subscription creation blocked by unique index.");
          return { status: "already_subscribed", subscription: null };
        }
        throw error;
      }
    }
    const existing = memoryStore.subscriptions.find((item) => item.normalizedEmail === normalized);
    if (existing?.status === "active") {
      return { status: "already_subscribed", subscription: clone(existing) };
    }
    if (existing && existing.status !== "active") {
      existing.status = "active";
      existing.name = name || existing.name || "";
      existing.source = source;
      existing.ip = ip;
      existing.userAgent = userAgent;
      existing.updatedAt = now;
      existing.unsubscribedAt = null;
      return { status: "reactivated", subscription: clone(existing) };
    }
    const subscription = {
      id: generateId(),
      email: normalized,
      normalizedEmail: normalized,
      name: name.trim(),
      source,
      status: "active",
      ip,
      userAgent,
      createdAt: now,
      updatedAt: now,
      unsubscribedAt: null
    };
    memoryStore.subscriptions.push(subscription);
    return { status: "created", subscription: clone(subscription) };
  }, "subscribe");
  const getSubscriptionStatus = /* @__PURE__ */ __name(async ({ email }) => {
    const normalized = normalizeEmail(email);
    if (subscriptionsCollection) {
      const subscription2 = await subscriptionsCollection.findOne({ normalizedEmail: normalized });
      if (!subscription2) {
        return { exists: false, subscribed: false, status: "not_found", subscription: null };
      }
      return {
        exists: true,
        subscribed: subscription2.status === "active",
        status: subscription2.status,
        subscription: toPublicDocument(subscription2)
      };
    }
    const subscription = memoryStore.subscriptions.find((item) => item.normalizedEmail === normalized);
    if (!subscription) {
      return { exists: false, subscribed: false, status: "not_found", subscription: null };
    }
    return {
      exists: true,
      subscribed: subscription.status === "active",
      status: subscription.status,
      subscription: clone(subscription)
    };
  }, "getSubscriptionStatus");
  const unsubscribe = /* @__PURE__ */ __name(async ({ email }) => {
    const normalized = normalizeEmail(email);
    const now = nowIso();
    if (subscriptionsCollection) {
      const subscription2 = await subscriptionsCollection.findOne({ normalizedEmail: normalized });
      if (!subscription2) {
        return { status: "not_found", subscription: null };
      }
      if (subscription2.status === "unsubscribed") {
        return { status: "already_unsubscribed", subscription: toPublicDocument(subscription2) };
      }
      await subscriptionsCollection.updateOne(
        { _id: subscription2._id },
        {
          $set: {
            status: "unsubscribed",
            updatedAt: now,
            unsubscribedAt: now
          }
        }
      );
      const updated = await subscriptionsCollection.findOne({ _id: subscription2._id });
      return { status: "unsubscribed", subscription: toPublicDocument(updated) };
    }
    const subscription = memoryStore.subscriptions.find((item) => item.normalizedEmail === normalized);
    if (!subscription) {
      return { status: "not_found", subscription: null };
    }
    if (subscription.status === "unsubscribed") {
      return { status: "already_unsubscribed", subscription: clone(subscription) };
    }
    subscription.status = "unsubscribed";
    subscription.updatedAt = now;
    subscription.unsubscribedAt = now;
    return { status: "unsubscribed", subscription: clone(subscription) };
  }, "unsubscribe");
  return {
    listCourses,
    addCourse,
    subscribe,
    getSubscriptionStatus,
    unsubscribe
  };
}, "createRepositories");

// src/worker.js
var REQUEST_TIMEOUT_MS = 8e4;
var GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
var METHODS_WITHOUT_BODY = /* @__PURE__ */ new Set(["GET", "HEAD"]);
var workerState;
var logger = {
  info: /* @__PURE__ */ __name((...args) => console.log(...args), "info"),
  warn: /* @__PURE__ */ __name((...args) => console.warn(...args), "warn"),
  error: /* @__PURE__ */ __name((...args) => console.error(...args), "error")
};
var toPositiveInt = /* @__PURE__ */ __name((value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}, "toPositiveInt");
var toNumberInRange = /* @__PURE__ */ __name((value, fallback, { min, max }) => {
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
}, "toNumberInRange");
var toBoolean = /* @__PURE__ */ __name((value, fallback) => {
  if (value === void 0 || value === null || value === "") {
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
}, "toBoolean");
var parseCommaSeparated = /* @__PURE__ */ __name((value) => value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [], "parseCommaSeparated");
var parseCorsOrigins = /* @__PURE__ */ __name((value) => {
  const raw = value?.trim();
  if (!raw) return ["*"];
  return parseCommaSeparated(raw);
}, "parseCorsOrigins");
var parseAiProvider = /* @__PURE__ */ __name((value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["auto", "gemini", "groq"].includes(normalized)) {
    return normalized;
  }
  return "auto";
}, "parseAiProvider");
var getEnvConfig = /* @__PURE__ */ __name((bindings = {}) => {
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
    aiSystemPrompt: source.AI_SYSTEM_PROMPT?.trim() || "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first, then add implementation details, edge cases, and simple teaching guidance when useful.",
    aiTemperature: toNumberInRange(source.AI_TEMPERATURE, 1.5, { min: 0, max: 2 }),
    aiMaxOutputTokens: toPositiveInt(source.AI_MAX_OUTPUT_TOKENS, 2e3),
    imageApiKey: source.IMAGE_API_KEY?.trim() || "",
    imageInvokeUrl: source.IMAGE_INVOKE_URL?.trim() || "",
    imageModel: source.IMAGE_MODEL?.trim() || "",
    imageSize: source.IMAGE_SIZE?.trim() || "1024x1024"
  });
}, "getEnvConfig");
var createDatabaseStatus = /* @__PURE__ */ __name((envConfig) => {
  if (!envConfig.mongodbUri) {
    return {
      mode: "memory",
      enabled: false,
      connected: false,
      reason: "MONGODB_URI not configured",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  return {
    mode: "memory",
    enabled: false,
    connected: false,
    reason: "MongoDB driver is disabled in Cloudflare Worker mode.",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}, "createDatabaseStatus");
var getState = /* @__PURE__ */ __name((bindings) => {
  if (!workerState) {
    const envConfig = getEnvConfig(bindings);
    workerState = {
      startedAt: Date.now(),
      envConfig,
      dbStatus: createDatabaseStatus(envConfig),
      repositories: createRepositories({
        db: null,
        logger
      })
    };
  }
  return workerState;
}, "getState");
var getUptimeSeconds = /* @__PURE__ */ __name((startedAt) => Number(((Date.now() - startedAt) / 1e3).toFixed(1)), "getUptimeSeconds");
var getCorsOriginHeader = /* @__PURE__ */ __name((request, envConfig) => {
  if (envConfig.corsOrigins.includes("*")) {
    return "*";
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return "";
  }
  const isAllowed = envConfig.corsOrigins.some(
    (allowedOrigin) => allowedOrigin.toLowerCase() === origin.toLowerCase()
  );
  return isAllowed ? origin : "";
}, "getCorsOriginHeader");
var isCorsRejected = /* @__PURE__ */ __name((request, envConfig) => {
  if (envConfig.corsOrigins.includes("*")) {
    return false;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  return !envConfig.corsOrigins.some(
    (allowedOrigin) => allowedOrigin.toLowerCase() === origin.toLowerCase()
  );
}, "isCorsRejected");
var getSecurityHeaders = /* @__PURE__ */ __name((envConfig) => {
  if (!envConfig.enableSecurityHeaders) {
    return {};
  }
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };
  if (envConfig.nodeEnv === "production") {
    headers["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains";
  }
  return headers;
}, "getSecurityHeaders");
var createBaseHeaders = /* @__PURE__ */ __name((request, envConfig, extras = {}) => {
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
}, "createBaseHeaders");
var jsonResponse = /* @__PURE__ */ __name((request, envConfig, status, payload, extras = {}) => {
  const headers = createBaseHeaders(request, envConfig, {
    "Content-Type": "application/json; charset=utf-8",
    ...extras
  });
  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}, "jsonResponse");
var emptyResponse = /* @__PURE__ */ __name((request, envConfig, status, extras = {}) => new Response(null, {
  status,
  headers: createBaseHeaders(request, envConfig, extras)
}), "emptyResponse");
var getClientIp = /* @__PURE__ */ __name((request) => {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) {
    return cfIp.trim();
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded?.trim()) {
    return "";
  }
  return forwarded.split(",")[0]?.trim() || "";
}, "getClientIp");
var parseRequestBody = /* @__PURE__ */ __name(async (request, envConfig) => {
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
}, "parseRequestBody");
var isLikelyJson = /* @__PURE__ */ __name((contentType = "") => contentType.toLowerCase().includes("application/json"), "isLikelyJson");
var isLikelyImage = /* @__PURE__ */ __name((contentType = "") => contentType.toLowerCase().startsWith("image/"), "isLikelyImage");
var isNvidiaStabilityInvokeUrl = /* @__PURE__ */ __name((invokeUrl = "") => /ai\.api\.nvidia\.com\/v1\/genai\/stabilityai\//i.test(invokeUrl), "isNvidiaStabilityInvokeUrl");
var clampNumber = /* @__PURE__ */ __name((value, fallback, { min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
}, "clampNumber");
var clampInteger = /* @__PURE__ */ __name((value, fallback, { min, max }) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
}, "clampInteger");
var getTextFromGeminiResponse = /* @__PURE__ */ __name((data) => data?.candidates?.[0]?.content?.parts?.map((part) => typeof part?.text === "string" ? part.text : "").join("").trim() || "", "getTextFromGeminiResponse");
var getTextFromGroqResponse = /* @__PURE__ */ __name((data) => {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => typeof part?.text === "string" ? part.text : "").join("").trim();
  }
  return "";
}, "getTextFromGroqResponse");
var sanitizeChatMessages = /* @__PURE__ */ __name((messages = []) => messages.map((message) => ({
  role: message?.role === "assistant" ? "assistant" : "user",
  text: String(message?.text || "").trim()
})).filter((message) => message.text.length > 0), "sanitizeChatMessages");
var buildGeminiContents = /* @__PURE__ */ __name((messages = []) => messages.map((message) => ({
  role: message.role === "assistant" ? "model" : "user",
  parts: [{ text: message.text }]
})), "buildGeminiContents");
var buildGroqMessages = /* @__PURE__ */ __name((messages = [], systemPrompt = "") => {
  const conversation = messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.text
  }));
  if (!systemPrompt) return conversation;
  return [{ role: "system", content: systemPrompt }, ...conversation];
}, "buildGroqMessages");
var buildImagePayload = /* @__PURE__ */ __name(({ prompt, invokeUrl, model, size }) => {
  if (/huggingface|api-inference\.huggingface/i.test(invokeUrl)) {
    return {
      inputs: prompt,
      options: { wait_for_model: true }
    };
  }
  if (isNvidiaStabilityInvokeUrl(invokeUrl)) {
    return { prompt };
  }
  const payload = { prompt };
  if (model) payload.model = model;
  if (size) payload.size = size;
  return payload;
}, "buildImagePayload");
var readUpstreamError = /* @__PURE__ */ __name(async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (isLikelyJson(contentType)) {
    const data = await response.json().catch(() => null);
    const message = data?.error?.message || data?.error || data?.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  const text = await response.text().catch(() => "");
  if (text.trim()) return text.trim().slice(0, 500);
  return `Upstream AI API failed (${response.status}).`;
}, "readUpstreamError");
var resolveChatProvider = /* @__PURE__ */ __name((requestedProvider, envConfig) => {
  const hasGemini = Boolean(envConfig.geminiApiKey);
  const hasGroq = Boolean(envConfig.groqApiKey);
  const preferred = requestedProvider || envConfig.aiDefaultProvider || "auto";
  if (preferred === "gemini") return hasGemini ? "gemini" : "";
  if (preferred === "groq") return hasGroq ? "groq" : "";
  if (hasGemini) return "gemini";
  if (hasGroq) return "groq";
  return "";
}, "resolveChatProvider");
var arrayBufferToBase64 = /* @__PURE__ */ __name((buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}, "arrayBufferToBase64");
var ensureString = /* @__PURE__ */ __name((value) => typeof value === "string" ? value : "", "ensureString");
var handleCoursesGet = /* @__PURE__ */ __name(async (request, state) => {
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
      data: courses
    },
    {
      "Cache-Control": "public, max-age=120, stale-while-revalidate=300"
    }
  );
}, "handleCoursesGet");
var validateCoursePayload = /* @__PURE__ */ __name((body) => {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object";
  }
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 140) {
    return "name is required and must be 2-140 characters";
  }
  if (body.category !== void 0 && (typeof body.category !== "string" || body.category.length > 80)) {
    return "category must be a string with max 80 characters";
  }
  if (body.level !== void 0 && (typeof body.level !== "string" || body.level.length > 40)) {
    return "level must be a string with max 40 characters";
  }
  if (body.durationHours !== void 0 && (!Number.isFinite(body.durationHours) || body.durationHours < 1 || body.durationHours > 1e3)) {
    return "durationHours must be between 1 and 1000";
  }
  if (body.tags !== void 0) {
    if (!Array.isArray(body.tags) || body.tags.length > 20) {
      return "tags must be an array with max 20 items";
    }
    const invalidTag = body.tags.some((tag) => typeof tag !== "string" || tag.length > 30);
    if (invalidTag) {
      return "each tag must be a string with max 30 characters";
    }
  }
  return "";
}, "validateCoursePayload");
var handleCoursesPost = /* @__PURE__ */ __name(async (request, state) => {
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
      data: created
    });
  } catch (error) {
    if (error?.statusCode && error.statusCode >= 400) {
      const payload = {
        error: error.message
      };
      if (error.course) {
        payload.data = error.course;
      }
      return jsonResponse(request, envConfig, error.statusCode, payload);
    }
    throw error;
  }
}, "handleCoursesPost");
var handleSubscribePost = /* @__PURE__ */ __name(async (request, state) => {
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
    userAgent: request.headers.get("user-agent") || ""
  });
  if (result.status === "already_subscribed") {
    return jsonResponse(request, envConfig, 409, { error: "Email already subscribed" });
  }
  if (result.status === "reactivated") {
    return jsonResponse(request, envConfig, 200, {
      message: "Subscription restored successfully",
      id: result.subscription?.id
    });
  }
  return jsonResponse(request, envConfig, 201, {
    message: "Subscribed successfully",
    id: result.subscription?.id
  });
}, "handleSubscribePost");
var handleSubscribeStatusGet = /* @__PURE__ */ __name(async (request, state) => {
  const { envConfig, repositories } = state;
  const url = new URL(request.url);
  const email = ensureString(url.searchParams.get("email"));
  if (!isValidEmail(email)) {
    return jsonResponse(request, envConfig, 200, {
      subscribed: false,
      status: "invalid_email"
    });
  }
  const result = await repositories.getSubscriptionStatus({ email });
  return jsonResponse(request, envConfig, 200, {
    email: normalizeEmail(email),
    subscribed: result.subscribed,
    status: result.status,
    details: result.subscription
  });
}, "handleSubscribeStatusGet");
var handleSubscribeDelete = /* @__PURE__ */ __name(async (request, state) => {
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
}, "handleSubscribeDelete");
var handleAiChatPost = /* @__PURE__ */ __name(async (request, state) => {
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
      error: "No AI text provider is configured. Set GEMINI_API_KEY or GROQ_API_KEY in backend .env."
    });
  }
  const model = ensureString(
    body.model || (provider === "gemini" ? envConfig.geminiChatModel : envConfig.groqChatModel) || ""
  ).trim();
  if (!model) {
    return jsonResponse(request, envConfig, 500, { error: "AI model is not configured on the backend." });
  }
  const systemPrompt = ensureString(body.systemPrompt || envConfig.aiSystemPrompt).trim();
  const temperature = clampNumber(body.temperature, envConfig.aiTemperature, { min: 0, max: 2 });
  const maxOutputTokens = clampInteger(body.maxOutputTokens, envConfig.aiMaxOutputTokens, {
    min: 1,
    max: 8192
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let upstreamResponse;
  try {
    if (provider === "gemini") {
      const payload2 = {
        contents: buildGeminiContents(messages),
        generationConfig: {
          temperature,
          maxOutputTokens
        }
      };
      if (systemPrompt) {
        payload2.system_instruction = { parts: [{ text: systemPrompt }] };
      }
      const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
        envConfig.geminiApiKey
      )}`;
      upstreamResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload2)
      });
    } else {
      const endpoint = `${envConfig.groqApiBase}/chat/completions`;
      const payload2 = {
        model,
        messages: buildGroqMessages(messages, systemPrompt),
        temperature,
        max_tokens: maxOutputTokens,
        stream: false
      };
      upstreamResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${envConfig.groqApiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify(payload2)
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      return jsonResponse(request, envConfig, 504, { error: "AI text request timed out." });
    }
    return jsonResponse(request, envConfig, 502, {
      error: `Unable to reach ${provider} API: ${error?.message || "network error"}`
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
    text
  });
}, "handleAiChatPost");
var handleAiImagePost = /* @__PURE__ */ __name(async (request, state) => {
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
      error: "Image invoke URL is missing. Set IMAGE_INVOKE_URL in backend or pass invokeUrl."
    });
  }
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, image/*"
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
      body: JSON.stringify(buildImagePayload({ prompt, invokeUrl, model, size }))
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      return jsonResponse(request, envConfig, 504, { error: "Image request timed out." });
    }
    return jsonResponse(request, envConfig, 502, {
      error: `Unable to reach image API: ${error?.message || "network error"}`
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
      mime_type: contentType || "image/png"
    });
  }
  if (isLikelyJson(contentTypeHeader)) {
    const data = await upstreamResponse.json().catch(() => null);
    return jsonResponse(request, envConfig, 200, { data });
  }
  const text = await upstreamResponse.text().catch(() => "");
  return jsonResponse(request, envConfig, 200, { data: text });
}, "handleAiImagePost");
var handleRoute = /* @__PURE__ */ __name(async (request, state) => {
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
      time: (/* @__PURE__ */ new Date()).toISOString(),
      uptimeSeconds: getUptimeSeconds(startedAt),
      mode: dbStatus.mode
    });
  }
  if (path === "/health" && method === "GET") {
    return jsonResponse(request, envConfig, 200, {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptimeSeconds: getUptimeSeconds(startedAt)
    });
  }
  if (path === "/ready" && method === "GET") {
    const ready = true;
    return jsonResponse(request, envConfig, 200, {
      status: ready ? "ready" : "not_ready",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: dbStatus
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
    path: `${path}${url.search}`
  });
}, "handleRoute");
var worker_default = {
  async fetch(request, env) {
    const state = getState(env);
    const { envConfig } = state;
    if (isCorsRejected(request, envConfig)) {
      return jsonResponse(request, envConfig, 403, {
        error: "Origin not allowed by CORS"
      });
    }
    try {
      if (!METHODS_WITHOUT_BODY.has(request.method.toUpperCase())) {
        const contentLength = Number.parseInt(request.headers.get("content-length") || "", 10);
        if (Number.isFinite(contentLength) && contentLength > envConfig.maxRequestBodyBytes) {
          return jsonResponse(request, envConfig, 413, {
            error: "Request payload too large"
          });
        }
      }
      return await handleRoute(request, state);
    } catch (error) {
      const statusCode = Number.isInteger(error?.statusCode) && error.statusCode >= 400 ? error.statusCode : 500;
      const payload = {
        error: statusCode >= 500 ? "Internal Server Error" : error.message
      };
      if (statusCode >= 500 && envConfig.nodeEnv !== "production" && error?.message) {
        payload.details = error.message;
      }
      logger.error("Unhandled request error", error);
      return jsonResponse(request, envConfig, statusCode, payload);
    }
  }
};

// node_modules/.pnpm/wrangler@4.73.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/.pnpm/wrangler@4.73.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-sitM4i/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/.pnpm/wrangler@4.73.0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-sitM4i/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
