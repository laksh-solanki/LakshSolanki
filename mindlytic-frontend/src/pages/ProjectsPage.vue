<script setup>
import { ref } from "vue";

const projects = ref([
  {
    id: 1,
    title: "Certificate Generator",
    category: "Developer Utility",
    description:
      "Form-based certificate creation with live preview and one-click PDF export for course completion workflows.",
    image: new URL("../assets/project_img/Project-1.png", import.meta.url).href,
    link: "/projects/certificate-gen",
    tags: ["Vue", "Vuetify", "HTML2PDF"],
  },
  {
    id: 2,
    title: "Image to PDF Converter",
    category: "Productivity Tool",
    description:
      "Batch image import, ordering, and conversion to downloadable PDFs with a clean browser-first UX.",
    image: new URL("../assets/project_img/Project-2.png", import.meta.url).href,
    link: "/projects/img-pdf",
    tags: ["Vue", "File Processing", "UX"],
  },
  {
    id: 3,
    title: "PDF to Image Converter",
    category: "Document Tooling",
    description:
      "Extract and export high-quality page images from PDFs with performant rendering and easy downloads.",
    image: new URL("../assets/Picture/Project-3.jpg", import.meta.url).href,
    link: "/projects/pdf-img",
    tags: ["PDF.js", "Performance", "Vue"],
  },
  {
    id: 4,
    title: "Text to Speech",
    category: "Web API Experiment",
    description:
      "Natural text-to-speech controls powered by browser speech APIs with voice, pitch, and speed tuning.",
    image: new URL("../assets/project_img/Project-4.svg", import.meta.url).href,
    link: "/projects/text-to-speech",
    tags: ["Web Speech API", "Accessibility", "UI"],
  },
  {
    id: 5,
    title: "Mindlytic AI",
    category: "AI Interface",
    description:
      "Prompt-driven chat interface with markdown rendering, code highlighting, and clipboard-ready snippets.",
    image: new URL("../assets/project_img/Project-5.png", import.meta.url).href,
    link: "/projects/mindly_ai",
    tags: ["Gemini API", "Markdown", "Prism"],
  },
  {
    id: 6,
    title: "JSON Forge Studio",
    category: "Developer Power Tool",
    description:
      "Premium JSON workspace with validation, format/minify, key sorting, deep compare, key explorer, import/export, and syntax-highlighted output.",
    image: new URL("../assets/project_img/Project-6.svg", import.meta.url).href,
    link: "/projects/json-forge",
    tags: ["JSON", "Diff Engine", "Syntax UI"],
  },
  {
    id: 7,
    title: "Web Lab Compiler",
    category: "Frontend Engineering",
    description:
      "Advanced HTML/CSS/JS compiler with live preview, runtime console telemetry, freeze-network mode, analytics scan, and time-capsule snapshots.",
    image: new URL("../assets/project_img/Project-7.svg", import.meta.url).href,
    link: "/projects/web-lab-compiler",
    tags: ["HTML/CSS/JS", "Runtime Metrics", "Snapshots"],
  },
  {
    id: 8,
    title: "Dev Utility Hub",
    category: "All-in-One Utility",
    description:
      "Unified toolbox with text case conversion, URL/Base64 encode-decode, secure password generation, and UUID creation.",
    image: new URL("../assets/project_img/Project-8.svg", import.meta.url).href,
    link: "/projects/dev-utility-hub",
    tags: ["Text Tools", "Encoding", "Generators"],
  },
]);

</script>

<template>
  <v-container class="py-8 py-md-12 projects-shell">
    <section class="section-shell pa-6 pa-md-8 mb-8 header-card">
      <p class="text-overline text-primary font-weight-bold mb-2">Portfolio Projects</p>
      <h1 class="text-h4 text-md-h3 mb-3">Selected developer tools and product builds</h1>
      <p class="muted-copy mb-0 intro-copy">
        Each project focuses on practical product value: performance, clean interfaces, and maintainable code.
      </p>
    </section>

    <v-row>
      <v-col v-for="project in projects" :key="project.id" cols="12" md="6" lg="4">
        <v-card class="section-shell project-card h-100" :to="project.link" flat hover rounded="lg">
          <v-img :src="project.image" height="200" cover class="project-media"></v-img>

          <div class="pa-5 d-flex flex-5 flex-column h-100">
            <p class="text-caption text-primary font-weight-bold text-uppercase mb-2">
              {{ project.category }}
            </p>
            <h2 class="text-h6 mb-2">{{ project.title }}</h2>
            <p class="muted-copy mb-1">{{ project.description }}</p>

            <div class="d-flex flex-wrap ga-2 mt-3 mb-2">
              <v-chip
                v-for="tag in project.tags"
                :key="tag"
                flat
                class="project-tag"
                :text="tag"
              >
                {{ tag }}
              </v-chip>
            </div>
            <span class="text-primary font-weight-bold">Open project -></span>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.projects-shell {
  max-width: 1240px;
}

.intro-copy {
  max-width: 70ch;
}

.header-card {
  position: relative;
}

.filter-label {
  letter-spacing: 0.08em;
}

.filter-chip,
.project-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(76, 207, 183, 0.24);
  border-radius: 999px;
  background: rgba(76, 207, 183, 0.08);
  color: var(--portfolio-primary);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.filter-chip:hover,
.project-tag:hover {
  border-color: rgba(76, 207, 183, 0.48);
  background: rgba(76, 207, 183, 0.14);
}

.filter-chip.is-active,
.project-tag.is-active {
  border-color: transparent;
  background: linear-gradient(135deg, var(--portfolio-primary), #2fb49d);
  color: #04100e;
}

.project-card {
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.project-media {
  transition: transform 0.45s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 18px 36px rgba(16, 35, 31, 0.12);
}

.project-card:hover .project-media {
  transform: scale(1.05);
}

@media (max-width: 600px) {
  .intro-copy {
    max-width: none;
  }
}
</style>
