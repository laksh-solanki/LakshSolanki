<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import mainsvgicon from "@/assets/mainsvgicon.vue";
import SearchBar from "@/components/SearchBar.vue";

const route = useRoute();
const drawer = ref(false);
const githubProfile = "https://github.com/laksh-solanki";

const navLinks = [
  { title: "Home", path: "/", icon: "mdi-home-variant-outline", activeIcon: "mdi-home-variant" },
  { title: "About", path: "/about", icon: "mdi-account-outline", activeIcon: "mdi-account" },
  { title: "Projects", path: "/projects", icon: "mdi-briefcase-outline", activeIcon: "mdi-briefcase" },
];

const isActive = (path) =>
  path === "/projects" ? route.path.startsWith("/projects") : route.path === path;

const closeDrawer = () => {
  drawer.value = false;
};

watch(
  () => route.path,
  () => {
    drawer.value = false;
  }
);
</script>

<template>
  <v-navigation-drawer
    v-if="$vuetify.display.mdAndDown"
    v-model="drawer"
    temporary
    location="right"
    :width="$vuetify.display.xs ? 300 : 360"
    class="premium-mobile-drawer border-0"
  >
    <div class="drawer-shell d-flex flex-column h-100">
      <div class="drawer-header d-flex align-center justify-space-between mb-8">
        <mainsvgicon :size="42" />
        <v-btn
          class="drawer-close"
          icon
          variant="tonal"
          size="small"
          aria-label="Close navigation menu"
          @click="closeDrawer"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <nav class="drawer-nav flex-1">
        <p class="drawer-subtitle">Navigation</p>
        <v-list class="bg-transparent p-0 drawer-links" nav>
          <v-list-item
            v-for="link in navLinks"
            :key="link.path"
            color="primary"
            :to="link.path"
            class="premium-drawer-item mb-2"
            :class="{ 'is-active-item': isActive(link.path) }"
            rounded="xl"
            @click="closeDrawer"
          >
            <template v-slot:prepend>
              <div class="link-icon-wrapper" :class="{ 'active-icon-wrapper': isActive(link.path) }">
                <v-icon :icon="isActive(link.path) ? link.activeIcon : link.icon" size="20"></v-icon>
              </div>
            </template>
            <v-list-item-title class="link-title">{{ link.title }}</v-list-item-title>
            <template v-slot:append>
              <v-icon :icon="isActive(link.path) ? 'mdi-arrow-right' : 'mdi-chevron-right'" size="16" class="link-arrow"></v-icon>
            </template>
          </v-list-item>
        </v-list>
      </nav>

      <div class="drawer-footer mt-auto pt-6">
        <v-btn
          block
          class="premium-github-btn text-none"
          rounded="xl"
          size="x-large"
          :href="githubProfile"
          target="_blank"
          rel="noopener noreferrer"
        >
          <v-icon start icon="mdi-github" size="24"></v-icon>
          Explore on GitHub
          <v-icon end icon="mdi-open-in-new" size="18" class="ml-2 opacity-60"></v-icon>
        </v-btn>
      </div>
    </div>
  </v-navigation-drawer>

  <v-app-bar
    class="premium-app-bar"
    flat
    height="76"
  >
    <v-container class="h-100 d-flex align-center justify-space-between px-4 px-md-8 mx-auto w-100" style="max-width: var(--page-max-width, 1400px);">
      <!-- Brand Logo -->
      <router-link to="/" class="brand-link d-flex align-center text-decoration-none">
        <mainsvgicon class="brand-icon" />
      </router-link>

      <!-- Desktop Center Navigation -->
      <nav class="desktop-nav d-none d-md-flex align-center justify-center">
        <div class="nav-segment-control">
          <router-link
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="seg-item text-decoration-none"
            :class="{ 'seg-active': isActive(link.path) }"
          >
            <span class="seg-item-content">
              <v-icon size="19" class="mr-2">{{ isActive(link.path) ? link.activeIcon : link.icon }}</v-icon>
              {{ link.title }}
            </span>
          </router-link>
        </div>
      </nav>

      <!-- Right Actions (Search + Social) -->
      <div class="header-actions d-flex align-center ga-2 ga-md-3">
        <SearchBar class="search-component" />

        <v-btn
          class="github-action-btn d-none d-md-flex text-none"
          rounded="xl"
          variant="flat"
          :href="githubProfile"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Profile"
        >
          <v-icon icon="mdi-github" size="20" class="mr-lg-2"></v-icon>
          <span class="font-weight-bold d-none d-lg-inline">GitHub</span>
        </v-btn>

        <!-- Mobile Drawer Toggle -->
        <v-btn
          class="mobile-menu-btn d-flex d-md-none"
          icon
          variant="tonal"
          @click="drawer = true"
          aria-label="Open navigation menu"
        >
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </div>
    </v-container>
  </v-app-bar>
</template>

<style scoped>
/* ---------------------------------
   GLOBAL HEADER (Vue App Bar)
--------------------------------- */
.premium-app-bar {
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--portfolio-ink, #231219) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(124, 14, 68, 0.08) !important;
  box-shadow: 0 4px 20px rgba(124, 14, 68, 0.04) !important;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.4, 1) !important;
}

.brand-link {
  transition: transform 0.25s ease;
  transform-origin: left center;
  z-index: 2;
}

.brand-link:hover {
  transform: scale(1.03);
}

/* ------------------------------------
   DESKTOP SEGMENTED NAVIGATION
------------------------------------ */
.desktop-nav {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.nav-segment-control {
  display: flex;
  align-items: center;
  background: rgba(124, 14, 68, 0.05);
  padding: 5px;
  border-radius: 100px;
  border: 1px solid rgba(124, 14, 68, 0.09);
  gap: 3px;
}

.seg-item {
  position: relative;
  border-radius: 100px;
  padding: 7px clamp(12px, 1.4vw, 20px);
  font-weight: 600;
  font-size: clamp(0.85rem, 0.9vw, 0.92rem);
  letter-spacing: 0.01em;
  color: var(--portfolio-ink-soft, #4E3842);
  transition: all 0.25s ease;
  white-space: nowrap;
}

.seg-item-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
}

.seg-item:hover {
  color: var(--portfolio-primary, #7C0E44);
  background: rgba(124, 14, 68, 0.06);
}

.seg-active {
  color: #FFFFFF !important;
  background: var(--portfolio-primary, #7C0E44) !important;
  box-shadow: 0 2px 10px rgba(124, 14, 68, 0.25);
}

.seg-active:hover {
  background: #901452 !important;
  color: #FFFFFF !important;
}

/* ---------------------------------
   ACTIONS & BUTTONS
--------------------------------- */
.header-actions {
  z-index: 2;
  flex-shrink: 0;
}

.github-action-btn {
  background: var(--portfolio-primary, #7C0E44) !important;
  color: #FFFFFF !important;
  border: 1px solid rgba(124, 14, 68, 0.12);
  box-shadow: 0 2px 8px rgba(124, 14, 68, 0.18) !important;
  transition: all 0.25s ease !important;
}

.github-action-btn:hover {
  transform: translateY(-2px);
  background: #901452 !important;
  box-shadow: 0 6px 16px rgba(124, 14, 68, 0.25) !important;
}

.mobile-menu-btn {
  background: rgba(124, 14, 68, 0.06);
  border: 1px solid rgba(124, 14, 68, 0.1);
  border-radius: 12px;
  color: var(--portfolio-primary, #7C0E44) !important;
  width: 42px !important;
  height: 42px !important;
}

/* ---------------------------------
   MOBILE DRAWER
--------------------------------- */
.premium-mobile-drawer {
  max-width: 86vw !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 10060 !important;
}

.premium-mobile-drawer :deep(.v-navigation-drawer__content) {
  background: #FFFFFF;
  box-shadow: -10px 0 30px rgba(124, 14, 68, 0.08);
  border-left: 1px solid rgba(124, 14, 68, 0.1);
}

.drawer-shell {
  padding: 24px 20px;
}

.drawer-close {
  background: rgba(124, 14, 68, 0.06);
  color: var(--portfolio-primary, #7C0E44) !important;
  cursor: pointer;
  pointer-events: auto;
  z-index: 10;
}

.drawer-subtitle {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--portfolio-muted, #7E636E);
  margin-bottom: 16px;
  padding-left: 8px;
}

.premium-drawer-item {
  border: 1px solid transparent !important;
  padding: 10px 14px !important;
  transition: all 0.2s ease;
  color: var(--portfolio-ink, #231219) !important;
}

.premium-drawer-item:hover {
  background: rgba(124, 14, 68, 0.05) !important;
  border-color: rgba(124, 14, 68, 0.1) !important;
  transform: translateX(4px);
}

.link-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(124, 14, 68, 0.08);
  color: var(--portfolio-primary, #7C0E44);
  margin-right: 14px;
  transition: all 0.2s ease;
}

.active-icon-wrapper {
  background: var(--portfolio-primary, #7C0E44);
  color: #FFFFFF !important;
}

.link-title {
  color: var(--portfolio-ink, #231219);
  font-size: 0.98rem;
  font-weight: 600;
}

.link-arrow {
  color: var(--portfolio-muted, #7E636E);
  transition: transform 0.2s ease;
}

.premium-drawer-item:hover .link-arrow {
  transform: translateX(3px);
  color: var(--portfolio-primary, #7C0E44);
}

.is-active-item {
  background: rgba(124, 14, 68, 0.06) !important;
  border-color: rgba(124, 14, 68, 0.14) !important;
}

.premium-github-btn {
  background: linear-gradient(135deg, var(--portfolio-primary, #7C0E44), var(--portfolio-secondary, #AA5E7A)) !important;
  color: #FFFFFF !important;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(124, 14, 68, 0.2) !important;
}

@media (min-width: 960px) and (max-width: 1100px) {
  .seg-item {
    padding: 6px 10px;
    font-size: 0.82rem;
  }
  .seg-item-content .v-icon {
    font-size: 16px !important;
    margin-right: 4px !important;
  }
}

@media (max-width: 600px) {
  .drawer-shell {
    padding: 20px 16px;
  }
}

@media (max-width: 400px) {
  .header-actions {
    gap: 4px !important;
  }
  .mobile-menu-btn {
    width: 38px !important;
    height: 38px !important;
    border-radius: 10px !important;
  }
  .premium-github-btn {
    font-size: 0.95rem !important;
    padding: 0 12px !important;
  }
}
</style>
