import { buildApp } from "./app.js";
import { envInjectionSuccessful } from "./config/env.js";

const printStartupStatus = (label, successful) => {
  const state = successful ? "successfully" : "failed";
  console.log(`${label}: ${state}`);
};

const startServer = async () => {
  printStartupStatus(".env injected", envInjectionSuccessful);

  const app = await buildApp({ logger: false });
  const { host, port } = app.envConfig;
  printStartupStatus("MongoDB connected", app.dbStatus?.connected === true);

  const shutdown = async (signal) => {
    console.log(`Shutdown signal received: ${signal}`);
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
    console.log(`Server started: successfully (${host}:${port})`);
  } catch (error) {
    console.error("Server started: failed");
    process.exit(1);
  }
};

void startServer();
