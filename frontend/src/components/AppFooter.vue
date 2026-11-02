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
  <v-footer class="app-footer">
    <v-container class="py-10" fluid>
      <v-row density="comfortable">
        <!-- Brand & Info -->
        <v-col cols="12" md="4" class="mb-8 mb-md-0">
          <mainsvgicon :size="40" class="mb-5" />
          <p class="text-body-2 footer-copy mb-6 pr-md-6">
            Building digital products that combine beautiful, minimal design with robust engineering. Focused on creating exceptional, fast, and scalable user experiences.
          </p>
          <div class="d-flex ga-3">
            <a v-for="social in socialLinks" :key="social.label" :href="social.href" target="_blank"
               class="social-icon" :aria-label="social.label">
              <v-icon :icon="social.icon" size="20"></v-icon>
            </a>
          </div>
        </v-col>

        <!-- Navigation -->
        <v-col cols="6" md="2" class="mb-8 mb-md-0">
          <h4 class="footer-heading mb-5">Navigation</h4>
          <div class="d-flex flex-column ga-3">
            <router-link v-for="item in quickLinks" :key="item.path" :to="item.path"
               class="footer-link text-body-2">
              {{ item.title }}
            </router-link>
          </div>
        </v-col>

        <!-- Services -->
        <v-col cols="6" md="2" class="mb-8 mb-md-0">
          <h4 class="footer-heading mb-5">Services</h4>
          <div class="d-flex flex-column ga-3">
            <span v-for="service in services" :key="service" class="footer-item text-body-2">
              {{ service }}
            </span>
          </div>
        </v-col>

        <!-- Newsletter -->
        <v-col cols="12" md="4">
          <h4 class="footer-heading mb-4">Stay Connected</h4>
          <EmailRegisterPopup />
        </v-col>
      </v-row>

      <v-divider class="my-8 footer-divider"></v-divider>

      <!-- Bottom Bar -->
      <div class="footer-bottom d-flex flex-column flex-sm-row justify-space-between align-center">
        <span class="text-caption footer-copyright mb-3 mb-sm-0">
          &copy; {{ new Date().getFullYear() }} Laksh Solanki. All rights reserved.
        </span>
        <div class="d-flex ga-6 align-center">
          <span class="text-caption footer-meta d-flex align-center">
            <v-icon size="x-small" icon="mdi-map-marker-outline" class="mr-1"></v-icon> IST Timezone
          </span>
          <span class="text-caption footer-meta d-flex align-center">
            <v-icon size="x-small" icon="mdi-lightning-bolt-outline" class="mr-1"></v-icon> Fast Response
          </span>
        </div>
      </div>
    </v-container>
  </v-footer>
</template>

<style scoped>
.app-footer {
  background: var(--portfolio-surface-soft, #FAF3F0);
  border-top: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  color: var(--portfolio-ink, #231219);
}

.footer-heading {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--portfolio-primary, #7C0E44);
}

.footer-copy {
  color: var(--portfolio-muted, #7E636E);
  line-height: 1.65;
}

.footer-link,
.footer-item {
  color: var(--portfolio-ink-soft, #4E3842);
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.footer-link:hover {
  color: var(--portfolio-primary, #7C0E44);
  transform: translateX(2px);
}

.social-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(124, 14, 68, 0.12);
  background: #FFFFFF;
  color: var(--portfolio-primary, #7C0E44);
  transition: all 0.2s ease;
}

.social-icon:hover {
  background: var(--portfolio-primary, #7C0E44);
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 14, 68, 0.15);
}

.footer-divider {
  border-color: rgba(124, 14, 68, 0.08) !important;
}

.footer-copyright,
.footer-meta {
  color: var(--portfolio-muted, #7E636E);
}
</style>
