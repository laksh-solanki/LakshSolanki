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
  <v-footer class="premium-footer px-md-0 py-0">
    <v-container class="py-6 py-md-14">
      <v-row class="ga-6 ga-md-0 footer-main-row" align="start">
        <v-col cols="12" sm="12" md="6" lg="4" class="footer-column mb-8 mb-lg-0">
          <div class="brand-section">
            <mainsvgicon :size="44" />
            <p class="footer-description mt-4 mb-5">
              Building premium digital products with strong UX, practical architecture, and reliable delivery.
            </p>
            <div class="d-flex ga-2 mb-5 flex-wrap social-links">
              <v-btn v-for="social in socialLinks" :key="social.label" :icon="social.icon" :href="social.href"
                target="_blank" variant="tonal" color="primary" size="small" :aria-label="social.label"></v-btn>
            </div>
            <div class="meta-chip-wrap">
              <v-chip color="primary" variant="tonal" size="small">Response Time: &lt; 24h</v-chip>
              <v-chip color="primary" variant="tonal" size="small">Timezone: IST</v-chip>
            </div>
          </div>
        </v-col>

        <v-col cols="12" sm="6" md="3" lg="2" class="footer-column mb-6 mb-md-8 mb-lg-0">
          <div class="link-section">
            <p class="footer-title">Navigation</p>
            <div class="d-flex flex-column ga-2 footer-link-list">
              <router-link v-for="item in quickLinks" :key="item.path" :to="item.path" class="footer-link">
                {{ item.title }}
              </router-link>
            </div>
          </div>
        </v-col>

        <v-col cols="12" sm="6" md="3" lg="3" class="footer-column mb-6 mb-md-8 mb-lg-0">
          <div class="link-section">
            <p class="footer-title">Services</p>
            <ul class="service-list">
              <li v-for="service in services" :key="service">{{ service }}</li>
            </ul>
          </div>
        </v-col>

        <v-col cols="12" sm="12" md="6" lg="3" class="footer-column subscribe-anchor">
          <div class="subscribe-section">
            <p class="footer-title">Get Updates</p>
            <EmailRegisterPopup />
          </div>
        </v-col>
      </v-row>

      <v-row class="footer-bottom mt-8 mx-n2" align="center" justify="space-between">
        <v-col cols="12" md="12">
          <div class="d-inline-flex justify-center justify-md-start align-center">
            <p class="mb-0 text-caption footer-meta">
              © {{ new Date().getFullYear() }} Laksh Solanki
            </p>
          </div>
        </v-col>
        <v-col cols="12" md="12" class="px-2">
          <div
            class="d-flex align-center ga-4 text-caption footer-meta footer-bottom-meta flex-wrap justify-center justify-md-end">
            <span>All rights reserved</span>
            <span class="d-none d-sm-inline">•</span>
            <span>Version 2.0</span>
          </div>
        </v-col>
      </v-row>
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
  width: 100%;
}

.footer-main-row {
  row-gap: clamp(16px, 2.2vw, 28px);
}

.footer-column {
  min-width: 0;
}

.brand-section,
.link-section,
.subscribe-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.footer-title {
  margin-bottom: 10px;
  font-weight: 700;
  color: var(--portfolio-ink);
  letter-spacing: 0.02em;
  font-size: 0.95rem;
}

.footer-description {
  color: var(--portfolio-muted);
  line-height: 1.6;
  font-size: 0.9rem;
  max-width: 44ch;
}

.footer-link {
  color: var(--portfolio-ink-soft);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: color 0.2s ease;
  display: inline-block;
}

.footer-link:hover {
  color: var(--portfolio-primary);
}

.service-list {
  margin: 0;
  padding-left: 0;
  color: var(--portfolio-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  font-size: 0.9rem;
}

.service-list li {
  line-height: 1.45;
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
  width: 100%;
}

.footer-bottom {
  border-top: 1px solid rgba(15, 143, 124, 0.12);
  width: 100%;
}

.footer-bottom-meta {
  flex-wrap: wrap;
}

.footer-meta {
  color: var(--portfolio-muted);
  line-height: 1.5;
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

/* Tablet responsiveness */
@media (max-width: 1264px) {
  .footer-description {
    max-width: 40ch;
  }
}

/* Medium tablet and large phones */
@media (max-width: 960px) {
  .footer-main-row {
    row-gap: 18px;
  }

  .footer-title {
    font-size: 0.875rem;
  }

  .footer-description {
    font-size: 0.85rem;
    max-width: none;
  }

  .subscribe-section {
    max-width: 560px;
  }
}

/* Small phones */
@media (max-width: 600px) {
  .premium-footer {
    padding-left: 0;
    padding-right: 0;
  }

  .footer-description {
    max-width: none;
  }

  .footer-title {
    margin-bottom: 8px;
  }

  .brand-section,
  .link-section,
  .subscribe-section {
    text-align: center;
    align-items: center;
  }

  .footer-link-list {
    align-items: center;
  }

  .social-links {
    justify-content: center;
  }

  .service-list {
    align-items: center;
    width: 100%;
  }

  .subscribe-section {
    width: 100%;
    max-width: none;
  }

  .footer-bottom-meta {
    justify-content: center;
    text-align: center;
  }

  .footer-bottom-meta span {
    display: block;
  }

  .footer-bottom-meta span{
    margin-bottom: 4px;
  }

  .meta-chip-wrap {
    justify-content: center;
  }
}

/* Extra small devices */
@media (max-width: 375px) {
  .footer-title {
    font-size: 0.8rem;
  }

  .footer-description {
    font-size: 0.775rem;
  }

  .footer-link,
  .service-list li {
    font-size: 0.8rem;
  }

  .meta-chip-wrap :deep(.v-chip) {
    font-size: 0.7rem;
  }
}
</style>
