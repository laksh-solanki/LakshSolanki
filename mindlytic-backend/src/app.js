import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import compress from "@fastify/compress";
import { getEnv } from "./config/env.js";
import { registerDatabase } from "./plugins/database.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { registerRoutes } from "./routes/index.js";
import { createRepositories } from "./services/repositories.js";

const createCorsOriginHandler = (allowedOrigins) => {
  if (allowedOrigins.includes("*")) {
    return true;
  }

  const originSet = new Set(allowedOrigins.map((item) => item.toLowerCase()));
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = originSet.has(origin.toLowerCase());
    if (isAllowed) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"), false);
  };
};

const createHelmetConfig = (env) => ({
  contentSecurityPolicy: false,
  hidePoweredBy: true,
  hsts:
    env.nodeEnv === "production"
      ? {
          maxAge: 15552000,
          includeSubDomains: true,
        }
      : false,
});

const createRateLimitConfig = (env) => {
  const config = {
    global: true,
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindowMs,
    skipOnError: true,
  };

  if (env.rateLimitAllowList.length > 0) {
    config.allowList = env.rateLimitAllowList;
  }

  return config;
};

export const buildApp = async (options = {}) => {
  const env = getEnv(options.envOverrides);
  const app = fastify({
    logger: options.logger ?? { level: env.logLevel },
    bodyLimit: env.maxRequestBodyBytes,
    trustProxy: env.trustProxy,
  });

  app.decorate("envConfig", env);

  await app.register(cors, {
    origin: createCorsOriginHandler(env.corsOrigins),
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Admin-Key"],
    strictPreflight: true,
    maxAge: 86400,
  });

  if (env.enableSecurityHeaders) {
    await app.register(helmet, createHelmetConfig(env));
  }

  if (env.enableCompression) {
    await app.register(compress, {
      global: true,
      threshold: 1024,
      encodings: ["br", "gzip", "deflate"],
    });
  }

  await app.register(rateLimit, createRateLimitConfig(env));

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.removeHeader("server");
    return payload;
  });

  await registerDatabase(app, env);

  const repositories = createRepositories({
    db: app.db,
    logger: app.log,
  });
  app.decorate("repositories", repositories);

  await registerRoutes(app);
  await registerErrorHandler(app, { nodeEnv: env.nodeEnv });

  return app;
};
