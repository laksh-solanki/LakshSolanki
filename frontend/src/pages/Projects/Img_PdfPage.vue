<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useDisplay } from "vuetify";
import Alerts from "@/components/Alerts.vue";

const images = ref([]);
const isConverting = ref(false);
const conversionProgress = ref(0);
const conversionStatus = ref("");
const imageIdCounter = ref(0);
const isDragging = ref(false);
const { xs } = useDisplay();
const fileInput = ref(null);
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const generatedPdfPath = ref("");

let jsPdfCtorPromise;

const totalImages = computed(() => images.value.length);
const totalSize = computed(() => {
  const bytes = images.value.reduce((sum, item) => sum + item.size, 0);
  return formatFileSize(bytes);
});
const allImagesOrientation = computed(() => {
  if (!images.value.length) return "p";
  return images.value.every((item) => (item.orientation || "p") === "l") ? "l" : "p";
});
const layoutMode = computed(() => {
  if (!images.value.length) return "P";
  const modes = new Set(images.value.map((item) => item.orientation || "p"));
  if (modes.size > 1) return "M";
  return [...modes][0] === "p" ? "P" : "L";
});

const loadJsPdfCtor = async () => {
  if (!jsPdfCtorPromise) {
    jsPdfCtorPromise = import("jspdf").then((module) => module.jsPDF);
  }

  return jsPdfCtorPromise;
};

const goBack = () => window.history.back();
const triggerFileInput = () => fileInput.value?.click();

const showAlert = (message, type) => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    showAlert(`${files.length} file(s) added.`, "success");
    processFiles(files);
  }
};

const processFiles = (files) => {
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  if (imageFiles.length === 0) {
    showAlert("Please select valid image files.", "error");
    return;
  }

  imageFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      images.value.push({
        id: imageIdCounter.value++,
        file,
        url: e.target.result,
        name: file.name,
        size: file.size,
        type: file.type,
        rotation: 0,
        orientation: "p",
      });
    };
    reader.readAsDataURL(file);
  });

  generatedPdfPath.value = "";
};

const rotateImage = (index) => {
  images.value[index].rotation = (images.value[index].rotation + 90) % 360;
};

const removeImage = (index) => images.value.splice(index, 1);

const moveUp = (index) => {
  if (index > 0) {
    const temp = images.value[index];
    images.value.splice(index, 1);
    images.value.splice(index - 1, 0, temp);
  }
};

const moveDown = (index) => {
  if (index < images.value.length - 1) {
    const temp = images.value[index];
    images.value.splice(index, 1);
    images.value.splice(index + 1, 0, temp);
  }
};

const clearAll = () => {
  images.value = [];
  generatedPdfPath.value = "";
  if (fileInput.value) fileInput.value.value = "";
  showAlert("All images cleared.", "error");
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const addImageToPDF = (pdf, image) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (image.rotation === 90 || image.rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((image.rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = canvas.toDataURL("image/png");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      let finalW = canvas.width;
      let finalH = canvas.height;
      const scale = Math.min(availableWidth / finalW, availableHeight / finalH, 1);
      finalW *= scale;
      finalH *= scale;

      const x = (pageWidth - finalW) / 2;
      const y = (pageHeight - finalH) / 2;

      pdf.addImage(rotatedDataUrl, "PNG", x, y, finalW, finalH);
      resolve();
    };

    img.onerror = () => reject(new Error(`Failed to load ${image.name}`));
    img.src = image.url;
  });
};

const generatePdfWithOrientation = async () => {
  if (images.value.length === 0) {
    showAlert("Please add some images first.", "error");
    return;
  }

  isConverting.value = true;
  conversionProgress.value = 0;
  conversionStatus.value = "Initializing PDF document...";

  try {
    const JsPdf = await loadJsPdfCtor();
    const firstOrientation = images.value[0]?.orientation || "p";
    const pdf = new JsPdf({
      orientation: firstOrientation,
      unit: "mm",
      format: "a4",
    });

    const count = images.value.length;

    for (let i = 0; i < count; i++) {
      const image = images.value[i];
      conversionStatus.value = `Processing image ${i + 1} of ${count}`;
      conversionProgress.value = Math.round(((i + 1) / count) * 95);
      if (i > 0) {
        pdf.addPage("a4", image.orientation || "p");
      }
      await addImageToPDF(pdf, image);
    }

    conversionStatus.value = "Finalizing PDF...";
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const modes = new Set(images.value.map((item) => item.orientation || "p"));
    const orientationName =
      modes.size === 1 ? ([...modes][0] === "p" ? "portrait" : "landscape") : "mixed";
    const fileName = `images-to-pdf-${orientationName}-${timestamp}.pdf`;
    pdf.save(fileName);
    generatedPdfPath.value = getGeneratedPdfPath(fileName);

    conversionProgress.value = 100;
    showAlert("PDF generated successfully!", "success");
  } catch (error) {
    console.error("PDF generation error:", error);
    showAlert("Error generating PDF.", "error");
  } finally {
    setTimeout(() => {
      isConverting.value = false;
      conversionProgress.value = 0;
      conversionStatus.value = "";
    }, 900);
  }
};

const setImageOrientation = (index, layout) => {
  const image = images.value[index];
  if (!image) return;
  image.orientation = layout;
  showAlert(`Image ${index + 1} set to ${layout === "p" ? "Portrait" : "Landscape"}.`, "success");
};

const toggleImageOrientation = (index) => {
  const image = images.value[index];
  if (!image) return;
  setImageOrientation(index, (image.orientation || "p") === "p" ? "l" : "p");
};

const toggleAllImagesOrientation = () => {
  if (!images.value.length) return;
  const nextOrientation = allImagesOrientation.value === "p" ? "l" : "p";
  images.value.forEach((image) => {
    image.orientation = nextOrientation;
  });
  showAlert(`All images set to ${nextOrientation === "p" ? "Portrait" : "Landscape"}.`, "success");
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files);
  processFiles(files);
};

const onDragOver = (e) => e.preventDefault();
const onDrop = (e) => e.preventDefault();

onMounted(() => {
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("drop", onDrop);
});

onUnmounted(() => {
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
            <h1 class="hero-title mb-3">Image to PDF Converter</h1>
            <p class="hero-subtitle mb-0">
              Upload multiple images, reorder and rotate pages, then export a polished PDF in portrait or landscape.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="5" class="hero-stats-col mt-6 mt-md-0">
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">{{ totalImages }}</span>
                <span class="stat-label">Images Added</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ layoutMode }}</span>
                <span class="stat-label">Layout Mode</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ totalSize }}</span>
                <span class="stat-label">Total Size</span>
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
                <p class="panel-kicker mb-1">Upload Images</p>
                <h2 class="text-h5 font-weight-bold mb-1">Build your PDF pages</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">Supports JPG, PNG, GIF, and WebP formats.</p>
              </div>
            </div>

            <v-sheet :class="['upload-zone', { 'drag-over': isDragging }]" rounded="xl" border @click="triggerFileInput"
              @dragenter.prevent="isDragging = true" @dragover.prevent @dragleave.prevent="isDragging = false"
              @drop="handleDrop">
              <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect" class="file-input"
                required />

              <div class="d-flex flex-column align-center ga-4 justify-center text-center">
                <v-icon size="72" color="primary">mdi-cloud-upload-outline</v-icon>
                <div class="text-h6 font-weight-bold">Drag and drop image files</div>
                <div class="text-body-1 text-medium-emphasis">or click to browse from your device</div>
                <p class="text-caption text-medium-emphasis mb-0">Supported: JPG, PNG, GIF, WebP</p>
              </div>
            </v-sheet>

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
                  <h3 class="text-h6 font-weight-bold mb-0">Image Pages ({{ images.length }})</h3>
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <v-btn @click="toggleAllImagesOrientation"
                      :icon="allImagesOrientation === 'p' ? 'mdi-crop-portrait' : 'mdi-crop-landscape'"
                      color="primary" variant="tonal" rounded="lg" size="small"
                      :aria-label="`Switch all images to ${allImagesOrientation === 'p' ? 'landscape' : 'portrait'} orientation`"></v-btn>
                    <v-btn variant="tonal" color="error" rounded="lg" @click="clearAll" class="text-none">
                      Clear All
                    </v-btn>
                    <v-btn variant="flat" color="primary" rounded="lg" @click="generatePdfWithOrientation"
                      :disabled="isConverting || images.length === 0" class="text-none">
                      {{ isConverting ? "Converting..." : "Download PDF" }}
                    </v-btn>
                  </div>
                </div>

                <v-row>
                  <v-col v-for="(image, index) in images" :key="image.id" cols="12" sm="6" md="6" lg="4">
                    <v-card class="image-card" rounded="lg" elevation="0">
                      <v-card-actions class="d-flex justify-end ga-1 pa-2">
                        <v-btn @click="toggleImageOrientation(index)"
                          :icon="(image.orientation || 'p') === 'p' ? 'mdi-crop-portrait' : 'mdi-crop-landscape'"
                          color="primary" variant="tonal" size="small"
                          :aria-label="`Switch image ${index + 1} to ${(image.orientation || 'p') === 'p' ? 'landscape' : 'portrait'} orientation`"></v-btn>
                        <v-btn @click="rotateImage(index)" icon="mdi-rotate-right" size="small" variant="tonal"
                          color="warning"></v-btn>
                        <v-btn @click="moveUp(index)" :disabled="index === 0"
                          :icon="xs ? 'mdi-arrow-up' : 'mdi-arrow-left'" size="small" variant="tonal"
                          color="primary"></v-btn>
                        <v-btn @click="moveDown(index)" :disabled="index === images.length - 1"
                          :icon="xs ? 'mdi-arrow-down' : 'mdi-arrow-right'" size="small" variant="tonal"
                          color="primary"></v-btn>
                        <v-btn @click="removeImage(index)" icon="mdi-close" size="small" variant="tonal"
                          color="error"></v-btn>
                      </v-card-actions>

                      <div class="pa-2 d-flex justify-center overflow-hidden">
                        <v-img :src="image.url" :alt="image.name" height="210" contain class="rounded-lg" :style="{
                          transform: `rotate(${image.rotation}deg)`,
                          transition: 'transform 0.3s ease',
                        }"></v-img>
                      </div>

                      <v-card-text class="pt-1 pb-3">
                        <p class="mb-1 text-body-2 text-medium-emphasis text-truncate">{{ image.name }}</p>
                        <p class="mb-0 text-caption text-medium-emphasis">{{ formatFileSize(image.size) }}</p>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
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
  max-height: 460px;
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

.pdf-label {
  font-weight: 700;
  color: #12352f;
  font-size: 0.86rem;
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
}
</style>
