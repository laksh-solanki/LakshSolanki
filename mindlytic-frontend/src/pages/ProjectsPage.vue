<script setup>
import { ref } from 'vue'

// Data: Replace these with your actual 3 links/projects
const projects = ref([
  {
    id: 1,
    title: 'Fintech Dashboard',
    category: 'Data Visualization',
    description: 'A comprehensive financial analytics platform offering real-time data visualization and predictive modeling.',
    image: 'https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?q=80&w=2080&auto=format&fit=crop', // Abstract dark chart
    link: '#',
    tags: ['Vue', 'ApexCharts', 'Firebase']
  },
  {
    id: 2,
    title: 'E-Commerce API',
    category: 'Backend Architecture',
    description: 'Headless commerce solution designed for scalability, featuring stripe integration and inventory management.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop', // Clean workspace
    link: '#',
    tags: ['Node.js', 'GraphQL', 'Docker']
  },
  {
    id: 3,
    title: 'Health Track App',
    category: 'Mobile Application',
    description: 'Cross-platform wellness tracking application focusing on privacy-first data storage and minimal UI.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop', // Dark medical abstract
    link: '#',
    tags: ['React Native', 'TypeScript', 'Redux']
  }
])
</script>

<template>
  <v-container fluid class="page-wrapper fill-height pa-0">
    <v-container class="py-16">

      <v-row class="mb-16">
        <v-col cols="12" md="8" class="offset-md-2 text-center">
          <div class="text-overline mb-2 text-medium-emphasis tracking-wide">
            Portfolio
          </div>
          <h2 class="text-h3 font-weight-bold text-white mb-4">
            Recent Work
          </h2>
          <p class="text-body-1 text-medium-emphasis" style="max-width: 600px; margin: 0 auto;">
            A selection of projects focusing on performance, user experience, and scalable architecture.
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="project in projects" :key="project.id" cols="12" md="4">
          <v-hover v-slot="{ isHovering, props }">
            <v-card v-bind="props" class="project-card d-flex flex-column" flat rounded="lg">
              <div class="img-container">
                <v-img :src="project.image" height="260" cover class="project-img" :class="{ 'scale-up': isHovering }">
                  <div class="gradient-overlay"></div>
                </v-img>
              </div>

              <div class="card-content pa-6 flex-grow-1 d-flex flex-column">
                <div class="d-flex justify-space-between align-center mb-3">
                  <span class="text-caption text-uppercase text-medium-emphasis font-weight-bold tracking-wide">
                    {{ project.category }}
                  </span>
                </div>

                <h3 class="text-h5 font-weight-bold text-white mb-2">
                  {{ project.title }}
                </h3>

                <p class="text-body-2 text-grey mb-6">
                  {{ project.description }}
                </p>

                <div class="mt-auto pt-4 border-top d-flex align-center justify-space-between">
                  <div class="tags">
                    <span v-for="(tag, i) in project.tags" :key="i" class="text-caption text-medium-emphasis mr-3">
                      #{{ tag }}
                    </span>
                  </div>

                  <v-btn :href="project.link" icon variant="text" color="white" :class="{ 'slide-right': isHovering }">
                    <v-icon icon="mdi-arrow-right"></v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>

    </v-container>
  </v-container>
</template>

<style scoped>
/* Modern Minimalist Dark Theme
  Focus: Matte finishes, subtle borders, clean typography.
*/

.page-wrapper {
  /* Inherits your existing dark theme, or forces a clean dark slate background */
  background-color: transparent;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.tracking-wide {
  letter-spacing: 0.1em;
}

/* Card Styling */
.project-card {
  background-color: #1e1e1e;
  /* Lighter than black for surface contrast */
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
  overflow: hidden;
  height: 100%;
}

.project-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

/* Image Transitions */
.img-container {
  overflow: hidden;
  position: relative;
}

.project-img {
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.scale-up {
  transform: scale(1.05);
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.4) 100%);
}

/* Text & Details */
.text-medium-emphasis {
  color: rgba(255, 255, 255, 0.6) !important;
}

.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Button Animation */
.slide-right {
  transform: translateX(4px);
}
</style>
