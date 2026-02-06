<template>
  <v-app theme="dark">
    <AppHeader />
    <v-main>
      <RouterView />
    </v-main>
    <EmailRegisterPopup />
    <AppFooter />
  </v-app>
</template>

<script setup>
import { RouterView } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import EmailRegisterPopup from "@/components/EmailRegisterPopup.vue";
import AppFooter from "@/components/AppFooter.vue";
</script>
