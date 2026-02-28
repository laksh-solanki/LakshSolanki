export const registerHealthRoutes = async (app) => {
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(1)),
  }));

  app.get("/ready", async (request, reply) => {
    const ready = app.dbStatus.mode === "memory" || app.dbStatus.connected;
    reply.code(ready ? 200 : 503);

    return {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      database: app.dbStatus,
    };
  });
};
