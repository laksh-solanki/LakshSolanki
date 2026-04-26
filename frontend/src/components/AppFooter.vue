<script setup>
import mainsvgicon from "@/assets/mainsvgicon.vue";
import EmailRegisterPopup from "@/components/EmailRegisterPopup.vue";

const quickLinks = [
  { title: "Home", path: "/" },
  { title: "About", path: "/about" },
  { title: "Projects", path: "/projects" },
];

const services = ["Frontend Architecture", "API Development", "UI Engineering", "Performance Optimization"];

const socialLinks = [
  { icon: "mdi-github", href: "https://github.com/laksh-solanki", label: "GitHub" },
  { icon: "mdi-linkedin", href: "https://www.linkedin.com", label: "LinkedIn" },
  { icon: "mdi-email", href: "mailto:lakshsolanki848@gmail.com", label: "Email" },
];
</script>

<template>
  <v-footer class="app-footer pa-0">
    <v-container class="py-7 px-0">
      <v-row density="comfortable">
        <!-- Brand & Info -->
        <v-col cols="12" md="4" class="mb-8 mb-md-0">
          <mainsvgicon :size="40" class="mb-6" />
          <p class="text-body-2 text-medium-emphasis mb-6 pr-md-4" style="line-height: 1.6;">
            Building digital products that combine beautiful design with robust engineering. Focused on creating exceptional, fast, and scalable user experiences.
          </p>
          <div class="d-flex ga-4">
            <a v-for="social in socialLinks" :key="social.label" :href="social.href" target="_blank"
               class="social-icon text-medium-emphasis hover-primary transition-colors text-decoration-none" :aria-label="social.label">
              <v-icon :icon="social.icon" size="22"></v-icon>
            </a>
          </div>
        </v-col>
        
        <!-- Navigation -->
        <v-col cols="6" md="2" class="mb-8 mb-md-0">
          <h4 class="text-caption font-weight-bold mb-6 text-uppercase tracking-wider text-high-emphasis">Navigation</h4>
          <div class="d-flex flex-column ga-4">
            <router-link v-for="item in quickLinks" :key="item.path" :to="item.path"
               class="text-body-2 text-medium-emphasis text-decoration-none hover-primary transition-colors">
              {{ item.title }}
            </router-link>
          </div>
        </v-col>

        <!-- Services -->
        <v-col cols="6" md="2" class="mb-8 mb-md-0">
          <h4 class="text-caption font-weight-bold mb-6 text-uppercase tracking-wider text-high-emphasis">Services</h4>
          <div class="d-flex flex-column ga-4">
            <span v-for="service in services" :key="service" class="text-body-2 text-medium-emphasis">
              {{ service }}
            </span>
          </div>
        </v-col>

        <!-- Newsletter -->
        <v-col cols="12" md="4">
          <h4 class="text-caption font-weight-bold mb-6 text-uppercase tracking-wider text-high-emphasis">Stay up to date</h4>
          <EmailRegisterPopup />
        </v-col>
      </v-row>
      <v-divider class="mt-7"></v-divider>
      <!-- Bottom Bar -->
      <div class="footer-bottom d-flex flex-column flex-sm-row justify-space-between align-center pt-8">
        <span class="text-caption text-medium-emphasis mb-4 mb-sm-0">
          &copy; {{ new Date().getFullYear() }} Laksh Solanki. All rights reserved.
        </span>
        <div class="d-flex ga-6 align-center">
           <span class="text-caption text-medium-emphasis d-flex align-center">
             <v-icon size="x-small" icon="mdi-map-marker-outline" class="mr-1"></v-icon> IST Timezone
           </span>
           <span class="text-caption text-medium-emphasis d-flex align-center">
             <v-icon size="x-small" icon="mdi-lightning-bolt-outline" class="mr-1"></v-icon> Fast Response
           </span>
        </div>
      </div>
    </v-container>
  </v-footer>
</template>

<style scoped>
.app-footer {
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.tracking-wider {
  letter-spacing: 0.08em;
}

.transition-colors {
  transition: color 0.2s ease, transform 0.2s ease;
}

.hover-primary:hover {
  color: rgb(var(--v-theme-primary)) !important;
}

.social-icon:hover {
  transform: translateY(-2px);
  display: inline-block;
}

.border-top {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.text-high-emphasis {
  color: rgba(var(--v-theme-on-surface), 0.95);
}
</style>
