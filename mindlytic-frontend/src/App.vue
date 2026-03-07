<template>
  <v-app>
    <TopLoader ref="loaderRef" />
    <AppHeader />
    <v-main>
      <RouterView />
    </v-main>
    <AppFooter />
  </v-app>
</template>

<script setup>
import { defineAsyncComponent, onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
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
</style>
