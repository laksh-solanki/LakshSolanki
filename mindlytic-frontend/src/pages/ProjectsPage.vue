<script setup>
// Library Imports
import { ref } from "vue";

// Data: Replace these with your actual 3 links/projects
const projects = ref([
  {
    id: 1,
    title: "Certificate Generator",
    category: "Web Application",
    description:
      "A comprehensive financial analytics platform offering real-time data visualization and predictive modeling.",
    image: new URL("../assets/Picture/Project-1.png", import.meta.url).href,
    link: "/projects/certificate-gen",
    tags: ["Vue", "Vuetify", "pdf-lib"],
    disabled: false,
  },
  {
    id: 2,
    title: "Image To PDF Converter",
    category: "Web Application",
    description:
      "Headless commerce solution designed for scalability, featuring stripe integration and inventory management.",
    image: new URL("../assets/Picture/Project-2.png", import.meta.url).href,
    link: "/projects/img-pdf",
    tags: ["Node.js", "GraphQL", "Docker"],
  },
  {
    id: 3,
    title: "PDF To Image Converter",
    category: "Web Application",
    description:
      "Cross-platform wellness tracking application focusing on privacy-first data storage and minimal UI.",
    image: new URL("../assets/Picture/Project-3.jpg", import.meta.url).href,
    link: "/projects/pdf-img",
    tags: ["React Native", "TypeScript", "Redux"],
  },
  {
    id: 4,
    title: "Text to Speech Converter",
    category: "Web Application",
    description:
      "A simple and intuitive tool to convert text into speech with various voice options, pitch, and rate controls, using the browser's native Web Speech API.",
    image: new URL("../assets/Picture/Project-4.png", import.meta.url).href,
    link: "/projects/text-to-speech",
    tags: ["Vue", "Vuetify", "Web Speech API"],
    disabled: false,
  },
  {
    id: 5,
    title: "Gemini AI",
    category: "AI",
    description:"gemini ai",
    image: new URL("../assets/Picture/Project-5.png", import.meta.url).href,
    link: "/projects/mindlytic_Ai",
    tags: ["Vue", "Vuetify", "Web Speech API"],
    disabled: false,
  }
]);
</script>

<template>
  <v-container fluid class="page-wrapper fill-height pa-0">
    <v-container class="py-16">
      <v-row class="mb-16">
        <v-col cols="12" md="8" class="offset-md-2 text-center">
          <div class="text-overline text-medium-emphasis mb-2 tracking-wide">
            Portfolio
          </div>
          <h2 class="text-h3 font-weight-bold mb-4 text-white">Recent Work</h2>
          <p
            class="text-body-1 text-medium-emphasis"
            style="max-width: 600px; margin: 0 auto"
          >
            A selection of projects focusing on performance, user experience,
            and scalable architecture.
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="project in projects" :key="project.id" cols="12" md="4">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              class="project-card d-flex flex-column"
              :to="project.link"
              flat
              rounded="lg"
              :disabled="project.disabled"
            >
              <div class="img-container">
                <v-img
                  :src="project.image"
                  height="260"
                  content-class
                  class="project-img"
                  :class="{ 'scale-up': isHovering }"
                >
                  <div class="gradient-overlay"></div>
                </v-img>
              </div>

              <div class="card-content pa-6 d-flex flex-column grow">
                <div class="d-flex justify-space-between align-center mb-3">
                  <span
                    class="text-caption text-uppercase text-medium-emphasis font-weight-bold tracking-wide"
                  >
                    {{ project.category }}
                  </span>
                </div>

                <h3 class="text-h5 font-weight-bold mb-2 text-white">
                  {{ project.title }}
                </h3>

                <p class="text-body-2 text-grey mb-6">
                  {{ project.description }}
                </p>

                <div
                  class="border-top d-flex align-center justify-space-between mt-auto pt-4"
                >
                  <div class="tags">
                    <span
                      v-for="(tag, i) in project.tags"
                      :key="i"
                      class="text-caption text-medium-emphasis mr-3"
                    >
                      #{{ tag }}
                    </span>
                  </div>
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
  font-family:
    "Inter",
    system-ui,
    -apple-system,
    sans-serif;
}

.tracking-wide {
  letter-spacing: 0.1em;
}

/* Card Styling */
.project-card {
  background-color: #1e1e1e;
  /* Lighter than black for surface contrast */
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition:
    transform 0.4s ease,
    box-shadow 0.4s ease,
    border-color 0.4s ease;
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
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 70%,
    rgba(0, 0, 0, 0.4) 100%
  );
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
