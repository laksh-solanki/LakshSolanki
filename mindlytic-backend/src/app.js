import fastify from "fastify";
import cors from "@fastify/cors";
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

export const buildApp = async (options = {}) => {
  const env = getEnv(options.envOverrides);
  const app = fastify({
    logger: options.logger ?? { level: env.logLevel },
  });

  app.decorate("envConfig", env);

  await app.register(cors, {
    origin: createCorsOriginHandler(env.corsOrigins),
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Admin-Key"],
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
