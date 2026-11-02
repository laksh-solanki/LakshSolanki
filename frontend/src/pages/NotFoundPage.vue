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
  <v-container class="notfound-shell py-12 py-md-16 animate-fade-in-up">
    <section class="minimal-404 section-shell p-8 p-md-12 text-center">
      <v-chip color="secondary" variant="tonal" class="font-weight-bold mb-6">
        Error 404
      </v-chip>

      <p class="display-code mb-2">404</p>

      <h1 class="text-h4 text-md-h3 mb-4 page-title font-weight-bold">Page not found</h1>

      <p class="text-body-1 muted-copy page-copy mb-8">
        The page you are looking for may have moved, been renamed, or is temporarily unavailable.
      </p>

      <!-- Minimal compass radar visual in burgundy/rose -->
      <div class="radar-container mb-8" aria-hidden="true">
        <div class="radar-circle radar-circle-1"></div>
        <div class="radar-circle radar-circle-2"></div>
        <div class="radar-circle radar-circle-3"></div>
        <v-icon icon="mdi-compass-outline" size="44" color="primary" class="radar-icon"></v-icon>
      </div>

      <div class="action-row d-flex flex-wrap ga-3 mb-6 justify-center">
        <v-btn color="primary" size="large" rounded="xl" class="text-none px-7 font-weight-bold" prepend-icon="mdi-arrow-left"
          elevation="0" @click="goBack">
          Go Back
        </v-btn>
        <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-7" to="/"
          prepend-icon="mdi-home-variant-outline" elevation="0">
          Go Home
        </v-btn>
      </div>

      <div class="quick-links d-flex flex-wrap justify-center ga-2">
        <v-chip v-for="link in quickLinks" :key="link.label" :to="link.to" color="primary" variant="tonal"
          class="text-none" :prepend-icon="link.icon">
          {{ link.label }}
        </v-chip>
      </div>
    </section>
  </v-container>
</template>

<style scoped>
.notfound-shell {
  max-width: 820px;
}

.minimal-404 {
  border-radius: 24px;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  background: #FFFFFF !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
}

.display-code {
  margin: 0;
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(5rem, 16vw, 8.5rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, var(--portfolio-primary, #7C0E44) 0%, var(--portfolio-secondary, #AA5E7A) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-title {
  color: var(--portfolio-ink, #231219);
}

.page-copy {
  max-width: 46ch;
  margin-inline: auto;
  color: var(--portfolio-muted, #7E636E);
}

.radar-container {
  position: relative;
  width: 110px;
  height: 110px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-circle {
  position: absolute;
  border: 1px solid rgba(124, 14, 68, 0.18);
  border-radius: 50%;
  animation: radarPulse 3s infinite ease-out;
}

.radar-circle-1 {
  width: 100%;
  height: 100%;
  animation-delay: 0s;
}

.radar-circle-2 {
  width: 70%;
  height: 70%;
  animation-delay: 1s;
}

.radar-circle-3 {
  width: 40%;
  height: 40%;
  animation-delay: 2s;
}

.radar-icon {
  position: relative;
  z-index: 2;
  color: var(--portfolio-primary, #7C0E44) !important;
}

@keyframes radarPulse {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(1.3); opacity: 0; }
}

@media (max-width: 600px) {
  .minimal-404 {
    padding: 28px 16px !important;
    border-radius: 18px;
  }

  .action-row {
    width: 100%;
    flex-direction: column;
  }

  .action-row :deep(.v-btn) {
    width: 100% !important;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .radar-circle {
    animation: none;
    opacity: 0.3;
  }
}
</style>
