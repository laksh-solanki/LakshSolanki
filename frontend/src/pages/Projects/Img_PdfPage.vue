<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Alerts from "@/components/Alerts.vue";
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";

const PAGE_PRESETS = [
  {
    title: "A4 document",
    value: "a4",
    format: "a4",
    dimensions: "210 x 297 mm",
  },
  {
    title: "US Letter",
    value: "letter",
    format: "letter",
    dimensions: "216 x 279 mm",
  },
  {
    title: "Legal contract",
    value: "legal",
    format: "legal",
    dimensions: "216 x 356 mm",
  },
  {
    title: "A3 presentation",
    value: "a3",
    format: "a3",
    dimensions: "297 x 420 mm",
  },
  {
    title: "Square portfolio",
    value: "square",
    format: [210, 210],
    dimensions: "210 x 210 mm",
  },
];

const FIT_OPTIONS = [
  { title: "Fit inside page", value: "contain" },
  { title: "Fill page crop", value: "cover" },
  { title: "Stretch to page", value: "stretch" },
];

const IMAGE_FIT_OPTIONS = [
  { title: "Use global fit", value: "auto" },
  ...FIT_OPTIONS,
];

const OUTPUT_FORMATS = [
  { title: "Premium JPEG", value: "JPEG" },
  { title: "Lossless PNG", value: "PNG" },
];

const BACKGROUND_SWATCHES = [
  { title: "Gallery white", value: "#ffffff" },
  { title: "Warm ivory", value: "#f7f3ea" },
  { title: "Graphite matte", value: "#111827" },
  { title: "Ink black", value: "#05070b" },
];

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
const generatedPdfUrl = ref("");
const generatedPdfName = ref("");
const previewImage = ref(null);

const pdfSettings = reactive({
  pagePreset: "a4",
  marginMm: 8,
  fitMode: "contain",
  backgroundColor: "#ffffff",
  outputFormat: "JPEG",
  imageQuality: 0.92,
  upscaleImages: true,
  fileName: "",
  title: "Image PDF Collection",
  author: "LakshSolanki Studio",
});

let jsPdfCtorPromise;

const selectedPagePreset = computed(
  () =>
    PAGE_PRESETS.find((preset) => preset.value === pdfSettings.pagePreset) ||
    PAGE_PRESETS[0],
);

const selectedBackground = computed(
  () =>
    BACKGROUND_SWATCHES.find(
      (swatch) => swatch.value === pdfSettings.backgroundColor,
    ) || BACKGROUND_SWATCHES[0],
);

const allImagesOrientation = computed(() => {
  if (!images.value.length) return "p";
  return images.value.every((item) => (item.orientation || "p") === "l")
    ? "l"
    : "p";
});

const layoutMode = computed(() => {
  if (!images.value.length) return "P";
  const modes = new Set(images.value.map((item) => item.orientation || "p"));
  if (modes.size > 1) return "M";
  return [...modes][0] === "p" ? "P" : "L";
});

const layoutModeLabel = computed(() => {
  if (layoutMode.value === "M") return "Mixed pages";
  return layoutMode.value === "L" ? "Landscape" : "Portrait";
});

const totalImageBytes = computed(() =>
  images.value.reduce((total, image) => total + (image.size || 0), 0),
);

const outputFormatLabel = computed(() =>
  pdfSettings.outputFormat === "JPEG"
    ? `${Math.round(pdfSettings.imageQuality * 100)}% JPEG`
    : "Lossless PNG",
);

const outputFileName = computed(() => {
  const baseName =
    sanitizePdfBaseName(pdfSettings.fileName) ||
    `images-to-pdf-${layoutModeLabel.value.toLowerCase().replace(/\s+/g, "-")}`;
  return `${baseName}.pdf`;
});

const studioStats = computed(() => [
  { label: "Pages", value: images.value.length || "0" },
  { label: "Layout", value: layoutModeLabel.value },
  { label: "Format", value: selectedPagePreset.value.title },
  { label: "Source", value: formatFileSize(totalImageBytes.value) },
]);

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

const sanitizePdfBaseName = (value = "") =>
  String(value)
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const getPdfFormat = () => {
  const format = selectedPagePreset.value.format;
  return Array.isArray(format) ? [...format] : format;
};

const revokeGeneratedPdf = () => {
  if (generatedPdfUrl.value) {
    URL.revokeObjectURL(generatedPdfUrl.value);
  }

  generatedPdfUrl.value = "";
  generatedPdfName.value = "";
};

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || []);
  await processFiles(files);
  if (event.target) event.target.value = "";
};

const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.onload = (event) => {
      const url = event.target?.result;
      if (typeof url !== "string") {
        reject(new Error(`Unable to read ${file.name}`));
        return;
      }

      const preview = new Image();
      preview.onload = () => {
        resolve({
          file,
          url,
          name: file.name,
          size: file.size,
          type: file.type,
          width: preview.naturalWidth || 0,
          height: preview.naturalHeight || 0,
          rotation: 0,
          orientation: preview.naturalWidth > preview.naturalHeight ? "l" : "p",
          fitMode: "auto",
        });
      };
      preview.onerror = () => {
        resolve({
          file,
          url,
          name: file.name,
          size: file.size,
          type: file.type,
          width: 0,
          height: 0,
          rotation: 0,
          orientation: "p",
          fitMode: "auto",
        });
      };
      preview.src = url;
    };

    reader.readAsDataURL(file);
  });

const processFiles = async (files) => {
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  if (imageFiles.length === 0) {
    showAlert("Please select valid image files.", "error");
    return;
  }

  try {
    const records = await Promise.all(imageFiles.map(readImageFile));
    records.forEach((record) => {
      images.value.push({
        id: imageIdCounter.value++,
        ...record,
      });
    });

    revokeGeneratedPdf();
    const ignored = files.length - imageFiles.length;
    showAlert(
      `${imageFiles.length} image file(s) added${ignored ? `, ${ignored} ignored` : ""}.`,
      "success",
    );
  } catch (error) {
    console.error("Image import error:", error);
    showAlert("Some images could not be loaded.", "error");
  }
};

const rotateImage = (index) => {
  const image = images.value[index];
  if (!image) return;
  image.rotation = (image.rotation + 90) % 360;
  revokeGeneratedPdf();
};

const duplicateImage = (index) => {
  const image = images.value[index];
  if (!image) return;

  images.value.splice(index + 1, 0, {
    ...image,
    id: imageIdCounter.value++,
    name: `${image.name.replace(/(\.[^.]+)?$/, "")}-copy${image.name.match(/\.[^.]+$/)?.[0] || ""}`,
  });
  revokeGeneratedPdf();
  showAlert("Image duplicated.", "success");
};

const removeImage = (index) => {
  images.value.splice(index, 1);
  revokeGeneratedPdf();
};

const moveUp = (index) => {
  if (index > 0) {
    const temp = images.value[index];
    images.value.splice(index, 1);
    images.value.splice(index - 1, 0, temp);
    revokeGeneratedPdf();
  }
};

const moveDown = (index) => {
  if (index < images.value.length - 1) {
    const temp = images.value[index];
    images.value.splice(index, 1);
    images.value.splice(index + 1, 0, temp);
    revokeGeneratedPdf();
  }
};

const sortImagesByName = () => {
  images.value = [...images.value].sort((a, b) => a.name.localeCompare(b.name));
  revokeGeneratedPdf();
  showAlert("Images sorted by filename.", "success");
};

const reverseImages = () => {
  images.value = [...images.value].reverse();
  revokeGeneratedPdf();
  showAlert("Page order reversed.", "success");
};

const clearAll = () => {
  images.value = [];
  revokeGeneratedPdf();
  if (fileInput.value) fileInput.value.value = "";
  showAlert("All images cleared.", "error");
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getEffectiveFitMode = (image) =>
  image.fitMode && image.fitMode !== "auto"
    ? image.fitMode
    : pdfSettings.fitMode;

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const parsed = Number.parseInt(value, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const paintCanvasBackground = (ctx, width, height) => {
  if (pdfSettings.outputFormat !== "JPEG") return;
  ctx.fillStyle = pdfSettings.backgroundColor;
  ctx.fillRect(0, 0, width, height);
};

const getCanvasDataUrl = (canvas) => {
  if (pdfSettings.outputFormat === "PNG") {
    return canvas.toDataURL("image/png");
  }

  return canvas.toDataURL("image/jpeg", pdfSettings.imageQuality);
};

const loadImageElement = (image) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${image.name}`));
    img.src = image.url;
  });

const createRotatedCanvas = async (image) => {
  const img = await loadImageElement(image);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available.");
  }

  if (image.rotation === 90 || image.rotation === 270) {
    canvas.width = img.height;
    canvas.height = img.width;
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  paintCanvasBackground(ctx, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((image.rotation * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas;
};

const createCoverCanvas = (sourceCanvas, targetRatio) => {
  const sourceRatio = sourceCanvas.width / sourceCanvas.height;
  let sx = 0;
  let sy = 0;
  let sourceWidth = sourceCanvas.width;
  let sourceHeight = sourceCanvas.height;

  if (sourceRatio > targetRatio) {
    sourceWidth = sourceCanvas.height * targetRatio;
    sx = (sourceCanvas.width - sourceWidth) / 2;
  } else {
    sourceHeight = sourceCanvas.width / targetRatio;
    sy = (sourceCanvas.height - sourceHeight) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth));
  canvas.height = Math.max(1, Math.round(sourceHeight));
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  paintCanvasBackground(ctx, canvas.width, canvas.height);
  ctx.drawImage(
    sourceCanvas,
    sx,
    sy,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
};

const fillPdfBackground = (pdf, pageWidth, pageHeight) => {
  const color = hexToRgb(pdfSettings.backgroundColor);
  pdf.setFillColor(color.r, color.g, color.b);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
};

const addImageToPDF = async (pdf, image) => {
  const sourceCanvas = await createRotatedCanvas(image);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const safeMargin = Math.max(
    0,
    Math.min(
      Number(pdfSettings.marginMm) || 0,
      pageWidth / 2 - 1,
      pageHeight / 2 - 1,
    ),
  );
  const availableWidth = Math.max(1, pageWidth - 2 * safeMargin);
  const availableHeight = Math.max(1, pageHeight - 2 * safeMargin);
  const fitMode = getEffectiveFitMode(image);
  const imageType = pdfSettings.outputFormat;

  fillPdfBackground(pdf, pageWidth, pageHeight);

  if (fitMode === "cover") {
    const coverCanvas = createCoverCanvas(
      sourceCanvas,
      availableWidth / availableHeight,
    );
    pdf.addImage(
      getCanvasDataUrl(coverCanvas),
      imageType,
      safeMargin,
      safeMargin,
      availableWidth,
      availableHeight,
      undefined,
      "FAST",
    );
    return;
  }

  if (fitMode === "stretch") {
    pdf.addImage(
      getCanvasDataUrl(sourceCanvas),
      imageType,
      safeMargin,
      safeMargin,
      availableWidth,
      availableHeight,
      undefined,
      "FAST",
    );
    return;
  }

  const sourceRatio = sourceCanvas.width / sourceCanvas.height;
  let finalWidth = availableWidth;
  let finalHeight = finalWidth / sourceRatio;

  if (finalHeight > availableHeight) {
    finalHeight = availableHeight;
    finalWidth = finalHeight * sourceRatio;
  }

  if (!pdfSettings.upscaleImages) {
    const naturalWidthMm = sourceCanvas.width * 0.264583;
    const naturalHeightMm = sourceCanvas.height * 0.264583;
    const naturalScale = Math.min(
      1,
      naturalWidthMm / finalWidth,
      naturalHeightMm / finalHeight,
    );
    finalWidth *= naturalScale;
    finalHeight *= naturalScale;
  }

  const x = (pageWidth - finalWidth) / 2;
  const y = (pageHeight - finalHeight) / 2;
  pdf.addImage(
    getCanvasDataUrl(sourceCanvas),
    imageType,
    x,
    y,
    finalWidth,
    finalHeight,
    undefined,
    "FAST",
  );
};

const downloadGeneratedPdf = () => {
  if (!generatedPdfUrl.value) return;

  const link = document.createElement("a");
  link.href = generatedPdfUrl.value;
  link.download = generatedPdfName.value || outputFileName.value;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const openPreviewImage = (image) => {
  previewImage.value = image;
};

const closePreviewImage = () => {
  previewImage.value = null;
};

const generatePdfWithOrientation = async () => {
  if (images.value.length === 0) {
    showAlert("Please add some images first.", "error");
    return;
  }

  isConverting.value = true;
  conversionProgress.value = 0;
  conversionStatus.value = "Preparing premium PDF settings...";

  try {
    const JsPdf = await loadJsPdfCtor();
    const firstOrientation = images.value[0]?.orientation || "p";
    const pdf = new JsPdf({
      orientation: firstOrientation,
      unit: "mm",
      format: getPdfFormat(),
      compress: true,
    });

    pdf.setProperties({
      title: pdfSettings.title || outputFileName.value.replace(/\.pdf$/i, ""),
      author: pdfSettings.author,
      subject: "Image to PDF export",
      creator: "LakshSolanki Image PDF Studio",
    });

    const count = images.value.length;

    for (let i = 0; i < count; i++) {
      const image = images.value[i];
      conversionStatus.value = `Composing page ${i + 1} of ${count}`;
      conversionProgress.value = Math.round(((i + 1) / count) * 92);
      if (i > 0) {
        pdf.addPage(getPdfFormat(), image.orientation || "p");
      }
      await addImageToPDF(pdf, image);
    }

    conversionStatus.value = "Finalizing compressed PDF...";
    const blob = pdf.output("blob");
    revokeGeneratedPdf();
    generatedPdfUrl.value = URL.createObjectURL(blob);
    generatedPdfName.value = outputFileName.value;
    downloadGeneratedPdf();

    conversionProgress.value = 100;
    showAlert("PDF generated successfully.", "success");
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
  revokeGeneratedPdf();
  showAlert(
    `Image ${index + 1} set to ${layout === "p" ? "Portrait" : "Landscape"}.`,
    "success",
  );
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
  revokeGeneratedPdf();
  showAlert(
    `All images set to ${nextOrientation === "p" ? "Portrait" : "Landscape"}.`,
    "success",
  );
};

const handleDrop = async (e) => {
  e.preventDefault();
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files || []);
  await processFiles(files);
};

const onDragOver = (e) => e.preventDefault();
const onDrop = (e) => e.preventDefault();

watch(pdfSettings, revokeGeneratedPdf, { deep: true });

onMounted(() => {
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("drop", onDrop);
});

onUnmounted(() => {
  revokeGeneratedPdf();
  window.removeEventListener("dragover", onDragOver);
  window.removeEventListener("drop", onDrop);
});
</script>

<template>
  <div class="tool-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-container class="py-8 py-md-12">
      <v-row density="comfortable" align="start">
        <v-col cols="12" :lg="images.length > 0 ? 4 : 12">
          <v-card class="tool-shell p-5 p-md-7" rounded="xl" elevation="0">
            <div
              class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5"
            >
              <div>
                <p class="panel-kicker mb-1">PDF Atelier</p>
                <h2 class="text-h5 font-weight-bold mb-1">
                  Build polished image PDFs
                </h2>
              </div>
              <v-icon
                icon="mdi-file-pdf-box"
                color="primary"
                size="30"
              ></v-icon>
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
                multiple
                accept="image/*"
                @change="handleFileSelect"
                class="file-input"
                required
              />

              <div
                class="d-flex flex-column align-center ga-4 justify-center text-center"
              >
                <v-icon
                  size="72"
                  :icon="
                    images.length > 0
                      ? 'mdi-plus-circle-outline'
                      : 'mdi-cloud-upload-outline'
                  "
                  color="primary"
                />
                <div class="text-h6 font-weight-bold">
                  Drop images into the studio
                </div>
                <div class="text-body-1 text-medium-emphasis">
                  or click to browse from your device
                </div>
                <p class="text-caption text-medium-emphasis mb-0">
                  Supported: JPG, PNG, GIF, WebP
                </p>
              </div>
            </v-sheet>

            <div v-if="isConverting" class="progress-shell mt-5">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">{{ conversionStatus }}</span>
                <span class="text-caption">{{ conversionProgress }}%</span>
              </div>
              <v-progress-linear
                :model-value="conversionProgress"
                color="primary"
                rounded
                height="8"
              ></v-progress-linear>
            </div>

            <div v-if="images.length" class="studio-stats mt-5">
              <div
                v-for="item in studioStats"
                :key="item.label"
                class="studio-stat"
              >
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </v-card>

          <v-card
            v-if="images.length"
            class="tool-shell control-panel p-5 mt-4"
            rounded="xl"
            elevation="0"
          >
            <div class="d-flex align-center justify-space-between ga-3 mb-4">
              <div>
                <p class="panel-kicker mb-1">Production Tools</p>
                <h3 class="text-h6 font-weight-bold mb-0">Export controls</h3>
              </div>
              <v-icon
                icon="mdi-tune-vertical"
                color="secondary"
                size="28"
              ></v-icon>
            </div>

            <div class="control-grid">
              <v-select
                v-model="pdfSettings.pagePreset"
                :items="PAGE_PRESETS"
                item-title="title"
                item-value="value"
                label="Page preset"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
                prepend-inner-icon="mdi-file-document-outline"
              ></v-select>

              <v-text-field
                v-model.trim="pdfSettings.fileName"
                label="PDF file name"
                :placeholder="outputFileName"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
                prepend-inner-icon="mdi-pencil-outline"
              ></v-text-field>

              <v-select
                v-model="pdfSettings.fitMode"
                :items="FIT_OPTIONS"
                item-title="title"
                item-value="value"
                label="Global image fit"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
                prepend-inner-icon="mdi-image-filter-center-focus"
              ></v-select>

              <v-select
                v-model="pdfSettings.outputFormat"
                :items="OUTPUT_FORMATS"
                item-title="title"
                item-value="value"
                label="Image engine"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
                prepend-inner-icon="mdi-shield-check-outline"
              ></v-select>
            </div>

            <div class="slider-control mt-4">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="control-label">Page margin</span>
                <strong>{{ pdfSettings.marginMm }} mm</strong>
              </div>
              <v-slider
                v-model="pdfSettings.marginMm"
                :min="0"
                :max="30"
                :step="1"
                color="primary"
                hide-details
              ></v-slider>
            </div>

            <div
              v-if="pdfSettings.outputFormat === 'JPEG'"
              class="slider-control mt-3"
            >
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="control-label">JPEG quality</span>
                <strong
                  >{{ Math.round(pdfSettings.imageQuality * 100) }}%</strong
                >
              </div>
              <v-slider
                v-model="pdfSettings.imageQuality"
                :min="0.55"
                :max="1"
                :step="0.01"
                color="secondary"
                hide-details
              ></v-slider>
            </div>

            <div class="mt-4">
              <p class="control-label mb-2">Page background</p>
              <div class="swatch-row">
                <button
                  v-for="swatch in BACKGROUND_SWATCHES"
                  :key="swatch.value"
                  type="button"
                  :class="[
                    'swatch-btn',
                    {
                      'is-active': pdfSettings.backgroundColor === swatch.value,
                    },
                  ]"
                  :style="{ backgroundColor: swatch.value }"
                  :aria-label="`Use ${swatch.title} background`"
                  :title="swatch.title"
                  @click="pdfSettings.backgroundColor = swatch.value"
                ></button>
              </div>
            </div>

            <v-switch
              v-model="pdfSettings.upscaleImages"
              color="primary"
              inset
              hide-details
              class="mt-3"
              label="Upscale smaller images for full-page presentation"
            ></v-switch>

            <div class="export-brief mt-4">
              <div>
                <span>Output</span>
                <strong>{{ outputFormatLabel }}</strong>
              </div>
              <div>
                <span>Canvas</span>
                <strong>{{ selectedPagePreset.dimensions }}</strong>
              </div>
              <div>
                <span>Background</span>
                <strong>{{ selectedBackground.title }}</strong>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <transition name="slide-up">
            <div v-if="images.length > 0">
              <v-card class="tool-shell p-4 p-md-5" rounded="xl" elevation="0">
                <div
                  class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5"
                >
                  <div>
                    <p class="panel-kicker mb-1">Page Queue</p>
                    <h3 class="text-h6 font-weight-bold mb-0">
                      Image pages ({{ images.length }})
                    </h3>
                  </div>
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <v-btn
                      @click="toggleAllImagesOrientation"
                      :icon="
                        allImagesOrientation === 'p'
                          ? 'mdi-crop-portrait'
                          : 'mdi-crop-landscape'
                      "
                      color="primary"
                      variant="tonal"
                      rounded="lg"
                      size="small"
                      :aria-label="`Switch all images to ${allImagesOrientation === 'p' ? 'landscape' : 'portrait'} orientation`"
                    ></v-btn>
                    <v-btn
                      variant="tonal"
                      color="primary"
                      rounded="lg"
                      prepend-icon="mdi-sort-alphabetical-ascending"
                      @click="sortImagesByName"
                      class="text-none"
                    >
                      Sort
                    </v-btn>
                    <v-btn
                      variant="tonal"
                      color="secondary"
                      rounded="lg"
                      prepend-icon="mdi-swap-horizontal"
                      @click="reverseImages"
                      class="text-none"
                    >
                      Reverse
                    </v-btn>
                    <v-btn
                      variant="tonal"
                      color="error"
                      rounded="lg"
                      @click="clearAll"
                      class="text-none"
                    >
                      Clear All
                    </v-btn>
                    <v-btn
                      variant="flat"
                      color="primary"
                      rounded="lg"
                      prepend-icon="mdi-download"
                      @click="generatePdfWithOrientation"
                      :disabled="isConverting || images.length === 0"
                      class="text-none"
                    >
                      {{ isConverting ? "Converting..." : "Download PDF" }}
                    </v-btn>
                  </div>
                </div>

                <div v-if="generatedPdfUrl" class="generated-panel mb-4">
                  <div>
                    <p class="generated-title mb-1">Latest PDF is ready</p>
                    <p class="text-caption text-medium-emphasis mb-0">
                      {{ generatedPdfName }}
                    </p>
                  </div>
                  <v-btn
                    variant="tonal"
                    color="primary"
                    rounded="lg"
                    prepend-icon="mdi-download"
                    @click="downloadGeneratedPdf"
                  >
                    Download again
                  </v-btn>
                </div>

                <div class="queue-strip mb-4">
                  <span>{{ selectedPagePreset.title }}</span>
                  <span>{{ layoutModeLabel }}</span>
                  <span>{{ pdfSettings.marginMm }} mm margin</span>
                  <span>{{ outputFormatLabel }}</span>
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
                    <v-card
                      class="image-card premium-image-card"
                      rounded="xl"
                      elevation="0"
                    >
                      <div class="image-card-meta px-3 pt-3">
                        <v-chip color="primary" variant="tonal" size="small"
                          >Page {{ index + 1 }}</v-chip
                        >
                        <v-chip color="secondary" variant="tonal" size="small">
                          {{
                            (image.orientation || "p") === "p"
                              ? "Portrait"
                              : "Landscape"
                          }}
                        </v-chip>
                      </div>

                      <v-card-actions class="d-flex justify-end ga-1 p-2">
                        <v-btn
                          @click="toggleImageOrientation(index)"
                          :icon="
                            (image.orientation || 'p') === 'p'
                              ? 'mdi-crop-portrait'
                              : 'mdi-crop-landscape'
                          "
                          color="primary"
                          variant="tonal"
                          size="small"
                          :aria-label="`Switch image ${index + 1} to ${(image.orientation || 'p') === 'p' ? 'landscape' : 'portrait'} orientation`"
                        ></v-btn>
                        <v-btn
                          @click="rotateImage(index)"
                          icon="mdi-rotate-right"
                          size="small"
                          variant="tonal"
                          color="warning"
                        ></v-btn>
                        <v-btn
                          @click="moveUp(index)"
                          :disabled="index === 0"
                          :icon="xs ? 'mdi-arrow-up' : 'mdi-arrow-left'"
                          size="small"
                          variant="tonal"
                          color="primary"
                        ></v-btn>
                        <v-btn
                          @click="moveDown(index)"
                          :disabled="index === images.length - 1"
                          :icon="xs ? 'mdi-arrow-down' : 'mdi-arrow-right'"
                          size="small"
                          variant="tonal"
                          color="primary"
                        ></v-btn>
                        <v-btn
                          @click="duplicateImage(index)"
                          icon="mdi-content-copy"
                          size="small"
                          variant="tonal"
                          color="secondary"
                        ></v-btn>
                        <v-btn
                          @click="removeImage(index)"
                          icon="mdi-close"
                          size="small"
                          variant="tonal"
                          color="error"
                        ></v-btn>
                      </v-card-actions>

                      <div class="p-2">
                        <div
                          class="page-preview-frame"
                          :style="{
                            backgroundColor: pdfSettings.backgroundColor,
                          }"
                        >
                          <button
                            type="button"
                            class="image-preview-trigger"
                            :aria-label="`Preview ${image.name}`"
                            @click="openPreviewImage(image)"
                          >
                            <v-img
                              :src="image.url"
                              :alt="image.name"
                              class="rounded-lg image-preview"
                              :cover="false"
                              :style="{
                                transform: `rotate(${image.rotation}deg)`,
                              }"
                            ></v-img>
                          </button>
                        </div>
                      </div>

                      <v-card-text class="pt-1 pb-3">
                        <p
                          class="mb-1 text-body-2 text-medium-emphasis text-truncate"
                        >
                          {{ image.name }}
                        </p>
                        <p class="mb-2 text-caption text-medium-emphasis">
                          {{ formatFileSize(image.size) }}
                          <span v-if="image.width && image.height">
                            | {{ image.width }} x {{ image.height }} px</span
                          >
                        </p>
                        <v-select
                          v-model="image.fitMode"
                          :items="IMAGE_FIT_OPTIONS"
                          item-title="title"
                          item-value="value"
                          label="Page fit"
                          variant="outlined"
                          density="compact"
                          rounded="lg"
                          hide-details
                          @update:model-value="revokeGeneratedPdf"
                        ></v-select>
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

    <PhotoZoomDialog
      v-if="previewImage"
      :model-value="Boolean(previewImage)"
      :src="previewImage.url"
      :alt="previewImage.name"
      :dialog-title="previewImage.name"
      hide-trigger
      trigger-variant="image"
      :img-cover="false"
      @update:model-value="(value) => !value && closePreviewImage()"
    />
  </div>
</template>

<style scoped>
.tool-page {
  position: relative;
  background: var(--portfolio-bg);
}

.hero-shell {
  border-bottom: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
}

.panel-kicker {
  color: #0f8f7c !important;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  font-weight: 700;
}

.upload-zone {
  border: 3px dashed rgba(15, 143, 124, 0.35) !important;
  background:
    linear-gradient(145deg, rgba(15, 143, 124, 0.1), rgba(209, 138, 31, 0.05)),
    rgba(15, 143, 124, 0.08) !important;
  padding: 36px 22px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background-color 0.25s ease;
}

.upload-zone:hover {
  transform: translateY(-2px);
  border-color: #0f8f7c !important;
  background:
    linear-gradient(145deg, rgba(15, 143, 124, 0.16), rgba(209, 138, 31, 0.08)),
    rgba(15, 143, 124, 0.15) !important;
}

.upload-zone.drag-over {
  border-style: solid !important;
  border-color: #0f8f7c !important;
  background: rgba(15, 143, 124, 0.22);
}

.file-input {
  display: none;
}

.studio-stats,
.export-brief,
.queue-strip {
  display: grid;
  gap: 10px;
}

.studio-stats {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.studio-stat,
.export-brief > div,
.generated-panel,
.queue-strip span {
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
}

.studio-stat,
.export-brief > div {
  border-radius: 14px;
  padding: 12px;
}

.studio-stat span,
.export-brief span {
  display: block;
  color: var(--portfolio-muted);
  font-size: 0.74rem;
  margin-bottom: 3px;
}

.studio-stat strong,
.export-brief strong {
  display: block;
  color: var(--portfolio-ink);
  font-size: 0.9rem;
  line-height: 1.25;
}

.control-panel {
  position: sticky;
  top: 90px;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.control-label {
  color: var(--portfolio-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.slider-control {
  border: 1px solid var(--portfolio-border-color);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.025);
  padding: 12px 12px 6px;
}

.swatch-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.swatch-btn {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.swatch-btn:hover,
.swatch-btn.is-active {
  transform: translateY(-2px);
  border-color: #d18a1f;
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.22),
    0 0 0 3px rgba(209, 138, 31, 0.16);
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

.premium-image-card {
  height: 100%;
  overflow: hidden;
}

.image-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.page-preview-frame {
  height: 226px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 8px;
  background-image:
    linear-gradient(45deg, rgba(15, 143, 124, 0.1) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(15, 143, 124, 0.1) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(15, 143, 124, 0.1) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(15, 143, 124, 0.1) 75%);
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.12),
    inset 0 0 36px rgba(0, 0, 0, 0.08);
}

.image-preview-trigger {
  display: grid;
  place-items: center;
  width: min(100%, 210px);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: zoom-in;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  transform-origin: center;
  transition: transform 0.25s ease;
}

.image-preview :deep(.v-img__img) {
  object-fit: contain;
}

.generated-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 14px;
  padding: 12px;
}

.generated-title {
  color: var(--portfolio-ink);
  font-weight: 800;
}

.queue-strip {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.queue-strip span {
  border-radius: 999px;
  padding: 8px 12px;
  color: var(--portfolio-ink-soft);
  font-size: 0.82rem;
  text-align: center;
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

@media (max-width: 1264px) {
  .control-panel {
    position: static;
  }
}

@media (max-width: 960px) {
  .upload-zone {
    padding: 28px 18px;
  }

  .queue-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .studio-stats,
  .queue-strip {
    grid-template-columns: 1fr;
  }

  .generated-panel {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
