<template>
  <v-btn
    variant="outlined"
    class="text-center justify-center rounded-lg ma-2"
    color="grey-lighten-1"
    :width="$vuetify.display.smAndDown ? '48' : '160'"
    :icon="$vuetify.display.smAndDown"
    @click="isOpen = true"
  >
    <v-icon
      :start="!$vuetify.display.smAndDown"
      icon="mdi-magnify"
      size="large"
    ></v-icon>

    <template v-if="$vuetify.display.mdAndUp">
      <span class="text-body-1 font-weight-medium">Search</span>
      <v-spacer></v-spacer>
      <kbd class="ml-2 px-1 border rounded text-caption font-weight-bold">
        Ctrl+K
      </kbd>
    </template>
  </v-btn>

  <v-dialog
    v-model="isOpen"
    max-width="630"
    transition="fade-transition"
    :fullscreen="$vuetify.display.xs"
  >
    <div
      class="bg-[#2e2e34] border border-white rounded-lg sm:rounded-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[80vh]"
    >
      <div class="flex items-center pa-3 border-b border-white/10 ga-3">
        <v-text-field
          ref="searchInput"
          v-model="query"
          variant="solo-filled"
          hide-details
          placeholder="Search anything..."
          class="flex-1 border-0 outline-none text-white text-lg placeholder-white/20"
          rounded="lg"
          @keydown.down.prevent="moveDown"
          @keydown.up.prevent="moveUp"
          @keydown.enter="selectResult"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
        >
          <template v-slot:append-inner>
            <v-icon
              @click="isOpen = false"
              class="d-none d-sm-flex d-md-flex d-lg-flex cursor-pointer border pa-4 rounded-lg"
              size="20"
              >mdi-keyboard-esc</v-icon
            >
          </template>
        </v-text-field>
        <v-btn
          @click="isOpen = false"
          class="hover:text-white d-flex d-sm-none d-md-none d-lg-none"
          icon="mdi-close"
          variant="text"
          density="compact"
        ></v-btn>
      </div>

      <div
        class="flex-1 overflow-y-auto custom-scrollbar border ma-1 pa-2 min-h-75"
      >
        <div v-if="query === ''" class="p-4">
          <h3
            class="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 ml-3 mt-2"
          >
            Recent
            <v-icon>mdi-history</v-icon>
          </h3>
          <div class="flex flex-wrap items-start gap-2 pa-1">
            <button
              v-for="tag in suggestions"
              :key="tag"
              @click="query = tag"
              class="px-2 py-1 bg-white rounded-full text-xs text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              # {{ tag }}
            </button>
          </div>
        </div>

        <div v-else-if="filteredResults.length > 0">
          <div
            v-for="(item, index) in filteredResults"
            :key="item.id"
            :class="[
              'flex items-center ga-4 pa-3 rounded-lg cursor-pointer transition-all',
              activeIndex === index
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'hover:bg-white/5 text-white/70',
            ]"
            @mouseenter="activeIndex = index"
            @click="selectResult"
          >
            <div
              :class="[
                'p-2 rounded-lg flex items-center justify-center w-9 h-9',
                activeIndex === index ? 'bg-white/20' : 'bg-white/5',
              ]"
            >
              <v-icon :icon="item.icon" size="20" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-sm">{{ item.title }}</p>
              <p
                :class="[
                  'text-xs',
                  activeIndex === index ? 'text-indigo-100' : 'text-white/40',
                ]"
              >
                {{ item.category }}
              </p>
            </div>
            <svg
              v-if="activeIndex === index"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-20 text-white/20"
        >
          <svg
            class="w-12 h-12 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>
            No results found for "<span class="text-indigo-400">{{
              query
            }}</span
            >"
          </p>
        </div>
      </div>

      <div
        class="pa-2 border-t border-white/10 bg-black/20 d-flex items-center justify-between text-[12px] text-white/30"
      >
        <div class="hidden md:flex lg:flex items-center justify-center ga-4">
          <span><kbd class="bg-white/10 px-1 rounded">↵</kbd> Select</span>
          <span><kbd class="bg-white/10 px-1 rounded">↑↓</kbd> Navigate</span>
        </div>
        <div class="flex items-center gap-1">
          Search by
          <span class="text-white font-bold tracking-tighter">
            <mainsvgicon :size="18" :show-wordmark="false" class="pa-0" />
          </span>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
// Library Imports
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import mainsvgicon from "@/assets/mainsvgicon.vue";

// State & Refs
const isOpen = ref(false);
const query = ref("");
const activeIndex = ref(0);
const searchInput = ref(null);
const router = useRouter();
const suggestions = ref([
  "Project",
  "Dashboard",
  "pdf to image",
  "Profile",
  "image to pdf",
  "Certificate Generator",
]);

const items = ref([
  {
    id: 1,
    title: "Dashboard Overview",
    path: "/",
    category: "Navigation",
    icon: "mdi-view-dashboard-outline",
  },
  {
    id: 2,
    title: "Serverless Analytics Setup",
    path: "/docs/serverless",
    category: "Documentation",
    icon: "mdi-server-network",
  },
  {
    id: 3,
    title: "image to pdf converter",
    path: "/projects/img-pdf",
    category: "Tools",
    icon: "mdi-chart-bar",
  },
  {
    id: 4,
    title: "About Mindlytic",
    path: "/about",
    category: "Navigation",
    icon: "mdi-information-outline",
  },
  {
    id: 5,
    title: "User Profile & Settings",
    path: "/about",
    category: "Account",
    icon: "mdi-account-cog-outline",
  },
  {
    id: 6,
    title: "Pdf to Image Converter",
    path: "/projects/pdf-img",
    category: "Tools",
    icon: "mdi-file-document-outline",
  },
  {
    id: 7,
    title: "Projects",
    path: "/projects",
    category: "Navigation",
    icon: "mdi-folder-multiple-outline",
  },
  {
    id: 8,
    title: "Certificate Generator",
    path: "/projects/certificate-gen",
    category: "Tools",
    icon: "mdi-certificate-outline",
  },
  { 
    id: 9,
    title: "Mindlytic AI",
    path: "/projects/mindlytic_Ai",
    category: "Tools",
    icon: "mdi-file-document-outline",
  },
]);

// --- Core Logic ---
const filteredResults = computed(() => {
  if (!query.value) return [];
  const q = query.value.toLowerCase();
  return items.value.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.path.toLowerCase().includes(q),
  );
});

const navigateTo = (path) => {
  if (!path) return;
  isOpen.value = false;
  query.value = "";
  router.push(path);
};

const selectResult = () => {
  const selected = filteredResults.value[activeIndex.value];
  if (selected) {
    navigateTo(selected.path);
  }
};

// --- Keyboard Navigation ---
const moveDown = () => {
  if (filteredResults.value.length === 0) return;
  activeIndex.value = (activeIndex.value + 1) % filteredResults.value.length;
};
const moveUp = () => {
  if (filteredResults.value.length === 0) return;
  activeIndex.value =
    (activeIndex.value - 1 + filteredResults.value.length) %
    filteredResults.value.length;
};

// --- Lifecycle & Global Shortcuts ---
const handleKeyDown = (e) => {
  if (e.key === "Escape" && isOpen.value) {
    isOpen.value = false;
    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    isOpen.value = !isOpen.value;
  }
};

watch(isOpen, (val) => {
  if (val) {
    nextTick(() => searchInput.value?.focus());
  } else {
    query.value = ""; // Reset query on close
  }
});

watch(query, () => {
  activeIndex.value = 0;
});

onMounted(() => window.addEventListener("keydown", handleKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
