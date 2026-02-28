<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Alerts from "@/components/Alerts.vue";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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

const convertedCount = computed(() => images.value.length);
const hasPdf = computed(() => Boolean(pdfFile.value));

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

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const typedarray = new Uint8Array(e.target.result);
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

  reader.readAsArrayBuffer(pdfFile.value);
};

const removeImage = (index) => {
  URL.revokeObjectURL(images.value[index].url);
  images.value.splice(index, 1);
};

const downloadImage = (url, name) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadAll = () => {
  if (!images.value.length) return;

  const zip = new JSZip();
  images.value.forEach((image) => {
    zip.file(image.name, image.blob);
  });

  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, `${pdfName.value.replace(".pdf", "")}-images.zip`);
  });
};

const clearAll = () => {
  resetImages();
  pdfFile.value = null;
  pdfName.value = "";
  if (fileInput.value) fileInput.value.value = "";
  showAlert("Cleared all data.", "error");
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
          <v-btn
            @click="goBack"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-arrow-left"
            rounded="xl"
            class="text-none"
          >
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
      <v-row class="ga-0" align="start">
        <v-col cols="12" lg="8" class="pr-lg-6 mb-8 mb-lg-0">
          <v-card class="tool-shell pa-5 pa-md-7" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
              <div>
                <p class="panel-kicker mb-1">Upload PDF</p>
                <h2 class="text-h5 font-weight-bold mb-1">Drop your file here</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">Supports a single PDF per conversion run.</p>
              </div>
              <v-icon icon="mdi-file-pdf-box" color="primary" size="34"></v-icon>
            </div>

            <v-sheet
              :class="['upload-zone', { 'drag-over': isDragging }]"
              rounded="xl"
              border
              @click="triggerFileInput"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent
              @dragleave.prevent="isDragging = false"
              @drop="handleDrop"
            >
              <input
                ref="fileInput"
                type="file"
                accept="application/pdf"
                @change="handleFileSelect"
                class="file-input"
                required
              />

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
              <v-progress-linear :model-value="conversionProgress" color="primary" rounded height="8"></v-progress-linear>
            </div>
          </v-card>

          <transition name="slide-up">
            <div v-if="images.length > 0" class="mt-6">
              <v-card class="tool-shell pa-4 pa-md-5" rounded="xl" elevation="0">
                <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
                  <h3 class="text-h6 font-weight-bold mb-0">Converted Images ({{ images.length }})</h3>
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <v-btn variant="tonal" color="error" rounded="lg" @click="clearAll" class="text-none">
                      Clear All
                    </v-btn>
                    <v-btn variant="flat" color="primary" rounded="lg" @click="downloadAll" class="text-none">
                      Download ZIP
                    </v-btn>
                  </div>
                </div>

                <v-row>
                  <v-col
                    v-for="(image, index) in images"
                    :key="image.id"
                    cols="12"
                    sm="6"
                    md="6"
                    lg="4"
                  >
                    <v-card class="image-card" rounded="lg" elevation="0">
                      <v-card-actions class="d-flex justify-end ga-1 pa-2">
                        <v-btn
                          @click="removeImage(index)"
                          icon="mdi-close"
                          variant="tonal"
                          color="error"
                          size="small"
                        ></v-btn>
                        <v-btn
                          @click="downloadImage(image.url, image.name)"
                          icon="mdi-download"
                          variant="tonal"
                          color="primary"
                          size="small"
                        ></v-btn>
                      </v-card-actions>

                      <div class="pa-2">
                        <v-img :src="image.url" :alt="image.name" height="210" contain class="rounded-lg"></v-img>
                      </div>

                      <v-card-text class="pt-1 pb-3 text-body-2 text-medium-emphasis text-truncate">
                        {{ image.name }}
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card>
            </div>
          </transition>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="side-panel pa-5" rounded="xl" elevation="0">
            <p class="panel-kicker mb-1">Quick Guide</p>
            <h3 class="text-h6 font-weight-bold mb-3">How it works</h3>

            <div class="step-list">
              <article class="step-item">
                <span class="step-index">01</span>
                <div>
                  <p class="step-title mb-1">Upload PDF</p>
                  <p class="step-copy mb-0">Select a PDF from your device or drag it into the upload box.</p>
                </div>
              </article>

              <article class="step-item">
                <span class="step-index">02</span>
                <div>
                  <p class="step-title mb-1">Auto conversion</p>
                  <p class="step-copy mb-0">Each page is converted into PNG format with high rendering quality.</p>
                </div>
              </article>

              <article class="step-item">
                <span class="step-index">03</span>
                <div>
                  <p class="step-title mb-1">Download output</p>
                  <p class="step-copy mb-0">Download pages one by one or get all images in a single ZIP file.</p>
                </div>
              </article>
            </div>
          </v-card>
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

.side-panel {
  border: 1px solid rgba(19, 111, 99, 0.17);
  background:
    radial-gradient(circle at 90% 12%, rgba(255, 201, 131, 0.2), transparent 34%),
    linear-gradient(160deg, #ffffff 0%, #f4faf7 100%);
  box-shadow: 0 16px 30px rgba(11, 39, 34, 0.08);
}

.step-list {
  display: grid;
  gap: 12px;
}

.step-item {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: rgba(255, 255, 255, 0.84);
}

.step-index {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 0.76rem;
  font-weight: 800;
  color: #157568;
  background: rgba(21, 117, 104, 0.12);
}

.step-title {
  font-weight: 700;
  color: #12352f;
}

.step-copy {
  color: #556865;
  font-size: 0.89rem;
  line-height: 1.5;
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
}
</style>
