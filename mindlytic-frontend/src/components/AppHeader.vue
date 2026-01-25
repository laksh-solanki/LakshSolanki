<script setup>
import { ref } from "vue";
import mainsvgicon from "@/assets/mainsvgicon.vue";
import Color from "vuetify/directives/color";

// State for mobile navigation drawer
const drawer = ref(false);

// Navigation Links - Matches your router/index.js
const links = [
  { title: "Home", to: "/", mdi_icon: "mdi-home" },
  { title: "About", to: "/about", mdi_icon: "mdi-information" },
];

// User Dropdown Items
const userMenu = [
  {
    title: "Profile",
    to: "/about",
    icon: "mdi-account-outline",
    color: "primary",
  },
  { title: "Settings", to: "/", icon: "mdi-cog-outline", color: "primary" },
  { type: "divider" },
  { title: "Logout", to: "/", icon: "mdi-logout", color: "error" },
];
</script>

<template>
  <v-navigation-drawer
    v-model="drawer"
    border="thin opacity-25"
    temporary
    location="left"
  >
    <v-list>
      <v-list-item class="ps-9 pa-0">
        <mainsvgicon />
      </v-list-item>
    </v-list>

    <v-divider></v-divider>
    <v-list density="compact" nav>
      <v-list-group value="Users">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-avatar="https://cdn.vuetifyjs.com/images/john.jpg"
            title="Users"
          ></v-list-item>
        </template>
        <v-list-item
          v-for="(item, i) in userMenu"
          :key="i"
          :value="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          :class="item.color ? `text-${item.color}` : ''"
          ><v-divider v-if="item.type === 'divider'"></v-divider
        ></v-list-item>
      </v-list-group>
    </v-list>

    <v-divider></v-divider>
    <v-list density="compact" nav>
      <v-list-item
        v-for="item in links"
        :key="item.title"
        :to="item.to"
        :value="item.title"
        color="primary"
      >
        <template v-slot:prepend>
          <v-icon :icon="item.mdi_icon"></v-icon>
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar
    color="surface"
    scroll-behavior="elevate"
    scroll-threshold="1000"
    class="px-lg-8"
    border="thin opacity-25"
  >
    <v-app-bar-nav-icon
      variant="text"
      class="hidden-md-and-up"
      @click.stop="drawer = !drawer"
    ></v-app-bar-nav-icon>

    <div class="d-flex align-center ml-2 mr-8">
      <mainsvgicon />
    </div>

    <div class="d-none d-md-flex align-center ga-2">
      <v-btn
        v-for="link in links"
        :key="link.title"
        :to="link.to"
        variant="text"
        class="text-none font-weight-medium text-body-2"
        rounded="lg"
      >
        {{ link.title }}
      </v-btn>
    </div>

    <v-spacer></v-spacer>

    <div class="d-none d-md-flex align-center">
      <v-btn icon class="me-4" color="medium-emphasis">
        <v-badge content="3" color="error" dot>
          <v-icon icon="mdi-bell-outline"></v-icon>
        </v-badge>
      </v-btn>
      <v-divider
        color="red"
        opacity=".8"
        thickness="2"
        gradient
        vertical
      ></v-divider>
      <v-menu location="bottom end" transition="scale-transition">
        <template v-slot:activator="{ props }">
          <v-avatar
            v-bind="props"
            class="cursor-pointer ms-4"
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
            <v-divider v-if="item.type === 'divider'" class="my-2"></v-divider>

            <v-list-item
              v-else
              :value="item.title"
              rounded="lg"
              class="mx-2"
              :to="item.to"
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
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.tracking-tight {
  letter-spacing: -0.5px;
}
</style>
