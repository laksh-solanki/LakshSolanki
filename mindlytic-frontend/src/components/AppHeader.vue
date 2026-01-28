<script setup>
import { ref } from "vue";
import mainsvgicon from "@/assets/mainsvgicon.vue";

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
  { title: "Profile", to: "/profile", icon: "mdi-account-outline", color: "primary", },
  { title: "Billing & Plans", to: "/", icon: "mdi-credit-card-outline", color: "primary", showChip: true },
  { title: "Settings", to: "/", icon: "mdi-cog-outline", color: "primary" },
];
</script>

<template>
  <v-navigation-drawer v-model="drawer" temporary location="left">
    <v-list>
      <v-list-item class="ps-9 pa-0">
        <mainsvgicon />
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item v-for="(link, index) in quickLinks" :key="index" :to="link.path" :value="link.title" color="primary">
        <template v-slot:prepend>
          <v-icon :icon="link.icon"></v-icon>
        </template>
        <v-list-item-title>{{ link.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
  <v-app-bar color="surface" scroll-behavior="elevate" scroll-threshold="1000" class="px-md-5 px-2" density="default">
    <v-app-bar-nav-icon variant="text" class="hidden-md-and-up ma-0" @click.stop="drawer = !drawer"
      title="Menu"></v-app-bar-nav-icon>
    <div class="d-flex align-center ml-2 mr-8">
      <mainsvgicon />
    </div>

    <div class="d-none d-md-flex justify-center align-center w-100">
      <v-tabs inset density="compact" slider-color="info" class="d-none d-lg-flex align-center tab-container">
        <v-tab v-for="(link, index) in quickLinks" :key="index" :to="link.path" :class="link.class" class="px-0 tab-size">{{ link.title
        }}</v-tab>
      </v-tabs>
    </div>

    <v-spacer></v-spacer>

    <div class="justify-center align-center d-flex ga-1">
      <v-btn icon to="/notifications" class="align-center justify-center" color="medium-emphasis">
        <v-badge content="3" color="error" dot>
          <v-icon icon="mdi-bell-outline" size="24"></v-icon>
        </v-badge>
      </v-btn>
      <v-divider thickness="1" vertical></v-divider>
      <v-menu v-model="menu" :close-on-content-click="false" location="bottom end" origin="top right"
        transition="scale-transition">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="ml-2">
            <v-avatar image="https://i.pravatar.cc/150?img=11"></v-avatar>
          </v-btn>
        </template>

        <v-card min-width="310" class="rounded-xl mt-1 pa-2" elevation="10" border>
          <v-list-item class="mb-2">
            <template v-slot:prepend>
              <v-avatar size="48" image="https://i.pravatar.cc/150?img=11" class="mr-2"></v-avatar>
            </template>
            <v-list-item-title class="text-h6 font-weight-bold">
              John Developer
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption text-grey-lighten-1">
              <v-icon size="small" color="success" class="mr-1">mdi-check-decagram</v-icon>
              Pro Plan
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn icon="mdi-pencil" size="small" variant="text" color="grey"></v-btn>
            </template>
          </v-list-item>

          <v-divider class="mb-3"></v-divider>

          <v-list density="compact" rounded="xl" nav>
            <v-list-item v-for="(item, i) in userMenu" :key="i" :value="item.title" :to="item.to"
              :prepend-icon="item.icon" :title="item.title" rounded="xl" :color="item.color">
              <template v-slot:append v-if="item.showChip">
                <v-chip size="x-small" color="purple" variant="flat" class="font-weight-bold">NEW</v-chip>
              </template>
            </v-list-item>
            <v-divider class="my-2"></v-divider>

            <v-list-item prepend-icon="mdi-logout-variant" title="Sign Out" value="logout" rounded="xl" variant="tonal"
              color="error" class="py-3"></v-list-item>
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

.tab-container {
  max-width: 340px;
  height: 50px !important;
  box-shadow: inset 0 0 0 3px rgba(var(--v-border-color), var(--v-border-opacity) 0.12) !important;
}

.tab-size {
  min-width: 77px !important;
  height: 40px !important;
  font-size: 12px !important;
}

/* Optional: Fine-tune the blur effect for a glassmorphism feel */
.v-menu .v-overlay__content>.v-card {
  backdrop-filter: blur(2px);
  background-color: rgba(30, 30, 30, 0.95) !important;
}
</style>
