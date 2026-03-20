import { createWebHistory, createRouter } from "vue-router";
import { ref } from "vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/pages/HomePage.vue"),
    meta: { title: "LakshSolanki | Home" },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/pages/AboutPage.vue"),
    meta: { title: "LakshSolanki | About" },
  },
  {
    path: "/projects",
    component: () => import("@/pages/Projects/page.vue"),
    meta: { title: "LakshSolanki | Projects", hideHeaderFooter: true },
    children: [
      {
        path: "",
        name: "Projects",
        component: () => import("@/pages/ProjectsPage.vue"),
        meta: { title: "LakshSolanki | Projects", hideHeaderFooter: false },
      },
      {
        path: "certificate-gen",
        name: "CertificateGen",
        component: () => import("@/pages/Projects/CertificateView.vue"),
        meta: { title: "LakshSolanki | Certificate Generator" },
      },
      {
        path: "img-pdf",
        name: "ImageToPDF",
        component: () => import("@/pages/Projects/Img_PdfPage.vue"),
        meta: { title: "LakshSolanki | Img to PDF" },
      },
      {
        path: "pdf-img",
        name: "PDFToImage",
        component: () => import("@/pages/Projects/PDF_ImgPage.vue"),
        meta: { title: "LakshSolanki | PDF to Img" },
      },
      {
        path: "text-to-speech",
        name: "TextToSpeech",
        component: () => import("@/pages/Projects/TextToSpeech.vue"),
        meta: { title: "LakshSolanki | Text to Speech" },
      },
      {
        path:"mindly_ai",
        name:"mindly_ai",
        component: () => import("@/pages/Projects/mindlytic_ai.vue"),
        meta: { title: "LakshSolanki | mindlytic AI" },
      },
      {
        path: "json-forge",
        name: "JsonForgeStudio",
        component: () => import("@/pages/Projects/JsonForgeStudio.vue"),
        meta: { title: "LakshSolanki | JSON Forge Studio" },
      },
      {
        path: "web-lab-compiler",
        name: "WebLabCompiler",
        component: () => import("@/pages/Projects/WebLabCompiler.vue"),
        meta: { title: "LakshSolanki | Web Lab Compiler" },
      },
      {
        path: "dev-utility-hub",
        name: "DevUtilityHub",
        component: () => import("@/pages/Projects/DevUtilityHub.vue"),
        meta: { title: "LakshSolanki | Dev Utility Hub" },
      },
      {
        path: "translate-studio",
        name: "TranslateStudio",
        component: () => import("@/pages/Projects/TranslateStudio.vue"),
        meta: { title: "LakshSolanki | Translate Studio" },
      },
    ],
  },
  {
    path: "/notfound",
    name: "NotFound",
    component: () => import("@/pages/Not_FoundPage.vue"),
    meta: { title: "LakshSolanki | Not Found" },
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

const wrapLegacyGuard = (guard) => {
  if (typeof guard !== "function" || guard.length < 3) {
    return guard;
  }

  // Compatibility bridge for legacy next()-style guards.
  return (to, from) =>
    new Promise((resolve, reject) => {
      let handled = false;
      const next = (value) => {
        if (handled) return;
        handled = true;

        if (value instanceof Error) {
          reject(value);
          return;
        }

        resolve(value);
      };

      try {
        guard(to, from, next);
      } catch (error) {
        reject(error);
      }
    });
};

const patchGuardRegistrar = (methodName) => {
  const originalMethod = router[methodName].bind(router);
  router[methodName] = (guard) => originalMethod(wrapLegacyGuard(guard));
};

patchGuardRegistrar("beforeEach");
patchGuardRegistrar("beforeResolve");

export const isGlobalLoading = ref(null);

router.beforeEach((to) => {
  document.title = to.meta.title || "LakshSolanki";
  if (isGlobalLoading.value) isGlobalLoading.value.start();
  return true;
});

router.afterEach(() => {
  if (isGlobalLoading.value) isGlobalLoading.value.finish();
});

export default router;
