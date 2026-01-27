import { createWebHistory, createRouter } from "vue-router";

const routes = [
  { path: "/", component: () => import("@/pages/HomePage.vue")},
  { path: "/about", component: () => import("@/pages/AboutPage.vue")},
  { path: "/projects", component: () => import("@/pages/ProjectsPage.vue")},
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
