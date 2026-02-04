<script setup>
import { ref } from "vue";

import mainsvgicon from "@/assets/mainsvgicon.vue";
import my_photo from "@/assets/Picture/my-pic.jpg";

// State for mobile navigation drawer
const menu = ref(false)
const drawer = ref(false);

// Navigation Links - Matches your router/index.js
const quickLinks = [
  { title: 'Home', path: '/', icon: 'mdi-home' },
  { title: 'About', path: '/about', icon: 'mdi-information' },
  { title: 'Projects', path: '/projects', icon: 'mdi-view-dashboard' },
]
// User Dropdown Items
const userMenu = [
  { title: "Profile", to: "/profile", icon: "mdi-account-outline", color: "primary", showChip: true },
  // { title: "Billing & Plans", to: "/", icon: "mdi-credit-card-outline", color: "primary", showChip: true },
  // { title: "Settings", to: "/settings", icon: "mdi-cog-outline", color: "primary", showChip: false },
  // { title: "Help & Support", to: "/help", icon: "mdi-lifebuoy", color: "primary", showChip: false },
  // { title: "Sign Out", to: "/logout", icon: "mdi-logout", color: "error", showChip: false },
];
</script>

<template>
  <v-navigation-drawer v-model="drawer" temporary location="left" border :scrim="false">
    <v-list>
      <v-list-item class="px-auto py-0 position-relative">
        <mainsvgicon />
        <v-btn icon="mdi-close" variant="text" density="compact" class="position-absolute"
          style="right: 10px; top: 50%; transform: translateY(-50%);" @click="drawer = false"></v-btn>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list nav>
      <v-tabs direction="vertical" density="comfortable" class="mt-2">
        <v-tab v-for="(link, index) in quickLinks" :key="index" :to="link.path" :class="link.class"
          color="primary">{{ link.title }}
          <template v-slot:append>
            <v-icon v-if="$route.path === link.path" icon="mdi-chevron-right"></v-icon>
          </template>
        </v-tab>
      </v-tabs>
    </v-list>
  </v-navigation-drawer>
  <v-app-bar color="surface" scroll-behavior="elevate" border scroll-threshold="1000" class="px-0" density="default">
    <v-app-bar-nav-icon variant="text" class="d-md-none d-lg-none d-xl-none d-xxl-none ma-0"
      @click.stop="drawer = !drawer" title="Menu"></v-app-bar-nav-icon>
    <v-divider vertical class="d-md-none mx-1"></v-divider>
    <div class="d-flex align-center ml-1 mr-6">
      <mainsvgicon />
    </div>
    <v-divider vertical class="d-none d-sm-flex d-md-flex d-lg-flex"></v-divider>
    <div class="d-none d-md-flex justify-end align-center w-100">
      <v-tabs density="compact" class="d-none d-lg-flex align-center">
        <v-tab v-for="(link, index) in quickLinks" :key="index" :to="link.path" :class="link.class"
          class="px-2 tab-size" slider-color="white">{{ link.title
          }}</v-tab>
      </v-tabs>
    </div>
    <div class="d-flex justify-end align-end w-100">
      <v-divider vertical></v-divider>
      <v-btn to="/notifications" stacked class="pa-0" color="medium-emphasis">
        <v-badge content="3" color="error" dot overlap>
          <v-icon icon="mdi-bell-outline" size="25"></v-icon>
        </v-badge>
      </v-btn>
      <v-divider vertical></v-divider>
      <v-menu v-model="menu" :close-on-content-click="false" location="bottom end" origin="top right"
        transition="scale-transition">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" stacked class="ma-0">
            <v-avatar :image="my_photo"></v-avatar>
          </v-btn>
        </template>

        <v-card min-width="310" class="rounded-lg" elevation="10" border>
          <v-list-item class="mx-3 pa-3">
            <template v-slot:prepend>
              <v-avatar size="48" :image="my_photo" class="mr-2"></v-avatar>
            </template>
            <v-list-item-title class="text-h6 font-weight-bold">
              Laksh Solanki
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption text-grey-lighten-1">
              <v-icon size="small" color="success" class="mr-1">mdi-check-decagram</v-icon>
              lakshsolanki848@gmail.com
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider class="mb-3"></v-divider>

          <v-list density="compact" rounded="lg" class="ma-3" nav>
            <v-list-item v-for="(item, i) in userMenu" :key="i" :value="item.title" :to="item.to"
              :prepend-icon="item.icon" :title="item.title" rounded="lg" :color="item.color">
              <template v-slot:append v-if="item.showChip">
                <v-chip size="x-small" color="purple" variant="flat" class="font-weight-bold">NEW</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.tracking-tight {
  letter-spacing: -0.5px;
}

/* Optional: Fine-tune the blur effect for a glassmorphism feel */
.v-menu .v-overlay__content>.v-card {
  backdrop-filter: blur(2px);
  background-color: rgba(30, 30, 30, 0.95) !important;
}
</style>
