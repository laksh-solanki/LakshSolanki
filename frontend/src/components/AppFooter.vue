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
  <v-footer class="premium-footer px-0 py-0">
    <v-container class="py-10 py-md-14">
      <v-row class="ga-0 footer-main-row">
        <v-col cols="12" md="6" lg="4" class="pr-lg-8 mb-8 mb-lg-0">
          <mainsvgicon :size="44" />
          <p class="footer-description mt-4 mb-5">
            Building premium digital products with strong UX, practical architecture, and reliable delivery.
          </p>
          <div class="d-flex ga-2 mb-5">
            <v-btn
              v-for="social in socialLinks"
              :key="social.label"
              :icon="social.icon"
              :href="social.href"
              target="_blank"
              variant="tonal"
              color="primary"
              size="small"
              :aria-label="social.label"
            ></v-btn>
          </div>
          <div class="meta-chip-wrap">
            <v-chip color="primary" variant="tonal" size="small">Response Time: < 24h</v-chip>
            <v-chip color="primary" variant="tonal" size="small">Timezone: IST</v-chip>
          </div>
        </v-col>

        <v-col cols="6" md="3" lg="2" class="mb-8 mb-lg-0">
          <p class="footer-title">Navigation</p>
          <div class="d-flex flex-column ga-2">
            <router-link v-for="item in quickLinks" :key="item.path" :to="item.path" class="footer-link">
              {{ item.title }}
            </router-link>
          </div>
        </v-col>

        <v-col cols="6" md="3" lg="3" class="mb-8 mb-lg-0">
          <p class="footer-title">Services</p>
          <ul class="service-list">
            <li v-for="service in services" :key="service">{{ service }}</li>
          </ul>
        </v-col>

        <v-col id="subscribe-container" cols="12" md="6" lg="3" class="subscribe-anchor">
          <p class="footer-title">Get Updates</p>
          <EmailRegisterPopup />
        </v-col>
      </v-row>

      <div class="footer-bottom mt-8 pt-5 d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-3">
        <p class="mb-0 text-caption footer-meta">
          © {{ new Date().getFullYear() }} Laksh Solanki. Premium portfolio crafted with Vue and Vuetify.
        </p>
        <div class="d-flex align-center ga-4 text-caption footer-meta footer-bottom-meta">
          <span>Built for desktop and mobile</span>
          <span>Version 2.0</span>
        </div>
      </div>
    </v-container>
  </v-footer>
</template>

<style scoped>
.premium-footer {
  position: relative;
  color: var(--portfolio-ink);
  border-top: 1px solid rgba(15, 143, 124, 0.14);
  background:
    radial-gradient(circle at 18% 0%, rgba(15, 143, 124, 0.08), transparent 38%),
    radial-gradient(circle at 92% 12%, rgba(209, 138, 31, 0.08), transparent 30%),
    linear-gradient(165deg, #ffffff 0%, #f3f8f6 45%, #eef4f1 100%);
}

.footer-main-row {
  row-gap: 14px;
}

.cta-band {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid rgba(15, 143, 124, 0.14);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(240, 246, 244, 0.96));
  box-shadow: 0 24px 40px rgba(18, 38, 33, 0.08);
}

.cta-copy {
  max-width: 680px;
}

.cta-btn {
  min-width: 220px;
  font-weight: 700;
}

.footer-title {
  margin-bottom: 10px;
  font-weight: 700;
  color: var(--portfolio-ink);
  letter-spacing: 0.02em;
}

.footer-description {
  color: var(--portfolio-muted);
  max-width: 44ch;
}

.footer-link {
  color: var(--portfolio-ink-soft);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--portfolio-primary);
}

.service-list {
  margin: 0;
  padding-left: 18px;
  color: var(--portfolio-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subscribe-anchor {
  display: flex;
  flex-direction: column;
}

.subscribe-anchor :deep(.newsletter-card) {
  height: 100%;
}

.footer-bottom {
  border-top: 1px solid rgba(15, 143, 124, 0.12);
}

.footer-bottom-meta {
  flex-wrap: wrap;
}

.subscribe-note {
  color: var(--portfolio-muted);
  font-size: 0.86rem;
  line-height: 1.45;
}

.footer-meta {
  color: var(--portfolio-muted);
}

.premium-footer :deep(.v-btn--variant-tonal) {
  background: rgba(15, 143, 124, 0.1);
  color: var(--portfolio-primary);
}

.meta-chip-wrap :deep(.v-chip) {
  border: 1px solid rgba(15, 143, 124, 0.14);
  background: rgba(15, 143, 124, 0.08);
  color: var(--portfolio-ink);
}

.premium-footer :deep(.text-grey-lighten-2),
.premium-footer :deep(.text-grey-lighten-1) {
  color: var(--portfolio-muted) !important;
}

.subscribe-anchor.subscribe-focus {
  animation: subscribe-pulse 1.2s ease;
}

@keyframes subscribe-pulse {
  0% {
    transform: translateY(0);
    filter: brightness(1);
  }
  40% {
    transform: translateY(-4px);
    filter: brightness(1.07);
  }
  100% {
    transform: translateY(0);
    filter: brightness(1);
  }
}

@media (max-width: 960px) {
  .footer-main-row {
    row-gap: 18px;
  }

  .service-list {
    padding-left: 0;
    list-style: none;
  }

  .cta-btn {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .footer-description {
    max-width: none;
  }

  .footer-bottom {
    align-items: flex-start !important;
  }
}
</style>
