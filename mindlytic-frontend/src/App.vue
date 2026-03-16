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
import TopLoader from "./components/TopLoader.vue";
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
  background: rgba(6, 17, 16, 0.92);
}

::-webkit-scrollbar-thumb {
  background: rgba(76, 207, 183, 0.28);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(76, 207, 183, 0.46);
}

/* Unified minimal background for all project tool pages */
.ai-page,
.tool-page,
.hub-page,
.forge-page,
.lab-page,
.certificate-page {
  background: rgb(var(--v-theme-background)) !important;
}

.ai-page .hero-shell,
.tool-page .hero-shell,
.hub-page .hero-shell,
.forge-page .hero-shell,
.lab-page .hero-shell,
.certificate-page .hero-shell {
  background: transparent !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* Use fluid project containers with lower side margins */
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
  padding-left: clamp(12px, 2vw, 28px) !important;
  padding-right: clamp(12px, 2vw, 28px) !important;
}

/* Match project main containers with AI chat main container background */
.tool-page > .v-container,
.hub-page > .v-container,
.forge-page > .v-container,
.lab-page > .v-container,
.certificate-page > .v-container {
  background: rgb(var(--v-theme-background)) !important;
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
  background: rgb(var(--v-theme-surface)) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.14) !important;
}

/* Hide project hero stats cards on mobile screens */
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
