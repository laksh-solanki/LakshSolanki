<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Alerts from "@/components/Alerts.vue";
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";

const pdfFile = ref(null);
const images = ref([]);
const isConverting = ref(false);
const conversionProgress = ref(0);
const conversionStatus = ref("");
const imageIdCounter = ref(0);
const pdfName = ref("");
const isDragging = ref(false);
const fileInput = ref(null);
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const route = useRoute();
const router = useRouter();
const studioMode = inject("studioMode", null);

const switchTab = (tab) => {
  if (studioMode?.switchTab) {
    studioMode.switchTab(tab);
  } else {
    router.replace({ query: { ...route.query, mode: tab } });
  }
};
const searchQuery = ref("");
const sortMode = ref("page-asc");
const selectedImageIds = ref([]);

const convertedCount = computed(() => images.value.length);
const hasPdf = computed(() => Boolean(pdfFile.value));
const selectedCount = computed(() => selectedImageIds.value.length);
const sortOptions = [
  { title: "Page (Ascending)", value: "page-asc" },
  { title: "Page (Descending)", value: "page-desc" },
  { title: "Name (A-Z)", value: "name-asc" },
  { title: "Name (Z-A)", value: "name-desc" },
];
const filteredSortedImages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const list = images.value.filter((image) => {
    if (!query) return true;
    return image.name.toLowerCase().includes(query);
  });

  const sorted = [...list];
  sorted.sort((a, b) => {
    if (sortMode.value === "page-desc") return (b.page || 0) - (a.page || 0);
    if (sortMode.value === "name-asc") return a.name.localeCompare(b.name);
    if (sortMode.value === "name-desc") return b.name.localeCompare(a.name);
    return (a.page || 0) - (b.page || 0);
  });

  return sorted;
});
const allVisibleSelected = computed(
  () =>
    filteredSortedImages.value.length > 0 &&
    filteredSortedImages.value.every((image) => selectedImageIds.value.includes(image.id)),
);

let pdfLibPromise;
let zipToolsPromise;

const loadPdfLib = async () => {
  if (!pdfLibPromise) {
    pdfLibPromise = Promise.all([import("pdfjs-dist/build/pdf"), import("pdfjs-dist/build/pdf.worker.mjs?url")]).then(
      ([pdfjsLib, workerModule]) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
        return pdfjsLib;
      },
    );
  }

  return pdfLibPromise;
};

const loadZipTools = async () => {
  if (!zipToolsPromise) {
    zipToolsPromise = Promise.all([import("jszip"), import("file-saver")]).then(([zipModule, fileSaverModule]) => ({
      JSZip: zipModule.default,
      saveAs: fileSaverModule.saveAs || fileSaverModule.default || fileSaverModule.default?.saveAs,
    }));
  }

  return zipToolsPromise;
};

const showAlert = (message, type) => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => window.history.back();
const triggerFileInput = () => fileInput.value?.click();

const resetImages = () => {
  images.value.forEach((img) => URL.revokeObjectURL(img.url));
  images.value = [];
  selectedImageIds.value = [];
};

const processSelectedFile = (file) => {
  if (file && file.type === "application/pdf") {
    pdfFile.value = file;
    pdfName.value = file.name;
    showAlert("PDF file selected.", "success");
    processPdf();
  } else {
    showAlert("Please select a valid PDF file.", "error");
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  processSelectedFile(file);
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  processSelectedFile(file);
};

const processPdf = async () => {
  if (!pdfFile.value) return;

  isConverting.value = true;
  conversionProgress.value = 0;
  conversionStatus.value = "Loading PDF...";
  resetImages();

  try {
    const pdfjsLib = await loadPdfLib();
    const arrayBuffer = await pdfFile.value.arrayBuffer();
    const typedarray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;

    conversionStatus.value = `Found ${pdf.numPages} pages. Converting...`;

    for (let i = 1; i <= pdf.numPages; i++) {
      conversionProgress.value = Math.round(((i - 1) / pdf.numPages) * 100);
      conversionStatus.value = `Converting page ${i} of ${pdf.numPages}`;

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const url = URL.createObjectURL(blob);

      images.value.push({
        id: imageIdCounter.value++,
        url,
        blob,
        page: i,
        name: `${pdfName.value.replace(".pdf", "")}-page-${i}.png`,
      });
    }

    conversionProgress.value = 100;
    conversionStatus.value = "Conversion complete.";
    showAlert(`PDF converted to ${images.value.length} image(s).`, "success");
  } catch (error) {
    console.error("Error processing PDF:", error);
    showAlert("Error processing PDF.", "error");
  } finally {
    window.setTimeout(() => {
      isConverting.value = false;
      conversionProgress.value = 0;
      conversionStatus.value = "";
    }, 900);
  }
};

const removeImage = (id) => {
  const index = images.value.findIndex((image) => image.id === id);
  if (index < 0) return;
  URL.revokeObjectURL(images.value[index].url);
  images.value.splice(index, 1);
  selectedImageIds.value = selectedImageIds.value.filter((selectedId) => selectedId !== id);
};

const downloadImage = (url, name) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const createZipFromImages = async (imageList, zipFileName) => {
  const { JSZip, saveAs } = await loadZipTools();
  if (!saveAs) {
    showAlert("Unable to download ZIP right now.", "error");
    return;
  }

  const zip = new JSZip();
  imageList.forEach((image) => {
    zip.file(image.name, image.blob);
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, zipFileName);
};

const downloadAll = async () => {
  if (!images.value.length) return;
  await createZipFromImages(images.value, `${pdfName.value.replace(".pdf", "")}-images.zip`);
};

const downloadSelected = async () => {
  const selectedImages = images.value.filter((image) => selectedImageIds.value.includes(image.id));
  if (!selectedImages.length) {
    showAlert("Select at least one image first.", "error");
    return;
  }

  await createZipFromImages(selectedImages, `${pdfName.value.replace(".pdf", "")}-selected-images.zip`);
};

const isImageSelected = (id) => selectedImageIds.value.includes(id);

const toggleImageSelection = (id) => {
  if (isImageSelected(id)) {
    selectedImageIds.value = selectedImageIds.value.filter((selectedId) => selectedId !== id);
    return;
  }

  selectedImageIds.value = [...selectedImageIds.value, id];
};

const toggleSelectAllVisible = () => {
  const visibleIds = filteredSortedImages.value.map((image) => image.id);
  if (!visibleIds.length) return;

  if (allVisibleSelected.value) {
    selectedImageIds.value = selectedImageIds.value.filter((id) => !visibleIds.includes(id));
    return;
  }

  selectedImageIds.value = Array.from(new Set([...selectedImageIds.value, ...visibleIds]));
};

const clearSelection = () => {
  selectedImageIds.value = [];
};

const copyVisibleNames = async () => {
  const names = filteredSortedImages.value.map((image) => image.name);
  if (!names.length) {
    showAlert("No filenames available to copy.", "error");
    return;
  }

  const namesText = names.join("\n");

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(namesText);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = namesText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showAlert("Filenames copied to clipboard.", "success");
  } catch (error) {
    console.error("Copy names failed:", error);
    showAlert("Unable to copy filenames.", "error");
  }
};

const clearAll = () => {
  resetImages();
  pdfFile.value = null;
  pdfName.value = "";
  if (fileInput.value) fileInput.value.value = "";
  showAlert("Cleared all data.", "error");
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const onDragOver = (e) => e.preventDefault();
const onDrop = (e) => e.preventDefault();

onMounted(() => {
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("drop", onDrop);
});

onUnmounted(() => {
  resetImages();
  window.removeEventListener("dragover", onDragOver);
  window.removeEventListener("drop", onDrop);
});
</script>

<template>
  <div class="tool-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />
    <v-container class="py-8 py-md-12">
      <v-row density="comfortable" align="start">
        <!-- Left Sidebar: Links + Conversion Mode (clean sidebar) -->
        <v-col cols="12" md="4" lg="3">
          <v-card class="tool-shell p-5" rounded="xl" elevation="0">
            <!-- Studio Mode Navigation (List-wise in Side Bar) -->
            <div class="studio-mode-nav" :class="{ 'mb-4': images.length }">
              <div class="d-flex align-center justify-space-between mb-3">
                <p class="panel-kicker mb-0">Conversion Mode</p>
                <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                  PDF → Image
                </v-chip>
              </div>

              <div class="mode-list-container d-flex flex-column ga-2">
                <button
                  type="button"
                  class="mode-list-btn"
                  @click="switchTab('img-to-pdf')"
                >
                  <div class="mode-btn-icon">
                    <v-icon size="20">mdi-image-multiple-outline</v-icon>
                  </div>
                  <div class="mode-btn-content text-left">
                    <div class="mode-btn-title">Image to PDF</div>
                    <div class="mode-btn-subtitle">Batch images into single PDF</div>
                  </div>
                  <v-icon size="16" class="mode-btn-chevron">mdi-chevron-right</v-icon>
                </button>

                <button
                  type="button"
                  class="mode-list-btn is-active"
                  @click="switchTab('pdf-to-img')"
                >
                  <div class="mode-btn-icon">
                    <v-icon size="20">mdi-file-pdf-box</v-icon>
                  </div>
                  <div class="mode-btn-content text-left">
                    <div class="mode-btn-title">PDF to Image</div>
                    <div class="mode-btn-subtitle">Extract pages to JPG / PNG</div>
                  </div>
                  <v-icon size="16" class="mode-btn-chevron">mdi-check</v-icon>
                </button>
              </div>
            </div>

            <!-- Permanently mounted hidden input for file picking -->
            <input
              ref="fileInput"
              type="file"
              accept="application/pdf"
              @change="handleFileSelect"
              class="d-none"
            />

            <!-- Loaded Document Info (Shown once PDF is processed) -->
            <template v-if="pdfFile && images.length">
              <div class="compact-upload-bar d-flex align-center justify-space-between p-3 rounded-lg mb-3">
                <div class="d-flex align-center ga-2 min-w-0">
                  <v-icon color="primary" size="22">mdi-file-pdf-box</v-icon>
                  <div class="min-w-0">
                    <div class="text-body-2 font-weight-bold text-truncate">{{ pdfName }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ images.length }} {{ images.length === 1 ? 'page' : 'pages' }} extracted
                    </div>
                  </div>
                </div>
              </div>

              <v-btn
                block
                variant="tonal"
                color="primary"
                rounded="lg"
                prepend-icon="mdi-swap-horizontal"
                class="text-none font-weight-bold mb-3"
                @click="triggerFileInput"
              >
                Change PDF Document
              </v-btn>

              <div v-if="isConverting" class="progress-shell mt-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-body-2">{{ conversionStatus }}</span>
                  <span class="text-caption">{{ conversionProgress }}%</span>
                </div>
                <v-progress-linear :model-value="conversionProgress" color="primary" rounded height="8"></v-progress-linear>
              </div>
            </template>
          </v-card>
        </v-col>

        <!-- Right Main Workspace: Upload Container OR Extracted Images Grid -->
        <v-col cols="12" md="8" lg="9">
          <!-- Big Upload Container on the Right (Auto-hides once PDF is uploaded and converted) -->
          <v-card v-if="!images.length" class="tool-shell p-6 p-md-8" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-6">
              <div>
                <p class="panel-kicker mb-1">Select Document</p>
                <h2 class="text-h5 font-weight-bold mb-1">Drop your PDF here</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Upload any PDF document to extract each page into high-resolution JPG or PNG images.
                </p>
              </div>
            </div>

            <v-sheet
              :class="['upload-zone', 'upload-zone-lg', { 'drag-over': isDragging }]"
              rounded="xl"
              border
              @click="triggerFileInput"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent
              @dragleave.prevent="isDragging = false"
              @drop="handleDrop"
            >
              <div class="d-flex flex-column align-center ga-4 justify-center text-center py-10 py-md-16">
                <v-icon size="80" color="primary" icon="mdi-cloud-upload-outline" />
                <div class="text-h5 font-weight-bold">Drag and drop PDF file here</div>
                <div class="text-body-1 text-medium-emphasis">or click anywhere in this container to browse</div>

                <div class="d-flex align-center ga-2 mt-2">
                  <span class="feature-chip">All Pages</span>
                  <span class="feature-chip">High Resolution</span>
                  <span class="feature-chip">Instant Extraction</span>
                </div>

                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="xl"
                  prepend-icon="mdi-file-pdf-box"
                  class="text-none font-weight-bold px-6 mt-4"
                  @click.stop="triggerFileInput"
                >
                  Choose PDF File
                </v-btn>
              </div>
            </v-sheet>

            <div v-if="isConverting" class="progress-shell mt-5">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">{{ conversionStatus }}</span>
                <span class="text-caption">{{ conversionProgress }}%</span>
              </div>
              <v-progress-linear :model-value="conversionProgress" color="primary" rounded height="8"></v-progress-linear>
            </div>
          </v-card>

          <!-- Extracted Images Workspace (Auto-shown once images are extracted) -->
          <transition name="slide-up">
            <div v-if="images.length > 0">
              <v-card class="tool-shell p-4 p-md-5" rounded="xl" elevation="0">
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
                  <h3 class="text-h6 font-weight-bold my-0">Converted Images ({{ images.length }})</h3>
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <v-btn variant="flat" color="primary" rounded="lg" @click="downloadAll" class="text-none">
                      Download ZIP
                    </v-btn>
                    <v-btn variant="tonal" color="error" rounded="lg" @click="clearAll" class="text-none">
                      Clear All
                    </v-btn>
                  </div>
                </div>

                <div class="tools-grid mb-3">
                  <v-text-field v-model="searchQuery" density="comfortable" variant="outlined" rounded="lg"
                    hide-details clearable label="Search by filename" prepend-inner-icon="mdi-magnify"></v-text-field>
                  <v-select v-model="sortMode" :items="sortOptions" item-title="title" item-value="value"
                    density="comfortable" variant="outlined" rounded="lg" hide-details label="Sort"></v-select>
                </div>

                <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
                  <p class="text-caption text-medium-emphasis my-0">
                    Showing {{ filteredSortedImages.length }} of {{ images.length }} | Selected {{ selectedCount }}
                  </p>
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <v-btn variant="tonal" color="primary" rounded="lg" @click="toggleSelectAllVisible"
                      :disabled="filteredSortedImages.length === 0" class="text-none">
                      {{ allVisibleSelected ? "Unselect Visible" : "Select Visible" }}
                    </v-btn>
                    <v-btn variant="tonal" color="warning" rounded="lg" @click="clearSelection"
                      :disabled="selectedCount === 0" class="text-none">
                      Clear Selection
                    </v-btn>
                    <v-btn variant="tonal" color="info" rounded="lg" @click="downloadSelected"
                      :disabled="selectedCount === 0" class="text-none">
                      ZIP Selected ({{ selectedCount }})
                    </v-btn>
                    <v-btn variant="tonal" color="primary" rounded="lg" @click="copyVisibleNames"
                      :disabled="filteredSortedImages.length === 0" class="text-none">
                      Copy Names
                    </v-btn>
                  </div>
                </div>

                <v-row v-if="filteredSortedImages.length > 0">
                  <v-col v-for="image in filteredSortedImages" :key="image.id" cols="12" sm="6" md="6" lg="4">
                    <v-card class="image-card" rounded="xl" elevation="0">
                      <v-card-actions class="d-flex justify-end ga-1 p-2">
                        <v-btn @click="toggleImageSelection(image.id)"
                          :icon="isImageSelected(image.id) ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
                          :color="isImageSelected(image.id) ? 'success' : 'secondary'" variant="tonal"
                          size="small"></v-btn>
                        <v-btn @click="removeImage(image.id)" icon="mdi-close" variant="tonal" color="error"
                          size="small"></v-btn>
                        <v-btn @click="downloadImage(image.url, image.name)" icon="mdi-download" variant="tonal"
                          color="primary" size="small"></v-btn>
                      </v-card-actions>

                      <div class="p-2">
                        <PhotoZoomDialog :src="image.url" :alt="image.name" trigger-variant="image" image-height="210"
                          :img-cover="false" trigger-class="converted-image-trigger"
                          image-class="rounded-lg converted-image-preview" />
                      </div>

                      <v-card-text class="pt-1 pb-3">
                        <p class="mb-1 text-body-2 text-medium-emphasis text-truncate">{{ image.name }}</p>
                        <p class="mb-0 text-caption text-medium-emphasis">{{ formatFileSize(image.blob?.size) }}</p>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <div v-else class="output-empty">
                  No converted images match your current search.
                </div>
              </v-card>
            </div>
          </transition>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
/* Studio Mode Navigation (List-wise in Side Bar) */
.studio-mode-nav {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(124, 14, 68, 0.1);
}

.mode-list-container {
  width: 100%;
}

.mode-list-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px solid rgba(124, 14, 68, 0.12);
  background: #ffffff;
  color: #231219;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.mode-list-btn:hover {
  border-color: #7c0e44;
  background: #faf3f0;
  transform: translateY(-1px);
}

.mode-list-btn.is-active {
  background: linear-gradient(135deg, #7c0e44 0%, #931a56 100%);
  border-color: #7c0e44;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(124, 14, 68, 0.25);
}

.mode-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(124, 14, 68, 0.08);
  color: #7c0e44;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.mode-list-btn.is-active .mode-btn-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.mode-btn-content {
  flex-grow: 1;
  min-width: 0;
}

.mode-btn-title {
  font-family: "Space Grotesk", -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.mode-btn-subtitle {
  font-family: "Manrope", -apple-system, sans-serif;
  font-size: 11px;
  color: #7e636e;
  line-height: 1.3;
  margin-top: 2px;
}

.mode-list-btn.is-active .mode-btn-subtitle {
  color: rgba(255, 255, 255, 0.85);
}

.mode-btn-chevron {
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.mode-list-btn.is-active .mode-btn-chevron {
  opacity: 1;
  color: #ffffff;
}

/* Compact summary bar when upload container auto-hides */
.compact-upload-bar {
  background: rgba(124, 14, 68, 0.04);
  border: 1px dashed rgba(124, 14, 68, 0.2);
}

.tool-page {
  position: relative;
  background: var(--portfolio-bg);
}

.hero-shell {
  border-bottom: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(124, 14, 68, 0.3);
  color: #7C0E44;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(2rem, 3.2vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  color: var(--portfolio-ink-soft);
  max-width: 58ch;
  line-height: 1.72;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid var(--portfolio-border-color);
  border-radius: 12px;
  background: var(--portfolio-panel-highlight);
  padding: 12px 10px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--portfolio-ink);
}

.stat-label {
  display: block;
  font-size: 0.73rem;
  color: var(--portfolio-muted);
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
}

.panel-kicker {
  color: #7C0E44 !important;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  font-weight: 700;
}

.upload-zone {
  border: 3px dashed rgba(124, 14, 68, 0.35) !important;
  background: rgba(124, 14, 68, 0.08) !important;
  padding: 36px 22px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background-color 0.25s ease;
}

.upload-zone:hover {
  transform: translateY(-2px);
  border-color: #7C0E44 !important;
  background: rgba(124, 14, 68, 0.15) !important;
}

.upload-zone.drag-over {
  border-style: solid !important;
  border-color: #7C0E44 !important;
  background: rgba(124, 14, 68, 0.22);
}

.file-input {
  display: none;
}

.selected-file {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(124, 14, 68, 0.3);
  background: rgba(124, 14, 68, 0.08);
  font-size: 0.85rem;
  color: var(--portfolio-primary);
}

.progress-shell {
  border: 1px solid var(--portfolio-border-color);
  border-radius: 12px;
  background: var(--portfolio-field-bg);
  padding: 12px;
}

.image-card {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
}

.tools-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 10px;
}

.converted-image-trigger {
  display: block;
}

.converted-image-preview {
  background: rgba(255, 255, 255, 0.04);
}

.side-panel {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
}

.output-empty {
  border: 1px solid var(--portfolio-border-color);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px;
  color: var(--portfolio-muted);
  font-size: 0.9rem;
}

.output-list {
  display: grid;
  gap: 12px;
  max-height: 560px;
  overflow: auto;
  padding-right: 2px;
}

.output-item {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.02);
}

.output-thumb {
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.05);
}

.output-name {
  font-weight: 700;
  color: var(--portfolio-ink);
  font-size: 0.88rem;
}

.output-path {
  color: var(--portfolio-muted);
  font-size: 0.79rem;
  line-height: 1.45;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .upload-zone {
    padding: 28px 18px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .hero-stats-col {
    display: none !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  .output-item {
    grid-template-columns: 72px 1fr;
    gap: 10px;
    padding: 10px;
  }

  .upload-zone-lg {
    min-height: 340px;
  }
}

/* Empty Workspace Canvas */
.empty-workspace-shell {
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1.5px dashed rgba(124, 14, 68, 0.2);
}

.empty-icon-halo {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: rgba(124, 14, 68, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 20px;
  background: #faf3f0;
  border: 1px solid rgba(124, 14, 68, 0.1);
  font-family: "Space Grotesk", -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #7c0e44;
}

.sidebar-guide-note {
  background: rgba(124, 14, 68, 0.04);
  border: 1px solid rgba(124, 14, 68, 0.1);
}

.upload-zone-lg {
  min-height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
}
</style>
