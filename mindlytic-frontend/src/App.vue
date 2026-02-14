<template>
  <v-app theme="dark">
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
