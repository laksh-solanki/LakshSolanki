import { createMemoryHistory, createRouter } from "vue-router";

import HomePage from "@/pages/HomePage.vue";
import AboutPage from "@/pages/AboutPage.vue";
// import AboutPage from './AboutPage.vue'

const routes = [
  { path: "/", component: HomePage },
  { path: "/about", component: AboutPage },
  // { path: '/about', component: AboutPage },
];

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
