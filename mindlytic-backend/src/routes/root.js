import { getUptimeSeconds } from "../lib/runtime.js";

export const registerRootRoutes = async (app) => {
  app.get("/", async () => ({
    status: "Backend working",
    time: new Date().toISOString(),
    uptimeSeconds: getUptimeSeconds(),
    mode: app.dbStatus.mode,
  }));
};
