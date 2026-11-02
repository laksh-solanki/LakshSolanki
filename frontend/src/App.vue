<template>
  <v-app>
    <TopLoader ref="loaderRef" />
    <AppHeader />
    <v-main>
      <RouterView />
    </v-main>
    <AppFooter />
    <CookieConsentBanner />
  </v-app>
</template>

<script setup>
import { defineAsyncComponent, onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import CookieConsentBanner from "@/components/CookieConsentBanner.vue";
import TopLoader from "@/components/TopLoader.vue";
import { isGlobalLoading } from "@/router/index.js";

const loaderRef = ref(null);
const AppFooter = defineAsyncComponent(() => import("@/components/AppFooter.vue"));

onMounted(() => {
  isGlobalLoading.value = loaderRef.value;
});
</script>

<style>
/* Consistent scrollbar styling across portfolio pages */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--portfolio-surface-soft, #FAF3F0);
}

::-webkit-scrollbar-thumb {
  background: var(--portfolio-secondary, #AA5E7A);
  border-radius: 100px;
  border: 2px solid var(--portfolio-surface-soft, #FAF3F0);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--portfolio-primary, #7C0E44);
}

/* Unified clean background for all project tool pages */
.ai-page,
.tool-page,
.hub-page,
.forge-page,
.lab-page,
.certificate-page,
.mindlytic-page {
  background: var(--portfolio-bg, #F2DACE) !important;
}

.ai-page .hero-shell,
.tool-page .hero-shell,
.hub-page .hero-shell,
.forge-page .hero-shell,
.lab-page .hero-shell,
.certificate-page .hero-shell,
.mindlytic-page .hero-shell {
  background: var(--portfolio-surface-soft, #FAF3F0) !important;
  border-bottom: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12)) !important;
}

/* Fluid project containers */
.ai-page > .v-container,
.ai-page .hero-shell > .v-container,
.tool-page > .v-container,
.tool-page .hero-shell > .v-container,
.hub-page > .v-container,
.hub-page .hero-shell > .v-container,
.forge-page > .v-container,
.forge-page .hero-shell > .v-container,
.lab-page > .v-container,
.lab-page .hero-shell > .v-container,
.certificate-page > .v-container,
.certificate-page .hero-shell > .v-container {
  max-width: none !important;
  width: 100% !important;
  padding-left: clamp(14px, 2vw, 28px) !important;
  padding-right: clamp(14px, 2vw, 28px) !important;
}

.tool-page .tool-shell,
.tool-page .side-panel,
.tool-page .image-card,
.hub-page .tool-shell,
.forge-page .tool-shell,
.forge-page .output-shell,
.forge-page .side-panel,
.lab-page .tool-shell,
.lab-page .side-panel,
.certificate-page .form-shell,
.certificate-page .side-panel {
  background: var(--portfolio-surface, #FFFFFF) !important;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12)) !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06)) !important;
}

/* Responsive adjustment for stats cards */
@media (max-width: 768px) {
  .ai-page .hero-stats,
  .tool-page .hero-stats,
  .hub-page .hero-stats,
  .forge-page .hero-stats,
  .lab-page .hero-stats,
  .certificate-page .hero-stats {
    display: none !important;
  }
}
</style>
