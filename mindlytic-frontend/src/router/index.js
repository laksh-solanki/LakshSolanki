import { createWebHistory, createRouter } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/pages/HomePage.vue"),
    meta: { title: "Mindlytic | Home" },
  },
  {
    path: "/about",
    component: () => import("@/pages/AboutPage.vue"),
    meta: { title: "Mindlytic | About" },
  },
  {
    path: "/projects",
    component: () => import("@/pages/ProjectsPage.vue"),
    meta: { title: "Mindlytic | Projects" },
  },
  {
    path: "/notfound",
    component: () => import("@/pages/Not_FoundPage.vue"),
    meta: { title: "Mindlytic | Not Found" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/notfound",
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
