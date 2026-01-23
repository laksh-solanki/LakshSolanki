<template>
  <v-container fluid class="pa-0">
    <section class="hero-section d-flex align-center justify-center text-center white--text">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8">
            <h1 class="text-h2 font-weight-bold mb-4">Empowering Intelligence</h1>
            <p class="text-h6 font-weight-light">
              Mindlytic is dedicated to bridging the gap between complex data and actionable insights through modern web solutions.
            </p>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-16">
      <v-row align="center">
        <v-col cols="12" md="6">
          <v-img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
            cover
            height="400"
            class="rounded-lg elevation-10"
          ></v-img>
        </v-col>
        <v-col cols="12" md="6" class="ps-md-12">
          <h2 class="text-h4 font-weight-bold mb-4">Our Mission</h2>
          <p class="text-body-1 text-secondary mb-6">
            We believe that technology should be intuitive, not intrusive. Our team focuses on building scalable front-end architectures that prioritize the user experience above all else.
          </p>
          <v-list bg-color="transparent">
            <v-list-item v-for="(item, i) in missionPoints" :key="i" class="px-0">
              <template v-slot:prepend>
                <v-icon color="primary" icon="mdi-check-circle"></v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-container>

    <v-sheet color="grey-lighten-4" class="py-16">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="text-h4 font-weight-bold">Why Work With Us?</h2>
        </div>
        <v-row>
          <v-col v-for="card in values" :key="card.title" cols="12" sm="6" md="4">
            <v-card class="h-100 pa-4 transition-swing" hover elevation="2">
              <v-avatar color="primary-lighten-5" size="64" class="mb-4">
                <v-icon :icon="card.icon" color="primary" size="32"></v-icon>
              </v-avatar>
              <v-card-title class="px-0 font-weight-bold">{{ card.title }}</v-card-title>
              <v-card-text class="px-0 text-body-2 text-secondary">
                {{ card.description }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script setup>
const missionPoints = [
  'User-Centric Design Principles',
  'High-Performance Web Applications',
  'Scalable Vue.js Architectures'
]

const values = [
  {
    title: 'Innovation',
    description: 'Pushing the boundaries of what is possible with modern frameworks like Vite and Vuetify.',
    icon: 'mdi-lightbulb-outline'
  },
  {
    title: 'Precision',
    description: 'Every pixel and line of code is crafted with purpose to ensure maximum efficiency.',
    icon: 'mdi-target'
  },
  {
    title: 'Collaboration',
    description: 'Building strong relationships with our clients to turn visions into digital reality.',
    icon: 'mdi-account-group-outline'
  }
]
</script>

<style scoped>
.hero-section {
  min-height: 60vh;
  background: linear-gradient(135deg, #1867C0 0%, #5CBBF6 100%);
  clip-path: ellipse(150% 100% at 50% 0%);
}

.transition-swing {
  transition: transform 0.3s ease-in-out;
}

.transition-swing:hover {
  transform: translateY(-8px);
}
</style>
