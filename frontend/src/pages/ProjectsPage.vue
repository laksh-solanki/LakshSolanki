<script setup>
import { ref } from "vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const projects = ref([
  {
    id: 1,
    title: "Certificate Generator",
    category: "Developer Utility",
    description:
      "Form-based certificate creation with live preview and one-click PDF export for course completion workflows.",
    image: getMediaUrl("project_img/Project-1.png"),
    link: "/projects/certificate-gen",
    tags: ["Vue", "Vuetify", "HTML2PDF"],
  },
  {
    id: 2,
    title: "Image to PDF Converter",
    category: "Productivity Tool",
    description:
      "Batch image import, ordering, and conversion to downloadable PDFs with a clean browser-first UX.",
    image: getMediaUrl("project_img/Project-2.png"),
    link: "/projects/img-pdf",
    tags: ["Vue", "File Processing", "UX"],
  },
  {
    id: 3,
    title: "PDF to Image Converter",
    category: "Document Tooling",
    description:
      "Extract and export high-quality page images from PDFs with performant rendering and easy downloads.",
    image: getMediaUrl("Picture/Project-3.jpg"),
    link: "/projects/pdf-img",
    tags: ["PDF.js", "Performance", "Vue"],
  },
  {
    id: 4,
    title: "Text to Speech",
    category: "Web API Experiment",
    description:
      "Natural text-to-speech controls powered by browser speech APIs with voice, pitch, and speed tuning.",
    image: getMediaUrl("project_img/Project-4.svg"),
    link: "/projects/text-to-speech",
    tags: ["Web Speech API", "Accessibility", "UI"],
  },
  {
    id: 5,
    title: "Mindlytic AI",
    category: "AI Interface",
    description:
      "Prompt-driven chat interface with markdown rendering, code highlighting, and clipboard-ready snippets.",
    image: getMediaUrl("project_img/Project-5.png"),
    link: "/projects/mindly_ai",
    tags: ["Gemini API", "Markdown", "Prism"],
  },
  {
    id: 6,
    title: "JSON Forge Studio",
    category: "Developer Power Tool",
    description:
      "Premium JSON workspace with validation, format/minify, key sorting, deep compare, key explorer, import/export, and syntax-highlighted output.",
    image: getMediaUrl("project_img/Project-6.svg"),
    link: "/projects/json-forge",
    tags: ["JSON", "Diff Engine", "Syntax UI"],
  },
  {
    id: 7,
    title: "Web Lab Compiler",
    category: "Frontend Engineering",
    description:
      "Advanced HTML/CSS/JS compiler with live preview, runtime console telemetry, freeze-network mode, analytics scan, and time-capsule snapshots.",
    image: getMediaUrl("project_img/Project-7.svg"),
    link: "/projects/web-lab-compiler",
    tags: ["HTML/CSS/JS", "Runtime Metrics", "Snapshots"],
  },
  {
    id: 8,
    title: "Dev Utility Hub",
    category: "All-in-One Utility",
    description:
      "Unified toolbox with text case conversion, URL/Base64 encode-decode, secure password generation, and UUID creation.",
    image: getMediaUrl("project_img/Project-8.svg"),
    link: "/projects/dev-utility-hub",
    tags: ["Text Tools", "Encoding", "Generators"],
  },
  {
    id: 9,
    title: "Translate Studio",
    category: "Language Tool",
    description:
      "Minimal translator with auto language detection, quick swap, voice playback, local history, and downloadable output.",
    image: getMediaUrl("project_img/Project-9.svg"),
    link: "/projects/translate-studio",
    tags: ["Translation", "Speech", "Productivity"],
  },
  {
    id: 10,
    title: "Passport Cutter",
    category: "Image Utility",
    description:
      "Remove background, auto-fit to passport-size canvas, add border, and export print-ready PNG/JPG output.",
    image: getMediaUrl("project_img/passport-cutter.svg"),
    link: "/projects/passport-cutter",
    tags: ["remove.bg API", "Passport Photo", "Vue"],
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
