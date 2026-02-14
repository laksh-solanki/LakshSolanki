<script setup>
import { ref } from "vue";
import newbanner from "@/components/newbanner.vue";

// Data for the "Trusted By" section
const clients = [
  { text: "Facebook", icon: "mdi-facebook", color: "primary" },
  { text: "Spotify", icon: "mdi-spotify", color: "success" },
  { text: "Slack", icon: "mdi-slack", color: "pink" },
  { text: "Netflix", icon: "mdi-netflix", color: "red" },
  // In a real app, these would be logo URLs
];

const features = ref([
  {
    title: "Real-time Analytics",
    text: "Monitor your data as it happens with our lightning-fast websocket connections.",
    icon: "mdi-flash-outline",
    color: "primary",
  },
  {
    title: "Secure Encryption",
    text: "Your data is encrypted at rest and in transit. Enterprise-grade security out of the box.",
    icon: "mdi-shield-check-outline",
    color: "success",
  },
  {
    title: "Global Scale",
    text: "Deploy instantly to 35+ regions worldwide without touching a single server configuration.",
    icon: "mdi-earth",
    color: "info",
  },
]);

const stats = [
  { value: "10k+", label: "Active Users" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "24/7", label: "Support" },
];
</script>

<template>
  <newbanner />
  <div class="home-wrapper bg-transparent">
    <section class="position-relative pt-md-16 pb-md-16 pt-7 pb-16">
      <v-container>
        <v-row align="center" justify="center">
          <v-col cols="12" md="8" lg="7" class="text-center">
            <v-chip color="primary" variant="flat" size="small" class="font-weight-bold text-uppercase spacing-1 mb-6">
              New Release v2.0
            </v-chip>

            <h1 class="text-h3 text-md-h2 font-weight-bold text-high-emphasis mb-6">
              Turn your data into <br class="hidden-sm-and-down" />
              <span class="text-primary">Actionable Insights</span>
            </h1>

            <p class="text-body-1 text-medium-emphasis mx-auto mb-8" style="max-width: 600px">
              Mindlytic provides the infrastructure you need to analyze,
              visualize, and optimize your business metrics in real-time.
            </p>

            <div class="d-flex align-center flex-wrap justify-center gap-4">
              <v-btn color="primary" size="x-large" elevation="2" rounded="lg" height="56"
                class="text-none font-weight-bold px-8" to="/about">
                Get Started Free
                <v-icon end icon="mdi-arrow-right" class="ml-2"></v-icon>
              </v-btn>

              <v-btn variant="outlined" size="x-large" color="primary" rounded="lg" height="56"
                class="text-none font-weight-bold bg-surface px-8" to="/projects">
                View Demo
              </v-btn>
            </div>

            <div class="d-flex hidden-sm-and-down mt-12 justify-center gap-8">
              <div v-for="stat in stats" :key="stat.label" class="text-center">
                <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
                <div class="text-caption text-medium-emphasis text-uppercase">
                  {{ stat.label }}
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section class="bg-grey-lighten-4 border-y py-10">
      <v-container>
        <v-row justify="center" align="center">
          <v-col v-for="client in clients" :key="client" cols="6" md="2"
            class="d-flex flex-column align-center justify-center gap-4 text-center">
            <v-icon class="text-h2 text-center" :icon="client.icon" :color="client.color"></v-icon>
            <span class="text-h6 font-weight-bold text-grey-darken-1">{{
              client.text
            }}</span>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section class="py-16">
      <v-container>
        <v-row justify="center" class="mb-12">
          <v-col cols="12" md="8" class="text-center">
            <h2 class="text-h4 font-weight-bold mb-4">
              Everything you need to scale
            </h2>
            <p class="text-body-1 text-medium-emphasis">
              Powerful features designed for modern development teams.
            </p>
          </v-col>
        </v-row>

        <v-row>
          <v-col v-for="(feature, i) in features" :key="i" cols="12" md="4">
            <v-card elevation="0" class="pa-6 bg-surface hover-card h-100 border text-center" rounded="xl">
              <v-avatar :color="feature.color" variant="tonal" size="56" class="mb-6 rounded-lg">
                <v-icon :icon="feature.icon" size="28"></v-icon>
              </v-avatar>

              <h3 class="text-h6 font-weight-bold mb-3">{{ feature.title }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-0" style="line-height: 1.6">
                {{ feature.text }}
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section class="py-16">
      <v-container>
        <v-card color="primary" rounded="xl" class="pa-10 pa-md-16 position-relative overflow-hidden text-center">
          <div class="bg-circle-1"></div>
          <div class="bg-circle-2"></div>

          <v-row align="center">
            <v-col cols="12" md="8">
              <h2 class="text-h4 text-md-h3 font-weight-bold mb-4">
                Ready to optimize your workflow?
              </h2>
              <p class="text-h6 text-primary-lighten-4 font-weight-regular mb-md-0 mb-8">
                Join 10,000+ developers building with Mindlytic today.
              </p>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <v-btn color="white" variant="flat" size="x-large" class="text-primary font-weight-bold text-none px-8"
                rounded="lg" to="/about">
                Get Started Now
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>
  </div>
</template>

<style scoped>
/* Utility for gap spacing */
.gap-4 {
  gap: 16px;
}

.gap-8 {
  gap: 32px;
}

.spacing-1 {
  letter-spacing: 1px;
}

/* Subtle hover effect for feature cards */
.hover-card {
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}

/* Decorative Backgrounds for CTA */
.bg-circle-1 {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.bg-circle-2 {
  position: absolute;
  bottom: -100px;
  left: 20%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}
</style>
