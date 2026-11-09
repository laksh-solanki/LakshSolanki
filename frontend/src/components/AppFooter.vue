<script setup>
import { ref } from "vue";
import mainsvgicon from "@/assets/mainsvgicon.vue";
import EmailRegisterPopup from "@/components/EmailRegisterPopup.vue";

const quickLinks = [
  { title: "Home", path: "/" },
  { title: "About", path: "/about" },
  { title: "Projects", path: "/projects" },
];

const services = ["Frontend Architecture", "API Development", "UI Engineering", "Performance Optimization"];

const copied = ref(false);
let copyTimeout = null;

const copyEmail = async () => {
  const email = "lakshsolanki848@gmail.com";
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(email);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = email;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    copied.value = true;
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy email:", err);
  }
};

</script>

<template>
  <v-footer class="app-footer">
    <v-container class="py-8 py-md-12">
      <v-row density="comfortable">
        <!-- Brand & Info -->
        <v-col cols="12" md="4" class="mb-6 mb-md-0">
          <mainsvgicon :size="40" class="mb-4" />
          <p class="text-body-2 footer-copy mb-5 pr-md-6">
            Building digital products that combine beautiful, minimal design with robust engineering. Focused on
            creating exceptional, fast, and scalable user experiences.
          </p>
          <div class="d-flex ga-3"> <a href="https://github.com/laksh-solanki" target="_blank" rel="noopener noreferrer"
              class="social-icon" aria-label="GitHub">
              <v-icon icon="mdi-github" size="20"></v-icon>
            </a>
            <a href="https://www.linkedin.com/in/laksh-solanki" target="_blank" rel="noopener noreferrer"
              class="social-icon" aria-label="LinkedIn">
              <v-icon icon="mdi-linkedin" size="20"></v-icon>
            </a>
            <button type="button" class="social-icon" :class="{ 'copied': copied }"
              :aria-label="copied ? 'Email copied!' : 'Copy email address'"
              :title="copied ? 'Email copied!' : 'Click to copy email: lakshsolanki848@gmail.com'" @click="copyEmail">
              <v-icon :icon="copied ? 'mdi-check' : 'mdi-email-outline'" size="20"></v-icon>
            </button>
            <a href="https://www.instagram.com/laksh_solanki" target="_blank" rel="noopener noreferrer"
              class="social-icon" aria-label="Instagram">
              <v-icon icon="mdi-instagram" size="20"></v-icon>

            </a>
          </div>
        </v-col>

        <!-- Navigation -->
        <v-col cols="6" sm="6" md="2" class="mb-6 mb-md-0">
          <h4 class="footer-heading mb-4">Navigation</h4>
          <div class="d-flex flex-column ga-2 ga-md-3">
            <router-link v-for="item in quickLinks" :key="item.path" :to="item.path" class="footer-link text-body-2">
              {{ item.title }}
            </router-link>
          </div>
        </v-col>

        <!-- Services -->
        <v-col cols="6" sm="6" md="2" class="mb-6 mb-md-0">
          <h4 class="footer-heading mb-4">Services</h4>
          <div class="d-flex flex-column ga-2 ga-md-3">
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

      <v-divider class="my-6 my-md-8 footer-divider"></v-divider>

      <!-- Bottom Bar -->
      <div
        class="footer-bottom d-flex flex-column flex-sm-row justify-space-between align-center text-center text-sm-start ga-3">
        <span class="text-caption footer-copyright">
          &copy; {{ new Date().getFullYear() }} Laksh Solanki. All rights reserved.
        </span>
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
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: all 0.2s ease;
}

.social-icon:hover {
  background: var(--portfolio-primary, #7C0E44);
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 14, 68, 0.15);
}

.social-icon.copied {
  background: var(--portfolio-primary, #7C0E44);
  color: #FFFFFF;
  border-color: var(--portfolio-primary, #7C0E44);
}
</style>