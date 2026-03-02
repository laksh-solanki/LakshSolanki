<template>
  <v-btn
    color="primary"
    rounded="xl"
    variant="outlined"
    class="search-trigger text-none"
    :class="{ 'search-trigger--compact': $vuetify.display.smAndDown }"
    :icon="$vuetify.display.smAndDown"
    @click="openPalette"
  >
    <v-icon icon="mdi-magnify" :start="!$vuetify.display.smAndDown"></v-icon>
    <template v-if="$vuetify.display.mdAndUp">
      <span class="search-trigger__label">Search...</span>
      <kbd class="search-trigger__kbd">Ctrl K</kbd>
    </template>
  </v-btn>

  <v-dialog
    v-model="isOpen"
    max-width="780"
    :fullscreen="$vuetify.display.xs"
    transition="dialog-bottom-transition"
  >
    <div class="palette-shell">
      <header class="palette-head">
        <v-icon icon="mdi-magnify" size="20" class="palette-head__icon"></v-icon>
        <input
          ref="searchInput"
          v-model="query"
          class="palette-input"
          type="text"
          placeholder="Search pages, tools, and topics..."
          @keydown.down.prevent="moveDown"
          @keydown.up.prevent="moveUp"
          @keydown.enter.prevent="selectResult"
        />
        <button class="palette-close" type="button" @click="closePalette">
          <span>Close</span>
          <kbd>Esc</kbd>
        </button>
      </header>

      <main class="palette-body custom-scrollbar">
        <section v-if="!normalizedQuery" class="palette-section">
          <p class="palette-label">Quick Access</p>
          <div class="quick-grid">
            <button
              v-for="quick in quickActions"
              :key="quick.id"
              class="quick-card"
              type="button"
              @click="navigateTo(quick.path)"
            >
              <v-icon :icon="quick.icon" size="18"></v-icon>
              <span>{{ quick.title }}</span>
            </button>
          </div>

          <p class="palette-label mt-3">Suggestions</p>
          <div class="suggestion-list">
            <button
              v-for="term in suggestedTerms"
              :key="term"
              class="suggestion-chip"
              type="button"
              @click="applySuggestion(term)"
            >
              # {{ term }}
            </button>
          </div>
        </section>

        <template v-else-if="flatResults.length">
          <section
            v-for="group in groupedResults"
            :key="group.category"
            class="palette-section"
          >
            <p class="palette-label">{{ group.category }}</p>
            <button
              v-for="item in group.items"
              :key="item.id"
              class="search-hit"
              type="button"
              :class="{ 'is-active': activeResult?.id === item.id }"
              @mouseenter="setActiveById(item.id)"
              @click="navigateTo(item.path)"
            >
              <span class="search-hit__icon">
                <v-icon :icon="item.icon" size="18"></v-icon>
              </span>
              <span class="search-hit__content">
                <span class="search-hit__title">{{ item.title }}</span>
                <span class="search-hit__subtitle">{{ item.description }}</span>
              </span>
              <span class="search-hit__route">{{ item.path }}</span>
            </button>
          </section>
        </template>

        <div v-else class="empty-state">
          <v-icon icon="mdi-magnify-close" size="36"></v-icon>
          <p>No results for "{{ query }}"</p>
          <small>Try: projects, pdf, certificate, ai, profile</small>
        </div>
      </main>

      <footer class="palette-foot hidden-xs">
        <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate</span>
        <span><kbd>Enter</kbd> Open</span>
        <span><kbd>Esc</kbd> Close</span>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isOpen = ref(false);
const query = ref("");
const activeIndex = ref(0);
const searchInput = ref(null);

const searchItems = [
  {
    id: "home",
    title: "Home",
    description: "Portfolio home and highlights",
    category: "Pages",
    path: "/",
    icon: "mdi-home-outline",
    keywords: ["dashboard", "landing", "portfolio"],
  },
  {
    id: "about",
    title: "About Me",
    description: "Profile, experience, and background",
    category: "Pages",
    path: "/about",
    icon: "mdi-account-outline",
    keywords: ["profile", "bio", "experience"],
  },
  {
    id: "projects",
    title: "Projects",
    description: "All shipped tools and demos",
    category: "Pages",
    path: "/projects",
    icon: "mdi-folder-outline",
    keywords: ["work", "portfolio", "apps"],
  },
  {
    id: "cert",
    title: "Certificate Generator",
    description: "Create and export branded certificates",
    category: "Tools",
    path: "/projects/certificate-gen",
    icon: "mdi-certificate-outline",
    keywords: ["certificate", "pdf", "generator"],
  },
  {
    id: "imgpdf",
    title: "Image to PDF",
    description: "Convert image batches to PDF",
    category: "Tools",
    path: "/projects/img-pdf",
    icon: "mdi-file-image-outline",
    keywords: ["jpg", "png", "converter"],
  },
  {
    id: "pdfimg",
    title: "PDF to Image",
    description: "Export pages from PDF as images",
    category: "Tools",
    path: "/projects/pdf-img",
    icon: "mdi-file-document-outline",
    keywords: ["extract", "pdf", "image"],
  },
  {
    id: "tts",
    title: "Text to Speech",
    description: "Speech synthesis utility",
    category: "Tools",
    path: "/projects/text-to-speech",
    icon: "mdi-microphone-outline",
    keywords: ["voice", "audio", "speech"],
  },
  {
    id: "ai",
    title: "Mindlytic AI",
    description: "Prompt-driven AI assistant interface",
    category: "Tools",
    path: "/projects/mindly_ai",
    icon: "mdi-robot-outline",
    keywords: ["ai", "assistant", "chat"],
  },
  {
    id: "json",
    title: "JSON Forge Studio",
    description: "Validate, format, compare JSON",
    category: "Tools",
    path: "/projects/json-forge",
    icon: "mdi-code-json",
    keywords: ["json", "formatter", "diff"],
  },
  {
    id: "compiler",
    title: "Web Lab Compiler",
    description: "HTML CSS JS compiler playground",
    category: "Tools",
    path: "/projects/web-lab-compiler",
    icon: "mdi-language-html5",
    keywords: ["compiler", "sandbox", "frontend"],
  },
  {
    id: "hub",
    title: "Dev Utility Hub",
    description: "Encoding, UUID, password and text tools",
    category: "Tools",
    path: "/projects/dev-utility-hub",
    icon: "mdi-tools",
    keywords: ["developer", "utility", "generator"],
  },
];

const suggestedTerms = ["projects", "pdf", "certificate", "ai", "profile"];

const quickActions = searchItems.filter((item) => item.category === "Pages");

const normalizedQuery = computed(() => query.value.trim().toLowerCase());

const tokenize = (value) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

const scoreItem = (item, normalized) => {
  if (!normalized) return 0;

  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const category = item.category.toLowerCase();
  const path = item.path.toLowerCase();
  const keywordText = item.keywords.join(" ").toLowerCase();
  const searchable = `${title} ${description} ${category} ${path} ${keywordText}`;

  if (!searchable.includes(normalized)) {
    const queryTokens = tokenize(normalized);
    if (!queryTokens.every((token) => searchable.includes(token))) {
      return 0;
    }
  }

  let score = 0;

  if (title === normalized) score += 150;
  if (title.startsWith(normalized)) score += 120;
  if (title.includes(normalized)) score += 70;
  if (keywordText.includes(normalized)) score += 55;
  if (description.includes(normalized)) score += 35;
  if (category.includes(normalized)) score += 20;
  if (path.includes(normalized)) score += 15;

  const queryTokens = tokenize(normalized);
  if (queryTokens.length > 1) {
    score += queryTokens.filter((token) => searchable.includes(token)).length * 8;
  }

  return score;
};

const rankedResults = computed(() => {
  if (!normalizedQuery.value) return [];

  return searchItems
    .map((item) => ({ ...item, score: scoreItem(item, normalizedQuery.value) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 12);
});

const flatResults = computed(() => rankedResults.value);

const groupedResults = computed(() => {
  const grouped = new Map();

  flatResults.value.forEach((item) => {
    if (!grouped.has(item.category)) {
      grouped.set(item.category, []);
    }
    grouped.get(item.category).push(item);
  });

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
});

const activeResult = computed(() => flatResults.value[activeIndex.value] ?? null);

const openPalette = () => {
  isOpen.value = true;
};

const closePalette = () => {
  isOpen.value = false;
};

const navigateTo = (path) => {
  if (!path) return;
  closePalette();
  query.value = "";
  activeIndex.value = 0;
  router.push(path);
};

const applySuggestion = (term) => {
  query.value = term;
  nextTick(() => searchInput.value?.focus());
};

const setActiveById = (id) => {
  const index = flatResults.value.findIndex((result) => result.id === id);
  if (index >= 0) activeIndex.value = index;
};

const moveDown = () => {
  if (!flatResults.value.length) return;
  activeIndex.value = (activeIndex.value + 1) % flatResults.value.length;
};

const moveUp = () => {
  if (!flatResults.value.length) return;
  activeIndex.value =
    (activeIndex.value - 1 + flatResults.value.length) % flatResults.value.length;
};

const selectResult = () => {
  if (!activeResult.value) return;
  navigateTo(activeResult.value.path);
};

const onWindowKeydown = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    isOpen.value = !isOpen.value;
    return;
  }

  if (!isOpen.value) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closePalette();
  }
};

watch(isOpen, (open) => {
  if (open) {
    nextTick(() => searchInput.value?.focus());
    return;
  }

  query.value = "";
  activeIndex.value = 0;
});

watch(query, () => {
  activeIndex.value = 0;
});

watch(flatResults, () => {
  if (activeIndex.value >= flatResults.value.length) {
    activeIndex.value = 0;
  }
});

onMounted(() => {
  window.addEventListener("keydown", onWindowKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onWindowKeydown);
});
</script>

<style scoped>
.search-trigger {
  min-width: 195px;
  justify-content: space-between;
  border-color: color-mix(in srgb, var(--portfolio-primary) 34%, white 66%);
  background: color-mix(in srgb, white 80%, #ebf6f2 20%);
}

.search-trigger__label {
  font-weight: 600;
  color: color-mix(in srgb, var(--portfolio-muted) 78%, black 22%);
}

.search-trigger__kbd {
  font-size: 0.72rem;
  border: 1px solid color-mix(in srgb, var(--portfolio-stroke) 88%, #92b7ad 12%);
  border-radius: 8px;
  padding: 2px 7px;
  color: var(--portfolio-muted);
  background: white;
}

.search-trigger--compact {
  min-width: 44px;
}

.palette-shell {
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--portfolio-primary) 18%, white 82%);
  background: color-mix(in srgb, var(--portfolio-surface) 90%, #f0f7f3 10%);
  box-shadow: 0 26px 70px rgba(16, 35, 31, 0.22);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: min(82vh, 700px);
}

.palette-head {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--portfolio-stroke) 80%, white 20%);
  padding: 14px 18px;
  background: linear-gradient(165deg, #ffffff, #edf8f3);
}

.palette-head__icon {
  color: var(--portfolio-primary);
}

.palette-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--portfolio-ink);
  outline: none;
}

.palette-input::placeholder {
  color: color-mix(in srgb, var(--portfolio-muted) 70%, white 30%);
}

.palette-close {
  border: 1px solid color-mix(in srgb, var(--portfolio-stroke) 82%, #9cc2b8 18%);
  background: white;
  color: var(--portfolio-muted);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
}

.palette-close kbd {
  border: 1px solid color-mix(in srgb, var(--portfolio-stroke) 85%, #93b8ae 15%);
  border-radius: 6px;
  display: flex;
  padding: 1px 5px;
  background: #f8fbf9;
}

.palette-body {
  overflow-y: auto;
  padding: 14px 16px 12px;
}

.palette-section + .palette-section {
  margin-top: 14px;
}

.palette-label {
  margin: 0px 0 10px;
  font-size: 0.74rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--portfolio-muted) 76%, white 24%);
  font-weight: 800;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.quick-card {
  border: 1px solid color-mix(in srgb, var(--portfolio-stroke) 80%, white 20%);
  background: #ffffff;
  color: var(--portfolio-ink);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  font-weight: 600;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.quick-card:hover {
  border-color: color-mix(in srgb, var(--portfolio-primary) 56%, white 44%);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(16, 35, 31, 0.09);
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  border: 1px solid color-mix(in srgb, var(--portfolio-stroke) 78%, #9ec6ba 22%);
  background: color-mix(in srgb, #ecf7f2 78%, white 22%);
  color: #2a4c46;
  border-radius: 999px;
  padding: 6px 11px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.search-hit {
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 12px;
  padding: 10px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.search-hit + .search-hit {
  margin-top: 6px;
}

.search-hit__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--portfolio-primary) 11%, white 89%);
  color: var(--portfolio-primary);
}

.search-hit__content {
  display: grid;
  gap: 2px;
}

.search-hit__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--portfolio-ink);
}

.search-hit__subtitle {
  font-size: 0.78rem;
  color: var(--portfolio-muted);
}

.search-hit__route {
  font-size: 0.73rem;
  color: color-mix(in srgb, var(--portfolio-muted) 74%, white 26%);
  padding-left: 8px;
}

.search-hit:hover,
.search-hit.is-active {
  border-color: color-mix(in srgb, var(--portfolio-primary) 42%, white 58%);
  background: linear-gradient(
    128deg,
    rgba(19, 111, 99, 0.12),
    rgba(31, 143, 127, 0.04)
  );
}

.empty-state {
  min-height: 220px;
  border-radius: 14px;
  border: 1px dashed color-mix(in srgb, var(--portfolio-stroke) 82%, white 18%);
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 6px;
  color: var(--portfolio-muted);
  text-align: center;
}

.palette-foot {
  border-top: 1px solid color-mix(in srgb, var(--portfolio-stroke) 80%, white 20%);
  background: color-mix(in srgb, #f2f8f5 70%, white 30%);
  color: var(--portfolio-muted);
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.78rem;
  font-weight: 600;
}

.palette-foot span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

kbd {
  border: 1px solid color-mix(in srgb, var(--portfolio-stroke) 85%, #93b9af 15%);
  border-radius: 6px;
  padding: 2px 6px;
  background: white;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 7px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(19, 111, 99, 0.25);
  border-radius: 999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(19, 111, 99, 0.4);
}

@media (max-width: 600px) {
  .palette-shell {
    height: 100%;
    max-height: 100dvh;
    border-radius: 0;
  }

  .palette-head {
    gap: 8px;
    padding: 12px;
  }

  .palette-close {
    padding: 4px 7px;
  }

  .palette-close span {
    display: none;
  }

  .palette-body {
    padding: 12px 12px 10px;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .palette-close kbd {
    display: none;
  }

  .search-hit {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .search-hit__route {
    display: none;
  }
}
</style>

