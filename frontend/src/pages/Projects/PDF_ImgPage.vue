<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
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

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl"
            class="text-none">
            Back
          </v-btn>
          <div class="hero-chip">Project Tool</div>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" lg="7" class="pr-md-8">
            <h1 class="hero-title mb-3">PDF to Image Converter</h1>
            <p class="hero-subtitle mb-0">
              Upload one PDF and extract every page as a high-quality image. Download individual pages or all as ZIP.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="5" class="mt-6 mt-md-0">
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">{{ hasPdf ? "1" : "0" }}</span>
                <span class="stat-label">PDF Selected</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ convertedCount }}</span>
                <span class="stat-label">Images Ready</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">ZIP</span>
                <span class="stat-label">Bulk Download</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row dense align="start">
        <v-col cols="12" :lg="images.length > 0 ? 4 : 12">
          <v-card class="tool-shell pa-5 pa-md-7" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
              <div>
                <p class="panel-kicker mb-1">Upload PDF</p>
                <h2 class="text-h5 font-weight-bold mb-1">Drop your file here</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">Supports a single PDF per conversion run.</p>
              </div>
            </div>

            <v-sheet :class="['upload-zone', { 'drag-over': isDragging }]" rounded="xl" border @click="triggerFileInput"
              @dragenter.prevent="isDragging = true" @dragover.prevent @dragleave.prevent="isDragging = false"
              @drop="handleDrop">
              <input ref="fileInput" type="file" accept="application/pdf" @change="handleFileSelect" class="file-input"
                required />

              <div class="d-flex flex-column align-center ga-4 justify-center text-center">
                <v-icon size="72" color="primary">mdi-cloud-upload-outline</v-icon>
                <div class="text-h6 font-weight-bold">Drag and drop PDF file</div>
                <div class="text-body-1 text-medium-emphasis">or click to browse from your device</div>
                <p class="text-caption text-medium-emphasis mb-0">Supported format: PDF</p>
              </div>
            </v-sheet>

            <div v-if="pdfName" class="selected-file mt-4">
              <v-icon icon="mdi-file-document" size="18" class="mr-2"></v-icon>
              {{ pdfName }}
            </div>

            <div v-if="isConverting" class="progress-shell mt-5">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">{{ conversionStatus }}</span>
                <span class="text-caption">{{ conversionProgress }}%</span>
              </div>
              <v-progress-linear :model-value="conversionProgress" color="primary" rounded
                height="8"></v-progress-linear>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <transition name="slide-up">
            <div v-if="images.length > 0">
              <v-card class="tool-shell pa-4 pa-md-5" rounded="xl" elevation="0">
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
                  <h3 class="text-h6 font-weight-bold mb-0">Converted Images ({{ images.length }})</h3>
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
                  <p class="text-caption text-medium-emphasis mb-0">
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
                    <v-card class="image-card" rounded="lg" elevation="0">
                      <v-card-actions class="d-flex justify-end ga-1 pa-2">
                        <v-btn @click="toggleImageSelection(image.id)"
                          :icon="isImageSelected(image.id) ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
                          :color="isImageSelected(image.id) ? 'success' : 'secondary'" variant="tonal"
                          size="small"></v-btn>
                        <v-btn @click="removeImage(image.id)" icon="mdi-close" variant="tonal" color="error"
                          size="small"></v-btn>
                        <v-btn @click="downloadImage(image.url, image.name)" icon="mdi-download" variant="tonal"
                          color="primary" size="small"></v-btn>
                      </v-card-actions>

                      <div class="pa-2">
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
.tool-page {
  position: relative;
  background:
    radial-gradient(circle at 10% 0%, rgba(96, 219, 198, 0.18), transparent 28%),
    radial-gradient(circle at 96% 15%, rgba(255, 199, 120, 0.2), transparent 30%);
}

.hero-shell {
  border-bottom: 1px solid rgba(19, 111, 99, 0.12);
  background: linear-gradient(152deg, rgba(246, 252, 250, 0.98), rgba(236, 246, 241, 0.92));
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.22);
  color: #136f63;
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
  color: #4d5d59;
  max-width: 58ch;
  line-height: 1.72;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid rgba(19, 111, 99, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px 10px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: #10312b;
}

.stat-label {
  display: block;
  font-size: 0.73rem;
  color: #5f716d;
}

.tool-shell {
  border: 1px solid rgba(19, 111, 99, 0.17);
  background: linear-gradient(160deg, #ffffff 0%, #f5fbf8 100%);
  box-shadow: 0 16px 30px rgba(11, 39, 34, 0.08);
}

.panel-kicker {
  color: #157568;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  font-weight: 700;
}

.upload-zone {
  border: 2px dashed rgba(19, 111, 99, 0.45) !important;
  background: rgba(19, 111, 99, 0.04);
  padding: 36px 22px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background-color 0.25s ease;
}

.upload-zone:hover {
  transform: translateY(-2px);
  border-color: rgba(19, 111, 99, 0.75) !important;
  background: rgba(19, 111, 99, 0.08);
}

.upload-zone.drag-over {
  border-style: solid !important;
  border-color: rgba(19, 111, 99, 0.95) !important;
  background: rgba(19, 111, 99, 0.12);
}

.file-input {
  display: none;
}

.selected-file {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.2);
  background: rgba(19, 111, 99, 0.08);
  font-size: 0.85rem;
  color: #16453d;
}

.progress-shell {
  border: 1px solid rgba(19, 111, 99, 0.14);
  border-radius: 12px;
  background: #f8fcfa;
  padding: 12px;
}

.image-card {
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: #ffffff;
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
  background: rgba(19, 111, 99, 0.04);
}

.side-panel {
  border: 1px solid rgba(19, 111, 99, 0.17);
  background:
    radial-gradient(circle at 90% 12%, rgba(255, 201, 131, 0.2), transparent 34%),
    linear-gradient(160deg, #ffffff 0%, #f4faf7 100%);
  box-shadow: 0 16px 30px rgba(11, 39, 34, 0.08);
}

.output-empty {
  border: 1px solid rgba(19, 111, 99, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.84);
  padding: 12px;
  color: #556865;
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
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: rgba(255, 255, 255, 0.84);
}

.output-thumb {
  border: 1px solid rgba(19, 111, 99, 0.18);
  background: rgba(19, 111, 99, 0.05);
}

.output-name {
  font-weight: 700;
  color: #12352f;
  font-size: 0.88rem;
}

.output-path {
  color: #556865;
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
  .output-item {
    grid-template-columns: 72px 1fr;
    gap: 10px;
    padding: 10px;
  }
}
</style>
