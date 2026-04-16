<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import mainsvgicon from "@/assets/mainsvgicon.vue";
import SearchBar from "@/components/Search-bar.vue";

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
</script>

<template>
  <v-navigation-drawer
    v-if="$vuetify.display.mdAndDown"
    v-model="drawer"
    temporary
    location="right"
    :width="$vuetify.display.xs ? 320 : 380"
    class="premium-mobile-drawer border-0"
  >
    <div class="drawer-shell d-flex flex-column h-100">
      <div class="drawer-header d-flex align-center justify-space-between mb-8">
        <mainsvgicon :size="42" />
        <v-btn class="drawer-close" icon="mdi-close" variant="tonal" size="small" @click="closeDrawer"></v-btn>
      </div>

      <nav class="drawer-nav flex-grow-1">
        <p class="drawer-subtitle">Navigation</p>
        <v-list class="bg-transparent pa-0 drawer-links" nav>
          <v-list-item
            v-for="link in navLinks"
            :key="link.path"
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
    class="premium-app-bar scrolled-down" 
    flat 
    height="80"
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
              <v-icon size="20" class="mr-2">{{ isActive(link.path) ? link.activeIcon : link.icon }}</v-icon>
              {{ link.title }}
            </span>
          </router-link>
        </div>
      </nav>

      <!-- Right Actions (Search + Social) -->
      <div class="header-actions d-flex align-center ga-2 ga-md-4">
        
        <SearchBar class="search-component" />

        <v-btn
          class="github-action-btn d-none d-md-flex text-none"
          rounded="xl"
          variant="flat"
          :href="githubProfile"
          target="_blank"
          rel="noopener noreferrer"
        >
          <v-icon start icon="mdi-github" size="20"></v-icon>
          <span class="font-weight-bold">GitHub</span>
        </v-btn>

        <!-- Mobile Drawer Toggle -->
        <v-btn
          class="mobile-menu-btn d-flex d-md-none"
          icon
          variant="tonal"
          @click="drawer = true"
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
  background: rgba(var(--v-theme-surface), 0.75) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  backdrop-filter: blur(28px) saturate(200%);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1) !important;
}

.brand-link {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: left center;
  z-index: 2; /* Ensure it stays clickable above absolute nav */
}

.brand-link:hover {
  transform: scale(1.04);
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
  background: rgba(var(--v-theme-on-surface), 0.04);
  padding: 6px;
  border-radius: 100px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  gap: 4px;
}

.seg-item {
  position: relative;
  border-radius: 100px;
  padding: 8px 22px;
  color: rgba(var(--v-theme-on-surface), 0.75);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
}

.seg-item-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
}

.seg-item:hover {
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.seg-active {
  color: #ffffff !important;
  background: var(--portfolio-primary, #0f8f7c);
  box-shadow: 0 4px 16px rgba(15, 143, 124, 0.3);
}

.seg-active:hover {
  background: var(--portfolio-primary, #0f8f7c);
  filter: brightness(1.06);
}

/* ---------------------------------
   ACTIONS & BUTTONS
--------------------------------- */
.header-actions {
  z-index: 2; 
  flex-shrink: 0;
}

.github-action-btn {
  background: linear-gradient(135deg, var(--portfolio-primary, #0f8f7c), #24a992) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 6px 16px rgba(15, 143, 124, 0.25) !important;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;
}

.github-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 143, 124, 0.35) !important;
  filter: brightness(1.08);
}

.mobile-menu-btn {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  color: rgb(var(--v-theme-on-surface)) !important;
  transition: background-color 0.2s ease;
  width: 44px !important;
  height: 44px !important;
}

.mobile-menu-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.1);
}

/* ---------------------------------
   MOBILE DRAWER (ULTRA PREMIUM)
--------------------------------- */
.premium-mobile-drawer {
  backdrop-filter: blur(36px) saturate(200%);
}

.premium-mobile-drawer :deep(.v-navigation-drawer__content) {
  background: rgba(var(--v-theme-surface), 0.85);
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.15);
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.drawer-shell {
  padding: 30px 20px;
}

.drawer-close {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface)) !important;
}

.drawer-subtitle {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 20px;
  padding-left: 14px;
}

.premium-drawer-item {
  border: 1px solid transparent !important;
  padding: 10px 14px !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0.9;
}

.premium-drawer-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.08) !important;
  transform: translateX(4px);
  opacity: 1;
}

.link-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-right: 18px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.premium-drawer-item:hover .link-icon-wrapper {
  background: rgba(var(--v-theme-on-surface), 0.08);
  transform: scale(1.06) rotate(-4deg);
}

.active-icon-wrapper {
  background: linear-gradient(135deg, var(--portfolio-primary), #24a992);
  color: #fff !important;
  box-shadow: 0 8px 20px rgba(15, 143, 124, 0.3);
}

.link-title {
  color: rgb(var(--v-theme-on-surface));
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0em;
}

.link-arrow {
  color: rgba(var(--v-theme-on-surface), 0.4);
  transition: transform 0.3s ease, color 0.3s ease;
}

.premium-drawer-item:hover .link-arrow {
  transform: translateX(4px);
  color: rgb(var(--v-theme-on-surface));
}

.is-active-item {
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.1) !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
  opacity: 1;
}

.premium-github-btn {
  background: linear-gradient(135deg, var(--portfolio-primary), #24a992) !important;
  color: white !important;
  font-weight: 700;
  letter-spacing: 0.03em;
  box-shadow: 0 10px 30px rgba(15, 143, 124, 0.35) !important;
  transition: all 0.3s ease !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.premium-github-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 40px rgba(15, 143, 124, 0.45) !important;
  filter: brightness(1.1);
}

@media (max-width: 600px) {
  .drawer-shell {
    padding: 24px 16px;
  }
}
</style>
