import { registerRootRoutes } from "./root.js";
import { registerHealthRoutes } from "./health.js";
import { registerCourseRoutes } from "./courses.js";
import { registerSubscriptionRoutes } from "./subscriptions.js";
import { registerAiRoutes } from "./ai.js";

export const registerRoutes = async (app) => {
  await registerRootRoutes(app);
  await registerHealthRoutes(app);
  await registerCourseRoutes(app);
  await registerSubscriptionRoutes(app);
  await registerAiRoutes(app);
};
