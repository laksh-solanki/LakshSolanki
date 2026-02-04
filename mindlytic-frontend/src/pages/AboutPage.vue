<template>
  <v-container fluid class="pa-0">
    <section class="hero-section d-flex align-center justify-center text-center white--text">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8">
            <h1 class="text-h2 font-weight-bold mb-4">
              Empowering Intelligence
            </h1>
            <p class="text-h6 font-weight-light">
              Mindlytic is dedicated to bridging the gap between complex data
              and actionable insights through modern web solutions.
            </p>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-16">
      <v-row align="center">
        <v-col cols="12" md="6">
          <v-img :src="about_pho_1" cover height="400" class="rounded-lg elevation-10"></v-img>
        </v-col>
        <v-col cols="12" md="6" class="ps-md-12">
          <h2 class="text-h4 font-weight-bold mb-4">Our Mission</h2>
          <p class="text-body-1 mb-6">
            We believe that technology should be intuitive, not intrusive. Our
            team focuses on building scalable front-end architectures that
            prioritize the user experience above all else.
          </p>
          <v-list bg-color="transparent">
            <v-list-item v-for="(item, i) in missionPoints" :key="i" class="px-0">
              <template v-slot:prepend>
                <v-icon color="primary" icon="mdi-check-circle"></v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                item
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-container>

    <v-sheet color="grey-darken-3" class="py-16">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="text-h4 font-weight-bold mb-3">Why Work With Us?</h2>
          <v-divider class="mx-auto mb-6" length="60" thickness="4"></v-divider>
        </div>
        <v-row>
          <v-col v-for="card in values" :key="card.title" cols="12" sm="6" md="4">
            <v-card class="h-100 pa-4 transition-swing border border-md text-center" rounded="xl" hover elevation="2">
              <v-avatar color="primary-lighten-5" size="64" class="mb-4">
                <v-icon :icon="card.icon" color="primary" size="32"></v-icon>
              </v-avatar>
              <v-card-title class="px-0 font-weight-bold">{{
                card.title
              }}</v-card-title>
              <v-card-text class="px-0 text-body-2">
                {{ card.description }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <v-container>
        <div class="text-center mb-10">
          <h2 class="text-h4 font-weight-bold mb-3">Meet the Team</h2>
          <v-divider class="mx-auto mb-6" length="60" thickness="4"></v-divider>
        </div>
        <v-row justify="center">
          <v-col v-for="(member, index) in team" :key="index" cols="12" sm="6" md="4">
            <v-hover v-slot="{ isHovering, props }">
              <v-card v-bind="props" :elevation="isHovering ? 8 : 2"
                class="text-center pa-6 rounded-xl transition-swing border-md h-100">
                <v-avatar size="150" class="mb-4 elevation-2">
                  <v-img :src="member.image" cover alt="Team Member Photo"></v-img>
                </v-avatar>

                <h3 class="text-h5 font-weight-bold mb-1">{{ member.name }}</h3>
                <div class="text-subtitle-1 text-primary font-weight-medium mb-3">
                  {{ member.role }}
                </div>

                <v-card-text class="text-body-2 text-medium-emphasis">
                  {{ member.bio }}
                </v-card-text>

                <div class="mt-2">
                  <v-btn icon="mdi-linkedin" variant="text" color="blue-darken-2" density="comfortable"></v-btn>
                  <v-btn icon="mdi-github" variant="text" color="grey-lighten-5" density="comfortable"
                    href="https://github.com/laksh-solanki"></v-btn>
                  <v-btn icon="mdi-email" variant="text" color="red-darken-2" density="comfortable"></v-btn>
                </div>
              </v-card>
            </v-hover>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import about_pho_1 from "@/assets/Picture/about_pho_1.jpg";

const missionPoints = [
  "User-Centric Design Principles",
  "High-Performance Web Applications",
  "Scalable Vue.js Architectures",
];

const values = [
  {
    title: "Innovation",
    description:
      "Pushing the boundaries of what is possible with modern frameworks like Vite and Vuetify.",
    icon: "mdi-lightbulb-outline",
  },
  {
    title: "Precision",
    description:
      "Every pixel and line of code is crafted with purpose to ensure maximum efficiency.",
    icon: "mdi-target",
  },
  {
    title: "Collaboration",
    description:
      "Building strong relationships with our clients to turn visions into digital reality.",
    icon: "mdi-account-group-outline",
  },
];

const team = ref([
  {
    name: "Laksh Solanki",
    role: "Founder & Developer",
    image: new URL("@/assets/Picture/my-pic.jpg", import.meta.url).href,
    bio: "Specializes in full-stack development and crafting seamless user experiences.",
  },
]);
</script>

<style scoped>
.hero-section {
  min-height: 60vh;
  background: linear-gradient(135deg, #1867c0 0%, #5cbbf6 100%);
  clip-path: ellipse(120% 100% at 50% 0%);
}

.transition-swing {
  transition: transform 0.3s ease-in-out;
}

.transition-swing:hover {
  transform: translateY(-8px);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
