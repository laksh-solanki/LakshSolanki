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
  <v-container class="notfound-shell py-10 py-md-16 animate-fade-in-up">
    <section v-3d-tilt class="minimal-404 section-shell p-6 p-md-10">
      <v-chip color="secondary" variant="flat" class="font-weight-bold mb-5 animate-glow-pulse">
        Error 404
      </v-chip>

      <p class="display-code mb-2">404</p>

      <h1 class="text-h4 text-md-h2 mb-4 page-title">Page not found</h1>

      <p class="text-body-1 muted-copy page-copy mb-6">
        The page may have moved or the link is no longer available.
      </p>

      <!-- Futuristic Radar Scanner Visual -->
      <div class="radar-container mb-8">
        <div class="radar-circle radar-circle-1"></div>
        <div class="radar-circle radar-circle-2"></div>
        <div class="radar-circle radar-circle-3"></div>
        <div class="radar-scanner"></div>
        <v-icon icon="mdi-map-marker-question-outline" size="48" color="primary" class="radar-icon"></v-icon>
      </div>

      <div class="action-row d-flex flex-wrap ga-3 mb-5">
        <v-btn color="primary" size="large" rounded="xl" class="text-none px-6" prepend-icon="mdi-arrow-left"
          @click="goBack">
          Go Back
        </v-btn>
        <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-6" to="/"
          prepend-icon="mdi-home-variant-outline">
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

/* Radar Scanner Animation Styles */
.radar-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-circle {
  position: absolute;
  border: 1px solid rgba(15, 143, 124, 0.2);
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

.radar-scanner {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(15, 143, 124, 0.15), transparent 60%);
  animation: radarRotate 4s linear infinite;
}

.radar-icon {
  position: relative;
  z-index: 2;
  animation: iconFloat 4s ease-in-out infinite alternate;
}

@keyframes radarPulse {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

@keyframes radarRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes iconFloat {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}
</style>
