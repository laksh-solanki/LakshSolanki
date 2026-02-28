export const registerRootRoutes = async (app) => {
  app.get("/", async () => ({
    status: "Backend working",
    time: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(1)),
    mode: app.dbStatus.mode,
  }));
};
