<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import QRCode from "qrcode";
import Alerts from "@/components/Alerts.vue";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import {
  calculateContrastRatio,
  evaluateQrScannability,
  formatFileSize,
  truncateFilename,
  validateClientPdf,
  validatePdfFile,
} from "@/utils/qrContrast";

// Studio Mode Navigation Injection
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

// Alert Notification State
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type;
  alertVisible.value = true;
};

// Upload & Document Lifecycle State
const fileInput = ref(null);
const logoFileInput = ref(null);
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref("");
const uploadedDoc = ref(null); // { id, filename, size, url, expires_at }
const totalPages = ref(1);
const deleteDialogOpen = ref(false);
const isDeleting = ref(false);
const isCopied = ref(false);

// PDF Page 1 Preview Canvas State
const pdfCanvasRef = ref(null);
let pdfLibPromise = null;
const loadPdfLib = async () => {
  if (!pdfLibPromise) {
    pdfLibPromise = Promise.all([
      import("pdfjs-dist/build/pdf"),
      import("pdfjs-dist/build/pdf.worker.mjs?url"),
    ]).then(([pdfjsLib, workerModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      return pdfjsLib;
    });
  }
  return pdfLibPromise;
};

// QR Customizer Settings
const qrCanvasRef = ref(null);
const logoImgElement = ref(null);

const DEFAULT_QR_SETTINGS = {
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  size: 320,
  includeLogo: false,
  logoUrl: null,
};

const qrSettings = reactive({
  fgColor: DEFAULT_QR_SETTINGS.fgColor,
  bgColor: DEFAULT_QR_SETTINGS.bgColor,
  size: DEFAULT_QR_SETTINGS.size,
  includeLogo: DEFAULT_QR_SETTINGS.includeLogo,
  logoUrl: DEFAULT_QR_SETTINGS.logoUrl,
});

const COLOR_PRESETS = [
  { name: "Classic", fg: "#000000", bg: "#FFFFFF" },
  { name: "Studio Burgundy", fg: "#7C0E44", bg: "#FFFFFF" },
  { name: "Warm Portfolio", fg: "#7C0E44", bg: "#F2DACE" },
  { name: "Dark Slate", fg: "#FFFFFF", bg: "#111827" },
];

const contrastEvaluation = computed(() => {
  return evaluateQrScannability(qrSettings.fgColor, qrSettings.bgColor);
});

const publicUrl = computed(() => {
  if (!uploadedDoc.value?.id) return "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/v/${uploadedDoc.value.id}`;
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const triggerLogoInput = () => {
  logoFileInput.value?.click();
};

const resetQrDefaults = () => {
  qrSettings.fgColor = DEFAULT_QR_SETTINGS.fgColor;
  qrSettings.bgColor = DEFAULT_QR_SETTINGS.bgColor;
  qrSettings.size = DEFAULT_QR_SETTINGS.size;
  qrSettings.includeLogo = DEFAULT_QR_SETTINGS.includeLogo;
  qrSettings.logoUrl = DEFAULT_QR_SETTINGS.logoUrl;
  logoImgElement.value = null;
  renderQrCode();
  showAlert("QR settings restored to defaults.", "info");
};

// Logo Upload Handler
const handleLogoUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showAlert("Please select a valid image file for the center logo.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    qrSettings.logoUrl = e.target.result;
    qrSettings.includeLogo = true;
    const img = new Image();
    img.onload = () => {
      logoImgElement.value = img;
      renderQrCode();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = "";
};

const removeLogo = () => {
  qrSettings.logoUrl = null;
  logoImgElement.value = null;
  renderQrCode();
};

// File Selection & Upload Handlers
const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) processUpload(file);
  event.target.value = "";
};

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) processUpload(file);
};

// Window-level safety listeners to prevent browser from navigating on drop
const onWindowDragOver = (e) => e.preventDefault();
const onWindowDrop = (e) => e.preventDefault();

onMounted(() => {
  window.addEventListener("dragover", onWindowDragOver);
  window.addEventListener("drop", onWindowDrop);
});

onUnmounted(() => {
  window.removeEventListener("dragover", onWindowDragOver);
  window.removeEventListener("drop", onWindowDrop);
});

const processUpload = async (file) => {
  const validation = await validatePdfFile(file);
  if (!validation.valid) {
    showAlert(validation.error, "error");
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 10;
  uploadStatus.value = "Preparing document upload...";

  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const xhr = new XMLHttpRequest();
    const baseUrl = getApiBaseUrl();

    const uploadPromise = new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (evt) => {
        if (evt.lengthComputable) {
          uploadProgress.value = Math.min(
            90,
            Math.round((evt.loaded / evt.total) * 100),
          );
          uploadStatus.value = `Uploading document (${uploadProgress.value}%)...`;
        }
      });

      xhr.addEventListener("load", () => {
        let respData = null;
        try {
          respData = JSON.parse(xhr.responseText);
        } catch {
          respData = { detail: xhr.responseText };
        }

        if (xhr.status >= 200 && xhr.status < 300 && respData?.status === "success") {
          resolve(respData);
        } else if (xhr.status === 413) {
          reject(new Error(respData?.detail || "File size exceeds 10 MB limit."));
        } else if (xhr.status === 429) {
          reject(
            new Error(
              respData?.detail ||
                "Upload rate limit exceeded. Please wait a minute before retrying.",
            ),
          );
        } else if (xhr.status === 400) {
          reject(new Error(respData?.detail || "Invalid PDF format or corrupted file."));
        } else {
          reject(new Error(respData?.detail || `Upload failed (HTTP ${xhr.status}).`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network connection error while uploading file."));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload request timed out. Please try again."));
      });

      xhr.timeout = 60000;
      xhr.open("POST", `${baseUrl}/api/pdf/upload`, true);
      xhr.send(formData);
    });

    const result = await uploadPromise;
    uploadProgress.value = 100;
    uploadStatus.value = "Upload complete!";

    uploadedDoc.value = {
      id: result.id,
      filename: result.filename || file.name,
      size: result.size || file.size,
      url: result.url,
      expires_at: result.expires_at,
    };

    showAlert("PDF uploaded successfully. Live QR code generated!", "success");

    // Render Preview & QR in nextTick after DOM mounts canvas elements
    await nextTick();
    await Promise.all([renderPdfPreview(file), renderQrCode()]);
  } catch (err) {
    showAlert(err.message || "Failed to upload PDF.", "error");
  } finally {
    isUploading.value = false;
  }
};

// Render In-Tool PDF Page 1 Preview Canvas
const renderPdfPreview = async (file) => {
  try {
    const pdfjsLib = await loadPdfLib();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    totalPages.value = pdfDoc.numPages;

    const page = await pdfDoc.getPage(1);
    if (!pdfCanvasRef.value) return;

    const canvas = pdfCanvasRef.value;
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 280;
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const context = canvas.getContext("2d");
    context.save();
    context.scale(dpr, dpr);

    // Clean background
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, viewport.width, viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    context.restore();
  } catch (e) {
    console.warn("Could not render PDF preview canvas:", e);
  }
};

// Render QR Code onto Canvas with Error Correction Level 'H'
const renderQrCode = async () => {
  if (!publicUrl.value || !qrCanvasRef.value) return;

  const canvas = qrCanvasRef.value;
  await QRCode.toCanvas(canvas, publicUrl.value, {
    errorCorrectionLevel: "H",
    margin: 3,
    width: qrSettings.size,
    color: {
      dark: qrSettings.fgColor,
      light: qrSettings.bgColor,
    },
  });

  // Optional Center Logo Badge
  if (qrSettings.includeLogo) {
    const ctx = canvas.getContext("2d");
    const center = canvas.width / 2;
    // Area constraint: logo <= 22% of QR dimension
    const logoSize = Math.floor(canvas.width * 0.22);
    const half = logoSize / 2;
    const badgeRadius = half + 6;

    // 1. Draw protective circular badge
    ctx.beginPath();
    ctx.arc(center, center, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = qrSettings.bgColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = qrSettings.fgColor;
    ctx.stroke();

    // 2. Render logo image or fallback badge
    if (logoImgElement.value) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, half, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        logoImgElement.value,
        center - half,
        center - half,
        logoSize,
        logoSize,
      );
      ctx.restore();
    } else {
      // Default embedded PDF logo badge glyph
      ctx.fillStyle = qrSettings.fgColor;
      ctx.font = `bold ${Math.max(12, Math.floor(logoSize * 0.42))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PDF", center, center);
    }
  }
};

watch(
  () => [
    qrSettings.fgColor,
    qrSettings.bgColor,
    qrSettings.size,
    qrSettings.includeLogo,
    qrSettings.logoUrl,
  ],
  () => renderQrCode(),
);

// Copy Link Action
const copyPublicLink = async () => {
  if (!publicUrl.value) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(publicUrl.value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = publicUrl.value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    isCopied.value = true;
    showAlert("Public link copied to clipboard!", "success");
    setTimeout(() => {
      isCopied.value = false;
    }, 2500);
  } catch {
    showAlert("Failed to copy link to clipboard.", "error");
  }
};

// Document Deletion Workflow with Full State Invalidation
const confirmDeleteDocument = async () => {
  if (!uploadedDoc.value?.id) return;
  isDeleting.value = true;

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/pdf/${uploadedDoc.value.id}`, {
      method: "DELETE",
    });

    if (!res.ok && res.status !== 404) {
      let errMsg = "Deletion failed on server.";
      try {
        const errJson = await res.json();
        errMsg = errJson.detail || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    // Complete local teardown
    uploadedDoc.value = null;
    uploadProgress.value = 0;
    uploadStatus.value = "";
    totalPages.value = 1;
    deleteDialogOpen.value = false;

    if (fileInput.value) {
      fileInput.value.value = "";
    }

    if (pdfCanvasRef.value) {
      const ctx = pdfCanvasRef.value.getContext("2d");
      ctx?.clearRect(0, 0, pdfCanvasRef.value.width, pdfCanvasRef.value.height);
    }

    if (qrCanvasRef.value) {
      const ctx = qrCanvasRef.value.getContext("2d");
      ctx?.clearRect(0, 0, qrCanvasRef.value.width, qrCanvasRef.value.height);
    }

    showAlert(
      "Document deleted. Public QR link and download have been invalidated.",
      "success",
    );
  } catch (err) {
    showAlert(err.message || "Failed to delete document.", "error");
  } finally {
    isDeleting.value = false;
  }
};

// Multi-Format Export Functions
const downloadPngStandard = () => {
  if (!qrCanvasRef.value) return;
  const link = document.createElement("a");
  link.download = `qr-${uploadedDoc.value?.id || "document"}.png`;
  link.href = qrCanvasRef.value.toDataURL("image/png");
  link.click();
};

const downloadPngHighRes = async () => {
  if (!publicUrl.value) return;
  const offscreen = document.createElement("canvas");
  offscreen.width = 2000;
  offscreen.height = 2000;

  await QRCode.toCanvas(offscreen, publicUrl.value, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 2000,
    color: {
      dark: qrSettings.fgColor,
      light: qrSettings.bgColor,
    },
  });

  if (qrSettings.includeLogo) {
    const ctx = offscreen.getContext("2d");
    const center = 1000;
    const logoSize = Math.floor(2000 * 0.22);
    const half = logoSize / 2;
    const badgeRadius = half + 20;

    ctx.beginPath();
    ctx.arc(center, center, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = qrSettings.bgColor;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = qrSettings.fgColor;
    ctx.stroke();

    if (logoImgElement.value) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, half, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        logoImgElement.value,
        center - half,
        center - half,
        logoSize,
        logoSize,
      );
      ctx.restore();
    } else {
      ctx.fillStyle = qrSettings.fgColor;
      ctx.font = `bold ${Math.floor(logoSize * 0.42)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PDF", center, center);
    }
  }

  const link = document.createElement("a");
  link.download = `qr-${uploadedDoc.value?.id || "document"}-2000px.png`;
  link.href = offscreen.toDataURL("image/png");
  link.click();
};

const downloadSvg = async () => {
  if (!publicUrl.value) return;
  const dimension = 500;
  let svgString = await QRCode.toString(publicUrl.value, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 3,
    width: dimension,
    color: {
      dark: qrSettings.fgColor,
      light: qrSettings.bgColor,
    },
  });

  if (qrSettings.includeLogo) {
    const center = dimension / 2;
    const logoSize = dimension * 0.22;
    const badgeRadius = logoSize / 2 + 6;

    let innerContent = "";
    if (qrSettings.logoUrl) {
      innerContent = `
  <clipPath id="qr-logo-clip">
    <circle cx="${center.toFixed(2)}" cy="${center.toFixed(2)}" r="${(logoSize / 2).toFixed(2)}"/>
  </clipPath>
  <image href="${qrSettings.logoUrl}" x="${(center - logoSize / 2).toFixed(2)}" y="${(center - logoSize / 2).toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" clip-path="url(#qr-logo-clip)" preserveAspectRatio="xMidYMid meet"/>`;
    } else {
      innerContent = `
  <text x="${center.toFixed(2)}" y="${(center + 5).toFixed(2)}" fill="${qrSettings.fgColor}" font-size="${Math.floor(logoSize * 0.42)}" font-family="sans-serif" font-weight="bold" text-anchor="middle">PDF</text>`;
    }

    const badgeSvg = `
  <circle cx="${center.toFixed(2)}" cy="${center.toFixed(2)}" r="${badgeRadius.toFixed(2)}" fill="${qrSettings.bgColor}" stroke="${qrSettings.fgColor}" stroke-width="2"/>
  ${innerContent}
`;
    svgString = svgString.replace("</svg>", `${badgeSvg}</svg>`);
  }

  if (!svgString.startsWith("<?xml")) {
    svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`;
  }

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `qr-${uploadedDoc.value?.id || "document"}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="tool-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-container class="py-8 py-md-12">
      <v-row density="comfortable" align="start">
        <!-- Left Sidebar: Mode Navigation, Document Status & QR Customizer -->
        <v-col cols="12" md="4" lg="3">
          <v-card class="tool-shell p-5" rounded="xl" elevation="0">
            <!-- Studio Mode Navigation -->
            <div class="studio-mode-nav" :class="{ 'mb-4': uploadedDoc }">
              <div class="d-flex align-center justify-space-between mb-3">
                <p class="panel-kicker mb-0 mt-0">Conversion Mode</p>
                <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                  PDF → QR
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
                  class="mode-list-btn"
                  @click="switchTab('pdf-to-img')"
                >
                  <div class="mode-btn-icon">
                    <v-icon size="20">mdi-file-pdf-box</v-icon>
                  </div>
                  <div class="mode-btn-content text-left">
                    <div class="mode-btn-title">PDF to Image</div>
                    <div class="mode-btn-subtitle">Extract pages to JPG / PNG</div>
                  </div>
                  <v-icon size="16" class="mode-btn-chevron">mdi-chevron-right</v-icon>
                </button>

                <button
                  type="button"
                  class="mode-list-btn is-active"
                  @click="switchTab('pdf-to-qr')"
                >
                  <div class="mode-btn-icon">
                    <v-icon size="20">mdi-qrcode</v-icon>
                  </div>
                  <div class="mode-btn-content text-left">
                    <div class="mode-btn-title">PDF to QR</div>
                    <div class="mode-btn-subtitle">Shareable QR link & preview</div>
                  </div>
                  <v-icon size="16" class="mode-btn-chevron">mdi-check</v-icon>
                </button>
              </div>
            </div>

            <!-- Hidden File Input for PDF Upload -->
            <input
              ref="fileInput"
              type="file"
              accept="application/pdf"
              @change="handleFileSelect"
              class="d-none"
            />

            <!-- Hidden File Input for Center Logo -->
            <input
              ref="logoFileInput"
              type="file"
              accept="image/*"
              @change="handleLogoUpload"
              class="d-none"
            />

            <!-- Active Document Info Bar & Stats -->
            <template v-if="uploadedDoc">
              <div class="compact-upload-bar d-flex align-center justify-space-between p-3 rounded-lg mb-3">
                <div class="d-flex align-center ga-2 min-w-0">
                  <v-icon color="primary" size="22">mdi-file-pdf-box</v-icon>
                  <div class="min-w-0">
                    <div class="text-body-2 font-weight-bold text-truncate">
                      {{ truncateFilename(uploadedDoc.filename, 24) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatFileSize(uploadedDoc.size) }} • Active
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

              <div class="studio-stats mt-4">
                <div class="studio-stat">
                  <span>File Size</span>
                  <strong>{{ formatFileSize(uploadedDoc.size) }}</strong>
                </div>
                <div class="studio-stat">
                  <span>Retention</span>
                  <strong>24 Hours</strong>
                </div>
                <div class="studio-stat">
                  <span>Contrast Ratio</span>
                  <strong>{{ contrastEvaluation.ratio }}:1</strong>
                </div>
                <div class="studio-stat">
                  <span>QR Status</span>
                  <strong class="text-success">Active</strong>
                </div>
              </div>
            </template>
          </v-card>

          <!-- Production Tools: QR Customizer Card -->
          <v-card
            v-if="uploadedDoc"
            class="tool-shell control-panel p-5 mt-4"
            rounded="xl"
            elevation="0"
          >
            <div class="d-flex align-center justify-space-between ga-3 mb-4">
              <div>
                <p class="panel-kicker mb-1">Production Tools</p>
                <h3 class="text-h6 font-weight-bold mb-0">QR Customizer</h3>
              </div>
              <v-icon icon="mdi-tune-vertical" color="secondary" size="24" />
            </div>

            <!-- Contrast Warning Banner if < 3.0:1 -->
            <div v-if="contrastEvaluation.isWarning" class="mb-4">
              <v-alert
                type="warning"
                variant="tonal"
                density="compact"
                rounded="lg"
                class="text-caption"
              >
                <strong>Low Contrast ({{ contrastEvaluation.ratio }}:1):</strong>
                {{ contrastEvaluation.warningMessage }}
              </v-alert>
            </div>

            <!-- Palette Presets -->
            <div class="mb-3">
              <span class="control-label d-block mb-2">Palette Presets</span>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="p in COLOR_PRESETS"
                  :key="p.name"
                  size="small"
                  variant="outlined"
                  class="cursor-pointer"
                  @click="qrSettings.fgColor = p.fg; qrSettings.bgColor = p.bg;"
                >
                  {{ p.name }}
                </v-chip>
              </div>
            </div>

            <!-- Color Inputs -->
            <div class="mb-3">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="control-label">Foreground (Dark)</span>
                <input
                  v-model="qrSettings.fgColor"
                  type="color"
                  class="color-picker-input"
                />
              </div>
              <v-text-field
                v-model="qrSettings.fgColor"
                variant="outlined"
                density="compact"
                rounded="lg"
                prepend-inner-icon="mdi-pencil-outline"
                hide-details
                class="mb-3"
              />

              <div class="d-flex align-center justify-space-between mb-1">
                <span class="control-label">Background (Light)</span>
                <input
                  v-model="qrSettings.bgColor"
                  type="color"
                  class="color-picker-input"
                />
              </div>
              <v-text-field
                v-model="qrSettings.bgColor"
                variant="outlined"
                density="compact"
                rounded="lg"
                prepend-inner-icon="mdi-pencil-outline"
                hide-details
              />
            </div>

            <!-- Size Slider -->
            <div class="slider-control mt-4">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="control-label">Display Size</span>
                <strong>{{ qrSettings.size }} px</strong>
              </div>
              <v-slider
                v-model="qrSettings.size"
                :min="200"
                :max="600"
                :step="20"
                color="primary"
                hide-details
              />
            </div>

            <!-- Center Logo Options -->
            <div class="mt-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="control-label">Center Logo Badge</span>
                <v-switch
                  v-model="qrSettings.includeLogo"
                  color="primary"
                  hide-details
                  density="compact"
                />
              </div>

              <template v-if="qrSettings.includeLogo">
                <div class="d-flex align-center ga-2 mt-2">
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    rounded="lg"
                    prepend-icon="mdi-cloud-upload-outline"
                    class="text-none flex-1"
                    @click="triggerLogoInput"
                  >
                    {{ qrSettings.logoUrl ? "Change Logo" : "Upload Logo" }}
                  </v-btn>
                  <v-btn
                    v-if="qrSettings.logoUrl"
                    size="small"
                    variant="text"
                    color="error"
                    rounded="lg"
                    icon="mdi-close"
                    @click="removeLogo"
                  />
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ qrSettings.logoUrl ? "Custom image badge active" : "Default PDF badge active" }}
                </div>
              </template>
            </div>

            <!-- Reset to Defaults Button -->
            <v-btn
              block
              variant="outlined"
              color="primary"
              rounded="lg"
              prepend-icon="mdi-refresh"
              class="text-none font-weight-bold mt-5"
              @click="resetQrDefaults"
            >
              Reset to Defaults
            </v-btn>
          </v-card>
        </v-col>

        <!-- Right Main Workspace -->
        <v-col cols="12" md="8" lg="9">
          <!-- Upload Dropzone (When No Document Loaded) -->
          <v-card
            v-if="!uploadedDoc"
            class="tool-shell p-6 p-md-8"
            rounded="xl"
            elevation="0"
          >
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-6">
              <div>
                <h2 class="text-h5 font-weight-bold my-0">Drop your PDF here</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Instantly convert PDF files into customizable, scannable QR codes.
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
                <div class="text-body-1 text-medium-emphasis">
                  or click anywhere in this container to browse (up to 10 MB)
                </div>

                <div class="d-flex flex-wrap justify-center ga-2 mt-2">
                  <span class="feature-chip">24h Auto-Retention</span>
                  <span class="feature-chip">Level 'H' Error Correction</span>
                  <span class="feature-chip">Vector SVG &amp; High-Res PNG</span>
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

            <div v-if="isUploading" class="progress-shell mt-5">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2 font-weight-medium">{{ uploadStatus }}</span>
                <span class="text-caption font-weight-bold">{{ uploadProgress }}%</span>
              </div>
              <v-progress-linear
                :model-value="uploadProgress"
                color="primary"
                rounded
                height="8"
              />
            </div>
          </v-card>

          <!-- Active Workspace (When Document Loaded) -->
          <v-card v-else class="tool-shell p-6 p-md-8" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
              <div>
                <h2 class="text-h5 font-weight-bold my-0 text-truncate">
                  {{ uploadedDoc.filename }}
                </h2>
                <span class="text-caption text-medium-emphasis">
                  Expires in 24 hours • Public URL active
                </span>
              </div>
              <div class="d-flex align-center ga-2 flex-wrap">
                <v-btn
                  variant="outlined"
                  color="primary"
                  rounded="lg"
                  prepend-icon="mdi-open-in-new"
                  class="text-none font-weight-bold"
                  :href="publicUrl"
                  target="_blank"
                >
                  Open Landing Page
                </v-btn>
                <v-btn
                  variant="tonal"
                  color="error"
                  rounded="lg"
                  prepend-icon="mdi-delete-outline"
                  class="text-none font-weight-bold"
                  @click="deleteDialogOpen = true"
                >
                  Delete PDF
                </v-btn>
              </div>
            </div>

            <!-- Two-Column Preview & Live QR Actions -->
            <v-row density="comfortable">
              <!-- Left Sub-column: Document Page 1 Thumbnail -->
              <v-col cols="12" md="6">
                <div class="subpanel-shell p-4 rounded-xl h-100 d-flex flex-column">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-2 font-weight-bold">
                      Document Preview (Page 1)
                    </span>
                    <v-chip size="x-small" color="primary" variant="tonal">
                      Page 1 of {{ totalPages }}
                    </v-chip>
                  </div>
                  <div class="canvas-wrapper d-flex align-center justify-center p-3 rounded-lg flex-grow-1">
                    <canvas ref="pdfCanvasRef" class="pdf-preview-canvas" />
                  </div>
                </div>
              </v-col>

              <!-- Right Sub-column: Live Scannable QR & Actions -->
              <v-col cols="12" md="6">
                <div class="subpanel-shell p-4 rounded-xl d-flex flex-column align-center h-100">
                  <div class="w-100 d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-2 font-weight-bold">
                      Live Scannable QR Code
                    </span>
                    <v-chip
                      size="x-small"
                      :color="contrastEvaluation.isWarning ? 'warning' : 'success'"
                      variant="tonal"
                      class="font-weight-bold"
                    >
                      {{ contrastEvaluation.ratio }}:1 Contrast
                    </v-chip>
                  </div>

                  <div class="qr-canvas-wrapper d-flex align-center justify-center p-4 rounded-xl mb-4">
                    <canvas ref="qrCanvasRef" class="qr-preview-canvas" />
                  </div>

                  <!-- Public Sharing URL Box with Copy Button -->
                  <div class="w-100 copy-link-box p-2 rounded-lg d-flex align-center justify-space-between ga-2 mb-4">
                    <span class="text-caption text-truncate ml-2 user-select-all font-mono">
                      {{ publicUrl }}
                    </span>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="flat"
                      rounded="lg"
                      :prepend-icon="isCopied ? 'mdi-check' : 'mdi-content-copy'"
                      class="text-none font-weight-bold flex-shrink-0"
                      @click="copyPublicLink"
                    >
                      {{ isCopied ? "Copied!" : "Copy Link" }}
                    </v-btn>
                  </div>

                  <!-- Multi-Format Export Downloads -->
                  <div class="w-100 d-flex flex-column ga-2 mt-auto">
                    <div class="d-flex ga-2">
                      <v-btn
                        variant="tonal"
                        color="primary"
                        rounded="lg"
                        prepend-icon="mdi-download"
                        class="text-none font-weight-bold flex-1"
                        @click="downloadPngStandard"
                      >
                        PNG (Standard)
                      </v-btn>
                      <v-btn
                        variant="tonal"
                        color="primary"
                        rounded="lg"
                        prepend-icon="mdi-svg"
                        class="text-none font-weight-bold flex-1"
                        @click="downloadSvg"
                      >
                        Vector SVG
                      </v-btn>
                    </div>
                    <v-btn
                      block
                      variant="flat"
                      color="primary"
                      rounded="lg"
                      prepend-icon="mdi-download"
                      class="text-none font-weight-bold"
                      @click="downloadPngHighRes"
                    >
                      High-Res PNG (2000px)
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="480">
      <v-card rounded="xl" class="p-6 tool-shell">
        <div class="d-flex align-center ga-3 mb-3">
          <v-avatar color="error" variant="tonal" size="44">
            <v-icon icon="mdi-trash-can-outline" size="24" color="error" />
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold mb-0">Delete Document?</h3>
            <p class="text-caption text-medium-emphasis mb-0">Permanent action</p>
          </div>
        </div>

        <p class="text-body-2 text-medium-emphasis mb-4">
          This will permanently remove <strong>{{ uploadedDoc?.filename }}</strong> from secure storage.
          The public link and any printed QR codes will immediately stop working (returning 404).
        </p>

        <div class="d-flex justify-end ga-2">
          <v-btn
            variant="outlined"
            rounded="lg"
            class="text-none"
            :disabled="isDeleting"
            @click="deleteDialogOpen = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="lg"
            class="text-none font-weight-bold"
            :loading="isDeleting"
            @click="confirmDeleteDocument"
          >
            Delete Document
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
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

.compact-upload-bar {
  background: rgba(124, 14, 68, 0.04);
  border: 1px dashed rgba(124, 14, 68, 0.2);
}

.tool-page {
  position: relative;
  background: var(--portfolio-bg);
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
}

.panel-kicker {
  color: #7c0e44 !important;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  font-weight: 700;
}

.upload-zone {
  border: 3px dashed rgba(124, 14, 68, 0.35) !important;
  background:
    linear-gradient(145deg, rgba(124, 14, 68, 0.1), rgba(170, 94, 122, 0.05)),
    rgba(124, 14, 68, 0.08) !important;
  padding: 36px 22px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background-color 0.25s ease;
}

.upload-zone:hover {
  transform: translateY(-2px);
  border-color: #7c0e44 !important;
  background:
    linear-gradient(145deg, rgba(124, 14, 68, 0.16), rgba(170, 94, 122, 0.08)),
    rgba(124, 14, 68, 0.15) !important;
}

.upload-zone.drag-over {
  border-style: solid !important;
  border-color: #7c0e44 !important;
  background: rgba(124, 14, 68, 0.22);
}

.feature-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(124, 14, 68, 0.08);
  color: #7c0e44;
  font-size: 0.75rem;
  font-weight: 600;
}

.studio-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.studio-stat {
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 12px;
}

.studio-stat span {
  display: block;
  color: var(--portfolio-muted);
  font-size: 0.74rem;
  margin-bottom: 3px;
}

.studio-stat strong {
  display: block;
  color: var(--portfolio-ink);
  font-size: 0.9rem;
  line-height: 1.25;
}

.control-panel {
  position: sticky;
  top: 90px;
}

.control-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--portfolio-ink);
}

.color-picker-input {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.subpanel-shell {
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.5);
}

.canvas-wrapper {
  background: #f7f3ea;
  border: 1px solid rgba(124, 14, 68, 0.1);
  min-height: 320px;
}

.pdf-preview-canvas {
  max-width: 100%;
  height: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.qr-canvas-wrapper {
  background: #ffffff;
  border: 1px solid rgba(124, 14, 68, 0.1);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.04);
}

.qr-preview-canvas {
  max-width: 100%;
  height: auto;
}

.copy-link-box {
  background: rgba(124, 14, 68, 0.05);
  border: 1px solid rgba(124, 14, 68, 0.15);
}
</style>
