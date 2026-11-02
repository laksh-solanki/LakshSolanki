<script setup>
import { ref, computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { getMediaUrl } from "@/utils/mediaUrl";

const route = useRoute();
const { mobile } = useDisplay();

const activeCategory = ref("All");
const searchQuery = ref("");

const categories = ["All", "Productivity", "Document & Image", "AI & Language", "Developer Tools"];

const projects = ref([
  {
    id: 13,
    title: "LifeFlow Planner",
    category: "Everyday Productivity",
    description:
      "Minimal day planner with smart task capture, voice input, local offline persistence, and built-in focus timer blocks.",
    image: getMediaUrl("project_img/Project-9.svg"),
    icon: "mdi-calendar-check-outline",
    link: "/projects/lifeflow-planner",
    tags: ["Smart Planner", "Voice", "Offline"],
  },
  {
    id: 1,
    title: "Certificate Generator",
    category: "Developer Utility",
    description:
      "Form-based certificate creation with live preview and one-click PDF export for course completion workflows.",
    image: getMediaUrl("project_img/Project-1.png"),
    icon: "mdi-certificate-outline",
    link: "/projects/certificate-gen",
    tags: ["Vue", "Vuetify", "HTML2PDF"],
  },
  {
    id: 2,
    title: "PDF & Image Studio",
    category: "Document Tooling",
    description:
      "All-in-one document workspace: convert batches of images into formatted PDFs, or extract high-resolution pages from PDF documents.",
    image: getMediaUrl("project_img/Project-2.svg"),
    icon: "mdi-file-swap-outline",
    link: "/projects/pdf-image-studio",
    tags: ["Image to PDF", "PDF to Image", "PDF.js", "jsPDF"],
  },
  {
    id: 4,
    title: "Text to Speech",
    category: "Web API Experiment",
    description:
      "Natural text-to-speech controls powered by browser speech APIs with voice, pitch, and speed tuning.",
    image: getMediaUrl("project_img/Project-4.svg"),
    icon: "mdi-account-voice",
    link: "/projects/text-to-speech",
    tags: ["Web Speech API", "Accessibility", "UI"],
  },
  {
    id: 5,
    title: "Mindlytic AI",
    category: "AI Interface",
    description:
      "Prompt-driven chat interface with markdown rendering, code highlighting, and clipboard-ready snippets.",
    image: getMediaUrl("project_img/Project-5.svg"),
    icon: "mdi-robot-outline",
    link: "/projects/mindlytic_ai",
    tags: ["Gemini API", "Markdown"],
  },
  {
    id: 6,
    title: "JSON Forge Studio",
    category: "Developer Power Tool",
    description:
      "Premium JSON workspace with validation, format/minify, key sorting, deep compare, key explorer, import/export, and syntax-highlighted output.",
    image: getMediaUrl("project_img/Project-6.svg"),
    icon: "mdi-code-json",
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
    icon: "mdi-console",
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
    icon: "mdi-toolbox-outline",
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
    icon: "mdi-translate",
    link: "/projects/translate-studio",
    tags: ["Translation", "Speech", "Productivity"],
  },
  {
    id: 10,
    title: "Passport Cutter",
    category: "Image Utility",
    description:
      "Remove background, auto-fit to passport-size canvas, add border, and export print-ready PNG/JPG output.",
    image: getMediaUrl("project_img/Project-10.svg"),
    icon: "mdi-account-box-outline",
    link: "/projects/passport-cutter",
    tags: ["remove.bg API", "Passport Photo", "Vue"],
  },
  {
    id: 12,
    title: "API Blueprint Designer",
    category: "Developer Tooling",
    description:
      "Visual API design studio with OpenAPI/Swagger generation, endpoint modeling, request/response schemas, mock server export, and collaborative documentation templates.",
    image: getMediaUrl("project_img/Project-6.svg"),
    icon: "mdi-blueprint",
    link: "/projects/api-blueprint",
    tags: ["OpenAPI", "API Design", "Documentation"],
  },
]);

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const cat = activeCategory.value;

  return projects.value.filter((p) => {
    let matchesCategory = true;
    if (cat !== "All") {
      if (cat === "Productivity") {
        matchesCategory = p.category === "Productivity Tool" || p.category === "Everyday Productivity";
      } else if (cat === "Document & Image") {
        matchesCategory = p.category === "Document Tooling" || p.category === "Image Utility";
      } else if (cat === "AI & Language") {
        matchesCategory = p.category === "AI Interface" || p.category === "Language Tool";
      } else if (cat === "Developer Tools") {
        matchesCategory =
          p.category === "Developer Power Tool" ||
          p.category === "Developer Utility" ||
          p.category === "All-in-One Utility" ||
          p.category === "Developer Tooling" ||
          p.category === "Web API Experiment";
      }
    }

    let matchesSearch = true;
    if (query) {
      matchesSearch =
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags.some((tag) => tag.toLowerCase().includes(query));
    }

    return matchesCategory && matchesSearch;
  });
});

const currentProjectTitle = computed(() => {
  const p = projects.value.find((proj) => proj.link === route.path);
  return p ? p.title : "Project Viewer";
});
</script>

<template>
  <div class="projects-page-layout w-100 min-h-100">
    <template v-if="route.name === 'Projects'">
      <v-container class="py-8 py-md-12 projects-shell animate-fade-in-up">
        <!-- Header Banner -->
        <section class="section-shell p-6 p-md-8 mb-8 header-card">
          <div>
            <p class="text-overline text-primary font-weight-bold mb-2">Portfolio Workspace</p>
            <h1 class="text-h4 text-md-h3 mb-3 font-weight-bold">Selected developer tools and product builds</h1>
            <p class="muted-copy mb-0 intro-copy">
              Each project focuses on practical product value: performance, clean interfaces, and maintainable code.
            </p>
          </div>
        </section>

        <!-- Search + Categories bar -->
        <div class="d-flex align-center justify-space-between mb-8 flex-wrap ga-4">
          <div class="d-flex align-center flex-grow-1 projects-search-wrap">
            <v-text-field
              v-model="searchQuery"
              density="comfortable"
              variant="outlined"
              rounded="xl"
              placeholder="Search projects by title, tag, or tech..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              color="primary"
              class="flex-grow-1 clean-search-field"
              clearable
            />
          </div>
          <!-- Category Chips -->
          <div class="d-flex flex-wrap ga-2 category-chips-row">
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="filter-chip"
              :class="{ 'is-active': activeCategory === cat }"
              @click="activeCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Filter Response -->
        <div v-if="searchQuery || activeCategory !== 'All'" class="mb-6 d-flex align-center flex-wrap ga-2">
          <v-chip v-if="searchQuery" color="primary" variant="tonal" size="small" prepend-icon="mdi-magnify">
            query: "{{ searchQuery }}"
          </v-chip>
          <v-chip v-if="activeCategory !== 'All'" color="secondary" variant="tonal" size="small" prepend-icon="mdi-tag-outline">
            category: {{ activeCategory }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">Found {{ filteredProjects.length }} project matches</span>
        </div>

        <!-- Visual Cards Grid -->
        <v-row>
          <v-col v-for="project in filteredProjects" :key="project.id" cols="12" md="6" lg="4" class="d-flex">
            <v-card class="section-shell project-card h-100" :to="project.link" flat hover rounded="xl">
              <div class="project-media-wrap">
                <v-img :src="project.image" cover class="project-media" alt="Project preview"></v-img>
              </div>

              <div class="p-5 d-flex flex-column project-card-body">
                <p class="text-caption text-primary font-weight-bold text-uppercase mb-1">
                  {{ project.category }}
                </p>
                <h2 class="text-h6 mb-2 font-weight-bold project-title">{{ project.title }}</h2>
                <p class="muted-copy mb-3 project-description">{{ project.description }}</p>

                <div class="d-flex flex-wrap ga-2 mt-auto mb-3 project-tag-row">
                  <span v-for="tag in project.tags" :key="tag" class="project-tag">
                    {{ tag }}
                  </span>
                </div>
                <div class="project-link-row d-flex align-center text-primary font-weight-bold">
                  <span>Open project</span>
                  <v-icon size="16" class="ml-1">mdi-arrow-right</v-icon>
                </div>
              </div>
            </v-card>
          </v-col>

          <!-- Fallback if query returns no matches -->
          <v-col v-if="filteredProjects.length === 0" cols="12" class="text-center py-12">
            <v-icon icon="mdi-magnify-minus" size="56" color="primary" class="mb-3 opacity-60"></v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">No projects match your filter query</h3>
            <p class="text-caption text-medium-emphasis mb-4">Try clearing active category parameters or keyword spellings.</p>
            <v-btn color="primary" variant="outlined" rounded="xl" @click="searchQuery = ''; activeCategory = 'All';" class="text-none font-weight-bold">Clear filters</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
    <template v-else>
      <v-container class="py-4 py-md-6 active-project-shell animate-fade-in-up" fluid>
        <!-- Breadcrumb header -->
        <div class="breadcrumb-bar d-flex align-center py-3 px-5 mb-6 rounded-xl flex-wrap ga-2">
          <v-btn to="/projects" variant="text" color="primary" class="text-none font-weight-bold mr-1" rounded="xl" prepend-icon="mdi-arrow-left">
            Projects
          </v-btn>
          <v-divider vertical class="mx-3 opacity-20" style="height: 20px;"></v-divider>

          <!-- Dropdown menu to switch between all project tools -->
          <v-menu transition="slide-y-transition">
            <template v-slot:activator="{ props }">
              <v-btn
                color="primary"
                variant="flat"
                rounded="xl"
                class="text-none font-weight-bold"
                v-bind="props"
                append-icon="mdi-chevron-down"
              >
                {{ currentProjectTitle }}
              </v-btn>
            </template>
            <v-list class="bg-surface border mt-2" rounded="lg" style="max-height: 400px; overflow-y: auto;">
              <v-list-item
                v-for="proj in projects"
                :key="proj.id"
                :to="proj.link"
                color="primary"
                :active="route.path === proj.link"
              >
                <template v-slot:prepend>
                  <v-icon :icon="proj.icon" class="mr-2" size="20"></v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">{{ proj.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-divider vertical class="mx-3 opacity-20 d-none d-md-inline" style="height: 20px;"></v-divider>

          <!-- Quick switch chips for related utilities -->
          <div class="d-none d-md-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis mr-1">Quick Switch:</span>
            <v-btn
              v-for="quickProj in projects.filter(p => ['PDF & Image Studio', 'Certificate Generator'].includes(p.title))"
              :key="quickProj.id"
              :to="quickProj.link"
              size="small"
              variant="tonal"
              rounded="pill"
              class="text-none font-weight-bold"
              :color="route.path === quickProj.link ? 'primary' : 'secondary'"
            >
              {{ quickProj.title.replace(' Converter', '') }}
            </v-btn>
          </div>
        </div>
        <RouterView />
      </v-container>
    </template>
  </div>
</template>

<style scoped>
.projects-shell {
  max-width: min(var(--page-max-width), 100%) !important;
}

.active-project-shell {
  max-width: 100% !important;
  width: 100% !important;
  padding-left: clamp(12px, 1.8vw, 24px) !important;
  padding-right: clamp(12px, 1.8vw, 24px) !important;
}

.header-card {
  background: #FFFFFF !important;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
}

.intro-copy {
  max-width: 70ch;
  color: var(--portfolio-muted, #7E636E);
  line-height: 1.65;
}

.clean-search-field :deep(.v-field) {
  background: #FFFFFF !important;
  border-color: rgba(124, 14, 68, 0.14) !important;
  box-shadow: 0 2px 8px rgba(124, 14, 68, 0.04);
}

.filter-chip {
  border: 1px solid rgba(124, 14, 68, 0.14);
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--portfolio-ink-soft, #4E3842);
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: var(--portfolio-primary, #7C0E44);
  background: rgba(124, 14, 68, 0.05);
  color: var(--portfolio-primary, #7C0E44);
}

.filter-chip.is-active {
  border-color: transparent;
  background: var(--portfolio-primary, #7C0E44);
  color: #FFFFFF;
  box-shadow: 0 2px 10px rgba(124, 14, 68, 0.2);
}

.project-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
  background: #FFFFFF !important;
  border: 1px solid rgba(124, 14, 68, 0.12) !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  border-color: rgba(124, 14, 68, 0.28) !important;
  box-shadow: 0 12px 30px rgba(124, 14, 68, 0.09) !important;
}

.projects-search-wrap {
  width: 100%;
  max-width: 440px;
  min-width: 260px;
}

.project-media-wrap {
  overflow: hidden;
  background: var(--portfolio-surface-soft, #FAF3F0);
  border-bottom: 1px solid rgba(124, 14, 68, 0.08);
}

.project-media {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.project-card:hover .project-media {
  transform: scale(1.04);
}

.project-card-body {
  min-height: 240px;
  flex: 1 1 auto;
}

.project-title {
  color: var(--portfolio-ink, #231219);
}

.project-description {
  flex: 1 1 auto;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--portfolio-muted, #7E636E);
  line-height: 1.6;
}

.project-tag-row {
  min-height: 30px;
}

.project-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  background: rgba(170, 94, 122, 0.08);
  border: 1px solid rgba(170, 94, 122, 0.18);
  color: var(--portfolio-primary, #7C0E44);
}

.project-link-row {
  margin-top: auto;
  font-size: 0.88rem;
  letter-spacing: 0.01em;
}

.breadcrumb-bar {
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.12);
  box-shadow: 0 2px 10px rgba(124, 14, 68, 0.04);
}

@media (max-width: 600px) {
  .intro-copy {
    max-width: none;
  }

  .projects-search-wrap {
    max-width: 100%;
    min-width: 0;
  }

  .filter-chip {
    padding: 6px 14px;
    font-size: 0.8rem;
  }

  .breadcrumb-bar {
    padding: 10px 14px !important;
  }

  .breadcrumb-bar .v-divider {
    display: none !important;
  }

  .project-card-body {
    min-height: 0;
  }
}
</style>
