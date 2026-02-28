<script setup>
import mainsvgicon from "@/assets/mainsvgicon.vue";
import EmailRegisterPopup from "@/components/EmailRegisterPopup.vue";

const quickLinks = [
  { title: "Home", path: "/" },
  { title: "About", path: "/about" },
  { title: "Projects", path: "/projects" },
  { title: "Profile", path: "/profile" },
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
      <v-row class="ga-0">
        <v-col cols="12" lg="4" class="pr-lg-8 mb-8 mb-lg-0">
          <mainsvgicon :size="44" variant="inverse" />
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
              color="teal-lighten-3"
              size="small"
              :aria-label="social.label"
            ></v-btn>
          </div>
          <div class="meta-chip-wrap">
            <v-chip color="teal-lighten-4" variant="flat" size="small">Response Time: < 24h</v-chip>
            <v-chip color="teal-lighten-4" variant="flat" size="small">Timezone: IST</v-chip>
          </div>
        </v-col>

        <v-col cols="6" sm="4" lg="2" class="mb-8 mb-lg-0">
          <p class="footer-title">Navigation</p>
          <div class="d-flex flex-column ga-2">
            <router-link v-for="item in quickLinks" :key="item.path" :to="item.path" class="footer-link">
              {{ item.title }}
            </router-link>
          </div>
        </v-col>

        <v-col cols="6" sm="4" lg="3" class="mb-8 mb-lg-0">
          <p class="footer-title">Services</p>
          <ul class="service-list">
            <li v-for="service in services" :key="service">{{ service }}</li>
          </ul>
        </v-col>

        <v-col id="subscribe-container" cols="12" sm="4" lg="3" class="subscribe-anchor">
          <p class="footer-title">Get Updates</p>
          <p class="subscribe-note mb-3">
            Fill this quick form and I will contact you for collaboration updates.
          </p>
          <EmailRegisterPopup />
        </v-col>
      </v-row>

      <div class="footer-bottom mt-8 pt-5 d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-3">
        <p class="mb-0 text-caption text-grey-lighten-2">
          (c) {{ new Date().getFullYear() }} Laksh Solanki. Premium portfolio crafted with Vue and Vuetify.
        </p>
        <div class="d-flex align-center ga-4 text-caption text-grey-lighten-1">
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
  color: #ecf9f5;
  border-top: 1px solid rgba(124, 225, 207, 0.24);
  background:
    radial-gradient(circle at 18% 0%, rgba(37, 161, 140, 0.4), transparent 38%),
    radial-gradient(circle at 92% 12%, rgba(245, 158, 11, 0.22), transparent 30%),
    linear-gradient(165deg, #10231f 0%, #0d1f1b 45%, #0a1714 100%);
}

.cta-band {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid rgba(126, 232, 213, 0.26);
  background: linear-gradient(145deg, rgba(22, 74, 66, 0.9), rgba(18, 58, 52, 0.85));
  box-shadow: 0 24px 40px rgba(0, 0, 0, 0.25);
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
  color: #ffffff;
  letter-spacing: 0.02em;
}

.footer-description {
  color: #b5cec8;
  max-width: 44ch;
}

.footer-link {
  color: #d9efea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #7ce1cf;
}

.service-list {
  margin: 0;
  padding-left: 18px;
  color: #cce3de;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.footer-bottom {
  border-top: 1px solid rgba(124, 225, 207, 0.2);
}

.subscribe-note {
  color: #cce3de;
  font-size: 0.86rem;
  line-height: 1.45;
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
  .cta-btn {
    width: 100%;
  }
}
</style>
