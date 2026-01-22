<script setup>
import { ref } from "vue";

const currentYear = new Date().getFullYear();

// Data-driven links for easy maintenance
const socialLinks = ref([
  { icon: "mdi-facebook", url: "#" },
  { icon: "mdi-twitter", url: "#" },
  { icon: "mdi-linkedin", url: "#" },
  { icon: "mdi-instagram", url: "#" },
]);

const footerLinks = ref([
  {
    title: "Product",
    items: ["Features", "Pricing", "Integrations", "Updates"],
  },
  {
    title: "Company",
    items: ["About Us", "Careers", "Press", "Contact"],
  },
  {
    title: "Resources",
    items: ["Documentation", "API Reference", "Community", "Blog"],
  },
  {
    title: "Legal",
    items: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  },
]);

const newsletterEmail = ref("");
const loading = ref(false);

const subscribe = () => {
  loading.value = true;
  // Simulate API call
  setTimeout(() => {
    loading.value = false;
    newsletterEmail.value = "";
    alert("Subscribed successfully!");
  }, 1000);
};
</script>

<template>
  <v-footer class="pt-16 pb-8" elevation="0" border>
    <v-container>
      <v-row>
        <v-col cols="12" md="4" lg="3">
          <div class="d-flex align-center mb-4">
            <v-icon
              icon="mdi-cube-outline"
              size="large"
              color="primary"
              class="mr-2"
            ></v-icon>
            <span class="text-h5 font-weight-bold">BrandName</span>
          </div>
          <p
            class="text-body-2 text-medium-emphasis mb-6"
            style="max-width: 300px"
          >
            Building the next generation of digital experiences. Join our
            newsletter for the latest updates.
          </p>

          <v-form @submit.prevent="subscribe">
            <v-text-field
              v-model="newsletterEmail"
              density="compact"
              placeholder="Enter your email"
              variant="outlined"
              bg-color="surface"
              hide-details
              rounded="lg"
            >
              <template v-slot:append-inner>
                <v-btn
                  color="primary"
                  size="small"
                  variant="flat"
                  class="text-none"
                  :loading="loading"
                  @click="subscribe"
                >
                  Subscribe
                </v-btn>
              </template>
            </v-text-field>
          </v-form>
        </v-col>

        <v-col cols="12" md="1" lg="2"></v-col>

        <v-col
          v-for="group in footerLinks"
          :key="group.title"
          cols="6"
          sm="3"
          md="2"
          lg="auto"
          class="mb-6"
        >
          <div class="text-subtitle-2 font-weight-bold mb-4">
            {{ group.title }}
          </div>
          <div class="d-flex flex-column gap-2">
            <a
              v-for="item in group.items"
              :key="item"
              href="#"
              class="text-body-2 text-medium-emphasis text-decoration-none hover-link mb-2"
            >
              {{ item }}
            </a>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-8"></v-divider>

      <v-row align="center" justify="space-between">
        <v-col cols="12" sm="6" class="text-center text-sm-left">
          <div class="text-caption text-medium-emphasis">
            &copy; {{ currentYear }} BrandName Inc. All rights reserved.
          </div>
        </v-col>

        <v-col cols="12" sm="6" class="text-center text-sm-right">
          <v-btn
            v-for="social in socialLinks"
            :key="social.icon"
            :icon="social.icon"
            variant="text"
            density="comfortable"
            color="medium-emphasis"
            class="mx-1"
          ></v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<style scoped>
/* Custom hover effect for links */
.hover-link {
  transition: color 0.2s ease-in-out;
}
.hover-link:hover {
  color: rgb(var(--v-theme-primary)) !important;
  text-decoration: underline !important;
}
</style>
