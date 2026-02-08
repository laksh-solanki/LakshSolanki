<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import mainsvgicon from '@/assets/mainsvgicon.vue'
import EmailRegisterPopup from "@/components/EmailRegisterPopup.vue";

const route = useRoute()
const tab = ref(route.path)

watch(
  () => route.path,
  (newPath) => (tab.value = newPath),
)

const quickLinks = [
  { title: 'Home', path: '/', icon: 'mdi-home' },
  { title: 'About', path: '/about', icon: 'mdi-information' },
  { title: 'Projects', path: '/projects', icon: 'mdi-view-dashboard' },
]
</script>
<template>
  <v-divider color="grey-lighten-1" opacity="25"></v-divider>
  <v-footer class="text-center pa-3 d-flex">
    <v-row>
      <v-col cols="12" md="12" class="text-center d-flex flex-column justify-center align-center">
        <div class="d-flex justify-center align-center my-4">
          <mainsvgicon />
        </div>
        <v-divider width="40" thickness="3" opacity="25"></v-divider>
      </v-col>
      <v-col cols="12" md="3" sm="6" xs="12">
        <v-icon icon="mdi-information" size="40" color="primary" class="mb-2"></v-icon>
        <p class="text-h6 font-weight-bold my-2">About Mindlytic</p>
        <p class="text-body-2">
          We are committed to providing exceptional services and solutions to our customers. Our
          mission is to deliver excellence in every project we undertake.
        </p>
      </v-col>
      <v-col cols="12" md="3" sm="6" xs="12">
        <div class="d-flex flex-column align-center justify-center text-center">
          <v-icon icon="mdi-link-variant" size="40" color="primary" class="mb-2"></v-icon>
          <p class="text-h6 font-weight-bold align-center my-2">Quick Links</p>
          <v-tabs inset v-model="tab" slider-color="primary" direction="vertical" density="comfortable" class="pa-2 transparent rounded-lg">
            <v-tab v-for="(link, index) in quickLinks" width="230" :key="index" :value="link.path" :to="link.path"
              :prepend-icon="link.icon" class="d-flex justify-center align-center text-center">
              {{ link.title }}
            </v-tab>
          </v-tabs>
        </div>
      </v-col>
      <v-col cols="12" md="3" sm="6" xs="12">
        <v-icon icon="mdi-phone-log" size="40" color="primary" class="mb-2"></v-icon>
        <p class="text-h6 align-center font-weight-bold my-2">Contact Us</p>
        <div class="contact-info">
          <p class="d-flex align-center justify-center text-center mb-2">
            <v-icon size="small" class="mr-2">mdi-phone</v-icon>
            +91 9033220721
          </p>
          <p class="d-flex align-center justify-center text-center lh-2 mb-2">
            <v-icon size="small" class="mr-2">mdi-email</v-icon>
            lakshsolanki848@gmail.com
          </p>
        </div>
      </v-col>
      <v-col cols="12" md="3" sm="6" xs="12">
        <EmailRegisterPopup />
      </v-col>
      <v-divider color="grey-lighten-1" opacity="25" class="mt-3 mb-2"></v-divider>
      <v-col cols="12" md="12">
        <div class="text-center">
          © {{ new Date().getFullYear() }} <strong>Mindlytic</strong>. All rights reserved.
          <div>
            <router-link to="/privacy" class="text-decoration-none mr-2">Privacy Policy</router-link>
            |
            <router-link to="/terms" class="text-decoration-none mx-2">Terms of Service</router-link>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-footer>
</template>
<style scoped>
.social-icon-link {
  text-decoration: none;
  transition: transform 0.2s ease;
}

.social-icon-link:hover {
  transform: translateY(-3px);
}

.transparent {
  background-color: transparent !important;
}

.contact-info p {
  margin: 0;
}

@media (max-width: 600px) {
  .footer-logo {
    max-width: 120px;
    margin: 0 auto 1rem auto;
  }
}
</style>
