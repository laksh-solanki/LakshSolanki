import { buildApp } from "./app.js";

const startServer = async () => {
  const app = await buildApp();
  const { host, port } = app.envConfig;

  const shutdown = async (signal) => {
    app.log.info({ signal }, "Received shutdown signal");
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  try {
    await app.listen({ host, port });
    app.log.info({ host, port }, "Server started successfully");
  } catch (error) {
    app.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

void startServer();
