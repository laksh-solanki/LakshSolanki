<script setup>
import { nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import mainsvgicon from "@/assets/mainsvgicon.vue";
import SearchBar from "@/components/Search-bar.vue";

const route = useRoute();
const drawer = ref(false);

const navLinks = [
  { title: "Home", path: "/", icon: "mdi-home-outline" },
  { title: "About me", path: "/about", icon: "mdi-account-circle-outline" },
  { title: "Projects", path: "/projects", icon: "mdi-briefcase-outline" },
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
  <v-navigation-drawer
    v-model="drawer"
    temporary
    location="right"
    :width="$vuetify.display.xs ? 288 : 320"
    class="mobile-drawer"
  >
    <div class="drawer-shell d-flex flex-column h-100">
      <div class="drawer-head d-flex align-center justify-space-between">
        <mainsvgicon />
        <v-btn class="drawer-close" icon="mdi-close" variant="text" @click="closeDrawer"></v-btn>
      </div>

      <p class="drawer-tagline">Explore sections quickly</p>

      <v-list nav class="drawer-links">
        <v-list-item
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          :title="link.title"
          :prepend-icon="link.icon"
          :append-icon="isActive(link.path) ? 'mdi-arrow-top-right' : 'mdi-chevron-right'"
          rounded="xl"
          class="drawer-link"
          :class="{ 'is-active': isActive(link.path) }"
          @click="closeDrawer"
        >
        </v-list-item>
      </v-list>

      <div class="drawer-cta mt-auto">
        <v-btn
          block
          color="primary"
          rounded="xl"
          variant="flat"
          class="drawer-cta-btn text-none"
          @click="scrollToSubscribe"
        >
          Let's Collaborate
        </v-btn>
      </div>
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
          class="nav-link text-none"
          :class="{ 'is-active': isActive(link.path) }"
        >
          <v-icon start size="18" class="nav-link-icon">{{ link.icon }}</v-icon>
          <span>{{ link.title }}</span>
        </v-btn>
      </div>

      <div class="d-flex align-center ga-2 ml-auto">
        <SearchBar />
        <v-btn
          class="d-none d-md-flex"
          color="primary"
          variant="flat"
          rounded="xl"
          @click="scrollToSubscribe"
        >
          Let's Collaborate
        </v-btn>

        <v-btn
          class="d-flex d-md-none"
          icon="mdi-menu"
          variant="text"
          @click="drawer = true"
        ></v-btn>
      </div>
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
  box-shadow: 0 8px 24px rgba(19, 111, 99, 0.08);
}

.nav-cluster {
  padding: 6px;
  border-radius: 18px;
  border: 1px solid rgba(19, 111, 99, 0.2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(243, 247, 242, 0.9));
  box-shadow: 0 10px 24px rgba(19, 111, 99, 0.08);
}

.nav-link {
  color: #24443e;
  font-weight: 600;
  font-size: 0.86rem;
  letter-spacing: 0.01em;
  border-radius: 13px !important;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.nav-link-icon {
  opacity: 0.8;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.nav-link:hover {
  transform: translateY(-1px);
  background: rgba(19, 111, 99, 0.08);
  box-shadow: inset 0 0 0 1px rgba(19, 111, 99, 0.14);
}

.nav-link:hover .nav-link-icon {
  opacity: 1;
  transform: scale(1.05);
}

.nav-link.is-active {
  color: white;
  background: linear-gradient(145deg, #136f63, #1f8f7f);
  box-shadow: 0 8px 18px rgba(19, 111, 99, 0.28);
}

.nav-link.is-active .nav-link-icon {
  opacity: 1;
}

.mobile-drawer {
  backdrop-filter: blur(10px);
}

.mobile-drawer :deep(.v-navigation-drawer__content) {
  background:
    radial-gradient(circle at 15% -15%, rgba(102, 209, 177, 0.25), transparent 45%),
    linear-gradient(180deg, #f8fdfb 0%, #eef6f2 100%);
}

.drawer-shell {
  min-height: 100%;
  padding: 16px 14px 18px;
}

.drawer-head {
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: rgba(255, 255, 255, 0.84);
}

.drawer-close {
  background: rgba(19, 111, 99, 0.08);
}

.drawer-tagline {
  margin: 12px 4px 10px;
  color: #52736b;
  font-size: 0.86rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.drawer-links {
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: rgba(255, 255, 255, 0.7);
}

.drawer-link {
  margin-bottom: 8px;
  border: 1px solid transparent;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.drawer-link:last-child {
  margin-bottom: 0;
}

.drawer-link:hover {
  transform: translateX(2px);
  border-color: rgba(19, 111, 99, 0.14);
  background: rgba(19, 111, 99, 0.08);
}

.drawer-link :deep(.v-list-item-title) {
  font-weight: 600;
}

.drawer-link :deep(.v-icon) {
  color: #2a4f47;
}

.drawer-link :deep(.v-list-item__append .v-icon) {
  opacity: 0.62;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.drawer-link:hover :deep(.v-list-item__append .v-icon) {
  opacity: 1;
  transform: translateX(2px);
}

.drawer-link.is-active {
  border-color: rgba(19, 111, 99, 0.4);
  color: #fff;
  background: linear-gradient(145deg, #136f63, #1f8f7f);
  box-shadow: 0 10px 20px rgba(19, 111, 99, 0.28);
}

.drawer-link.is-active :deep(.v-list-item-title),
.drawer-link.is-active :deep(.v-icon) {
  color: #fff !important;
}

.drawer-cta {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(19, 111, 99, 0.14);
}

.drawer-cta-btn {
  font-weight: 700;
  letter-spacing: 0.01em;
}

@media (max-width: 600px) {
  .drawer-shell {
    padding: 12px 10px 14px;
  }

  .drawer-head {
    padding: 10px 12px;
  }

  .drawer-links {
    padding: 6px;
  }
}
</style>
