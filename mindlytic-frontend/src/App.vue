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
import { ref, onMounted } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import TopLoader from "./components/TopLoader.vue";
import { isGlobalLoading } from "@/router/index.js";

const loaderRef = ref(null);

onMounted(() => {
  isGlobalLoading.value = loaderRef.value;
});
</script>
<style>
/* Consistent scrollbar styling across portfolio pages */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #ecf1eb;
}

::-webkit-scrollbar-thumb {
  background: #c7d2cc;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca8a2;
}
</style>
