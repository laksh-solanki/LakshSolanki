import net from "node:net";
import { buildApp } from "./app.js";
import { envInjectionSuccessful, getEnv } from "./config/env.js";

const printStartupStatus = (label, successful) => {
  const state = successful ? "successfully" : "failed";
  console.log(`${label}: ${state}`);
};

const resolveProbeHost = (host) => {
  if (!host || host === "0.0.0.0" || host === "::") {
    return "127.0.0.1";
  }

  return host;
};

const probeExistingServer = async ({ host, port }) => {
  const probeHost = resolveProbeHost(host);

  try {
    const response = await fetch(`http://${probeHost}:${port}/health`);
    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    return payload?.status === "ok";
  } catch {
    return false;
  }
};

const isPortOccupied = ({ host, port }) =>
  new Promise((resolve) => {
    const socket = net.createConnection({
      host: resolveProbeHost(host),
      port,
    });

    const finish = (occupied) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(occupied);
    };

    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(1000, () => finish(false));
  });

const startServer = async () => {
  printStartupStatus(".env injected", envInjectionSuccessful);
  const env = getEnv();
  const { host, port } = env;

  if (await isPortOccupied({ host, port })) {
    const alreadyRunning = await probeExistingServer({ host, port });
    if (alreadyRunning) {
      console.log(`Server already running: successfully (${host}:${port})`);
      return;
    }

    console.error(`Server started: failed (port ${port} is already in use)`);
    process.exit(1);
  }

  const app = await buildApp({ logger: false });
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
    console.error(`Server started: failed (${error?.code || "UNKNOWN_ERROR"})`);
    if (error?.message) {
      console.error(error.message);
    }

    process.exit(1);
  }
};

void startServer();
