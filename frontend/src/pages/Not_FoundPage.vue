<script setup>
const quickLinks = [
  { label: "Home", to: "/", icon: "mdi-home-variant-outline" },
  { label: "Projects", to: "/projects", icon: "mdi-briefcase-variant-outline" },
  { label: "About", to: "/about", icon: "mdi-account-outline" },
];

const popularDestinations = [
  {
    label: "Certificate Generator",
    description: "Generate polished certificates in seconds.",
    to: "/projects/certificate-gen",
    icon: "mdi-certificate-outline",
  },
  {
    label: "Mindlytic AI",
    description: "Explore the AI assistant workspace.",
    to: "/projects/mindly_ai",
    icon: "mdi-robot-outline",
  },
  {
    label: "JSON Forge Studio",
    description: "Edit and transform JSON visually.",
    to: "/projects/json-forge",
    icon: "mdi-code-json",
  },
];

const currentYear = new Date().getFullYear();

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.assign("/");
};
</script>

<template>
  <v-container class="notfound-shell py-8 py-md-14">
    <section class="section-shell premium-404 pa-5 pa-md-9">
      <span class="ambient-orb orb-a" aria-hidden="true"></span>
      <span class="ambient-orb orb-b" aria-hidden="true"></span>

      <v-row align="center" class="ga-0">
        <v-col cols="12" md="7" class="pr-md-8">
          <v-chip color="secondary" variant="flat" class="font-weight-bold mb-4">
            Error 404
          </v-chip>

          <p class="display-code mb-2">404</p>

          <h1 class="text-h3 text-md-h2 mb-4 premium-title">
            The page you requested is missing.
          </h1>

          <p class="text-body-1 muted-copy mb-7 premium-subtitle">
            The link may be outdated or the page may have moved. Use one of the
            shortcuts below to continue exploring Mindlytic.
          </p>

          <div class="d-flex flex-wrap ga-3 mb-5">
            <v-btn
              color="primary"
              size="large"
              rounded="xl"
              class="text-none px-6"
              prepend-icon="mdi-arrow-left"
              @click="goBack"
            >
              Go Back
            </v-btn>
            <v-btn
              variant="outlined"
              color="primary"
              size="large"
              rounded="xl"
              class="text-none px-6"
              to="/"
              prepend-icon="mdi-home-variant-outline"
            >
              Go Home
            </v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="link in quickLinks"
              :key="link.label"
              :to="link.to"
              color="primary"
              variant="tonal"
              class="text-none"
              :prepend-icon="link.icon"
            >
              {{ link.label }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" md="5" class="mt-8 mt-md-0">
          <v-card class="fallback-card pa-5 pa-md-6" flat>
            <h2 class="text-h5 mb-2">Popular Destinations</h2>
            <p class="muted-copy mb-4">
              Resume from these frequently visited sections.
            </p>

            <v-list bg-color="transparent" class="pa-0 destination-list">
              <v-list-item
                v-for="item in popularDestinations"
                :key="item.label"
                :to="item.to"
                rounded="lg"
                class="mb-2 destination-item"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="38" class="mr-3">
                    <v-icon :icon="item.icon"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">
                  {{ item.label }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ item.description }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-divider class="my-4"></v-divider>
            <p class="caption muted-copy mb-0">
              Mindlytic {{ currentYear }} - crafted with Vue and Vuetify.
            </p>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </v-container>
</template>

<style scoped>
.notfound-shell {
  max-width: 1220px;
}

.premium-404 {
  position: relative;
  overflow: hidden;
  animation: fade-slide-in 0.45s ease;
}

.display-code {
  margin: 0;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  font-size: clamp(4.6rem, 15vw, 10rem);
  font-weight: 800;
  line-height: 0.86;
  letter-spacing: -0.06em;
  background: linear-gradient(140deg, #0d5b51 0%, #2da894 45%, #f59e0b 95%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.premium-title {
  max-width: 16ch;
  line-height: 1.1;
}

.premium-subtitle {
  max-width: 58ch;
}

.ambient-orb {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(1px);
}

.orb-a {
  top: clamp(-90px, -11vw, -48px);
  right: clamp(-70px, -8vw, -28px);
  width: clamp(170px, 26vw, 270px);
  height: clamp(170px, 26vw, 270px);
  background: radial-gradient(circle, rgba(19, 111, 99, 0.28) 0%, rgba(19, 111, 99, 0) 72%);
}

.orb-b {
  bottom: clamp(-120px, -14vw, -52px);
  left: clamp(-120px, -14vw, -56px);
  width: clamp(190px, 30vw, 300px);
  height: clamp(190px, 30vw, 300px);
  background: radial-gradient(circle, rgba(245, 158, 11, 0.24) 0%, rgba(245, 158, 11, 0) 72%);
}

.fallback-card {
  border-radius: 24px;
  background: linear-gradient(160deg, #ffffff, #ecf7f2);
  border: 1px solid rgba(19, 111, 99, 0.22);
  box-shadow: 0 16px 34px rgba(13, 27, 24, 0.1);
}

.destination-list :deep(.v-list-item__content) {
  padding-right: 4px;
}

.destination-item {
  border: 1px solid rgba(19, 111, 99, 0.1);
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.destination-item:hover {
  transform: translateX(3px);
  border-color: rgba(19, 111, 99, 0.35);
  background-color: rgba(19, 111, 99, 0.05);
}

@keyframes fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .premium-title,
  .premium-subtitle {
    max-width: none;
  }

  .display-code {
    font-size: clamp(4.2rem, 24vw, 7rem);
  }
}

@media (max-width: 600px) {
  .orb-b {
    display: none;
  }
}
</style>
