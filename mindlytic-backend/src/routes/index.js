import { registerRootRoutes } from "./root.js";
import { registerHealthRoutes } from "./health.js";
import { registerCourseRoutes } from "./courses.js";
import { registerProfileRoutes } from "./profile.js";
import { registerSubscriptionRoutes } from "./subscriptions.js";
import { registerAdminRoutes } from "./admin.js";

export const registerRoutes = async (app) => {
  await registerRootRoutes(app);
  await registerHealthRoutes(app);
  await registerCourseRoutes(app);
  await registerProfileRoutes(app);
  await registerSubscriptionRoutes(app);
  await registerAdminRoutes(app);
};
