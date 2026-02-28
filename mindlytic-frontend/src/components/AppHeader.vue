<script setup>
import { nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import mainsvgicon from "@/assets/mainsvgicon.vue";

const route = useRoute();
const drawer = ref(false);

const navLinks = [
  { title: "Home", path: "/" },
  { title: "About", path: "/about" },
  { title: "Projects", path: "/projects" },
  { title: "Profile", path: "/profile" },
];

const isActive = (path) =>
  path === "/projects" ? route.path.startsWith("/projects") : route.path === path;

const closeDrawer = () => {
  drawer.value = false;
};

const scrollToSubscribe = async () => {
  closeDrawer();
  await nextTick();

  const section = document.getElementById("subscribe-container");
  if (!section) return;

  section.scrollIntoView({ behavior: "smooth", block: "center" });
  section.classList.add("subscribe-focus");
  window.setTimeout(() => section.classList.remove("subscribe-focus"), 1600);
};
</script>

<template>
  <v-navigation-drawer v-model="drawer" temporary location="right" class="mobile-drawer">
    <div class="pa-5 d-flex align-center justify-space-between">
      <mainsvgicon />
      <v-btn icon="mdi-close" variant="text" @click="closeDrawer"></v-btn>
    </div>
    <v-divider></v-divider>

    <v-list nav class="px-3 py-4">
      <v-list-item
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        :title="link.title"
        rounded="xl"
        class="mb-2"
        @click="closeDrawer"
      >
      </v-list-item>
    </v-list>

    <div class="px-5 pb-6 pt-2">
      <v-btn
        block
        color="primary"
        rounded="xl"
        variant="flat"
        @click="scrollToSubscribe"
      >
        Let's Collaborate
      </v-btn>
    </div>
  </v-navigation-drawer>

  <v-app-bar class="portfolio-header" flat height="78">
    <v-container class="d-flex align-center py-0">
      <router-link to="/" class="brand-link d-flex align-center text-decoration-none">
        <mainsvgicon />
      </router-link>

      <div class="d-none d-md-flex align-center mx-auto ga-2 nav-cluster">
        <v-btn
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          variant="text"
          rounded="xl"
          class="nav-link text-none"
          :class="{ 'is-active': isActive(link.path) }"
        >
          {{ link.title }}
        </v-btn>
      </div>

      <div class="d-none d-md-flex align-center">
        <v-btn
          color="primary"
          variant="flat"
          rounded="xl"
          class="text-none px-5"
          @click="scrollToSubscribe"
        >
          Let's Collaborate
        </v-btn>
      </div>

      <v-btn
        class="d-flex d-md-none ml-auto"
        icon="mdi-menu"
        variant="text"
        @click="drawer = true"
      ></v-btn>
    </v-container>
  </v-app-bar>
</template>

<style scoped>
.portfolio-header {
  position: sticky;
  top: 0;
  backdrop-filter: blur(12px);
  background: rgba(243, 247, 242, 0.82) !important;
  border-bottom: 1px solid rgba(19, 111, 99, 0.14);
}

.nav-cluster {
  padding: 5px;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.2);
  background: rgba(255, 255, 255, 0.82);
}

.nav-link {
  color: #24443e;
  font-weight: 600;
}

.nav-link.is-active {
  color: white;
  background: linear-gradient(145deg, #136f63, #1f8f7f);
}

.mobile-drawer {
  backdrop-filter: blur(10px);
}
</style>
