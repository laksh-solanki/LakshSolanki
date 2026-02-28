import { createWebHistory, createRouter } from "vue-router";
import { ref } from "vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/pages/HomePage.vue"),
    meta: { title: "Mindlytic | Home" },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/pages/AboutPage.vue"),
    meta: { title: "Mindlytic | About" },
  },
  {
    path: "/projects",
    component: () => import("@/pages/Projects/page.vue"),
    meta: { title: "Mindlytic | Projects" },
    children: [
      {
        path: "",
        name: "Projects",
        component: () => import("@/pages/ProjectsPage.vue"),
        meta: { title: "Mindlytic | Projects" },
      },
      {
        path: "certificate-gen",
        name: "CertificateGen",
        component: () => import("@/pages/Projects/CertificateView.vue"),
        meta: { title: "Mindlytic | Certificate Generator" },
      },
      {
        path: "img-pdf",
        name: "ImageToPDF",
        component: () => import("@/pages/Projects/Img_PdfPage.vue"),
        meta: { title: "Mindlytic | Img to PDF" },
      },
      {
        path: "pdf-img",
        name: "PDFToImage",
        component: () => import("@/pages/Projects/PDF_ImgPage.vue"),
        meta: { title: "Mindlytic | PDF to Img" },
      },
      {
        path: "text-to-speech",
        name: "TextToSpeech",
        component: () => import("@/pages/Projects/TextToSpeech.vue"),
        meta: { title: "Mindlytic | Text to Speech" },
      },
      {
        path:"mindly_ai",
        name:"mindly_ai",
        component: () => import("@/pages/Projects/mindly_ai.vue"),
        meta: { title: "Mindlytic | mindly AI" },
      },
      {
        path: "json-forge",
        name: "JsonForgeStudio",
        component: () => import("@/pages/Projects/JsonForgeStudio.vue"),
        meta: { title: "Mindlytic | JSON Forge Studio" },
      },
      {
        path: "web-lab-compiler",
        name: "WebLabCompiler",
        component: () => import("@/pages/Projects/WebLabCompiler.vue"),
        meta: { title: "Mindlytic | Web Lab Compiler" },
      },
    ],
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("@/pages/ProfilePage.vue"),
    meta: { title: "Mindlytic | Profile" },
  },
  {
    path: "/notfound",
    name: "NotFound",
    component: () => import("@/pages/Not_FoundPage.vue"),
    meta: { title: "Mindlytic | Not Found" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/notfound",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, _savedPosition) {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title || "Mindlytic";
  next();
});

export const isGlobalLoading = ref(null);

router.beforeEach((to, from, next) => {
  if (isGlobalLoading.value) isGlobalLoading.value.start();
  next();
});

router.afterEach(() => {
  if (isGlobalLoading.value) isGlobalLoading.value.finish();
});

export default router;
