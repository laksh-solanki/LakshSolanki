<script setup>
const quickLinks = [
  { label: "Home", to: "/", icon: "mdi-home-variant-outline" },
  { label: "Projects", to: "/projects", icon: "mdi-briefcase-variant-outline" },
  { label: "About", to: "/about", icon: "mdi-account-outline" },
];

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.assign("/");
};
</script>

<template>
  <v-container class="notfound-shell py-10 py-md-16">
    <section class="minimal-404 section-shell pa-6 pa-md-10">
      <v-chip color="secondary" variant="flat" class="font-weight-bold mb-5">
        Error 404
      </v-chip>

      <p class="display-code mb-2">404</p>

      <h1 class="text-h4 text-md-h2 mb-4 page-title">Page not found</h1>

      <p class="text-body-1 muted-copy page-copy mb-7">
        The page may have moved or the link is no longer available.
      </p>

      <div class="action-row d-flex flex-wrap ga-3 mb-5">
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

      <div class="quick-links d-flex flex-wrap justify-center ga-2">
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
    </section>
  </v-container>
</template>

<style scoped>
.notfound-shell {
  max-width: 860px;
}

.minimal-404 {
  text-align: center;
  border-radius: 28px;
  border-color: rgba(15, 143, 124, 0.14);
  box-shadow: 0 14px 34px rgba(18, 38, 33, 0.08);
  animation: fade-slide-in 0.32s ease;
}

.display-code {
  margin: 0;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  font-size: clamp(4.4rem, 16vw, 8.4rem);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #0f7769 0%, #22a590 52%, #d18a1f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-title {
  line-height: 1.08;
}

.page-copy {
  max-width: 48ch;
  margin-inline: auto;
}

.action-row {
  justify-content: center;
}

.quick-links {
  min-height: 36px;
}

@keyframes fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .display-code {
    font-size: clamp(4rem, 24vw, 6.6rem);
  }
}
</style>
