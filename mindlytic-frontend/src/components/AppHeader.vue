<script setup>
import { ref } from "vue";

// State for mobile navigation drawer
const drawer = ref(false);

// Navigation Links
const links = [
  { title: "Home", to: "/" },
  { title: "About", to: "/about" },
];

// User Dropdown Items
const userMenu = [
  { title: "Profile", icon: "mdi-account-outline" },
  { title: "Settings", icon: "mdi-cog-outline" },
  { type: "divider" },
  { title: "Logout", icon: "mdi-logout", color: "error" },
];
</script>

<template>
  <v-container>
    <v-navigation-drawer v-model="drawer" temporary location="left">
      <v-list>
        <v-list-item
          prepend-avatar="https://cdn.vuetifyjs.com/images/john.jpg"
          title="John Developer"
          subtitle="admin@mindlytic.com"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in links"
          :key="item.title"
          :value="item.title"
          color="primary"
        >
          <template v-slot:prepend>
            <v-icon
              :icon="`mdi-alpha-${item.title.charAt(0).toLowerCase()}-box-outline`"
            ></v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="surface" elevation="0" border class="px-lg-4">
      <v-app-bar-nav-icon
        variant="text"
        class="hidden-md-and-up"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <div class="d-flex align-center ml-2 mr-8">
        <v-icon
          icon="mdi-chart-bubble"
          color="primary"
          size="x-large"
          class="mr-2"
        ></v-icon>
        <span class="text-h6 font-weight-bold tracking-tight">Mindlytic</span>
      </div>

      <div class="hidden-sm-and-down align-center gap-1">
        <v-btn
          v-for="link in links"
          :key="link.title"
          variant="text"
          class="text-none font-weight-medium text-body-2"
          rounded="lg"
        >
          {{ link.title }}
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <div class="d-flex align-center">
        <v-btn icon class="mr-2" color="medium-emphasis">
          <v-badge content="3" color="error" dot bordered>
            <v-icon icon="mdi-bell-outline"></v-icon>
          </v-badge>
        </v-btn>

        <v-menu location="bottom end" transition="scale-transition">
          <template v-slot:activator="{ props }">
            <v-avatar
              v-bind="props"
              class="cursor-pointer"
              color="primary-lighten-4"
              size="40"
              image="https://cdn.vuetifyjs.com/images/john.jpg"
            ></v-avatar>
          </template>

          <v-list width="200" class="mt-2 rounded-lg elevation-4">
            <v-list-item
              title="John Developer"
              subtitle="Pro Plan"
              class="mb-2"
            ></v-list-item>

            <v-divider class="mb-2"></v-divider>

            <template v-for="(item, i) in userMenu" :key="i">
              <v-divider
                v-if="item.type === 'divider'"
                class="my-2"
              ></v-divider>

              <v-list-item
                v-else
                :value="item.title"
                rounded="md"
                class="mx-2"
                :class="item.color ? `text-${item.color}` : ''"
              >
                <template v-slot:prepend>
                  <v-icon :icon="item.icon" size="small" class="mr-2"></v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{
                  item.title
                }}</v-list-item-title>
              </v-list-item>
            </template>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>
  </v-container>
</template>

<style scoped>
/* Utility for spacing between nav items */
.gap-1 {
  gap: 4px;
}
.cursor-pointer {
  cursor: pointer;
}
.tracking-tight {
  letter-spacing: -0.5px;
}
</style>
