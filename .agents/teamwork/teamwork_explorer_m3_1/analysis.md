# Milestone 3 Architecture Blueprint: Studio Mode & Navigation Integration

**Author**: Explorer 1 (Milestone 3)  
**Date**: 2026-11-04  
**Target Workspace**: `c:\Users\laksh\Documents\GitHub\LakshSolanki`  
**Target Milestone**: Milestone 3 - Studio Mode, Navigation Integration & QR Customizer  

---

## 1. Executive Summary

This document establishes the comprehensive architectural blueprint for Milestone 3 of the PDF to QR Code Generator project. It covers:
1. **Studio Mode Integration**: Expanding `PdfImageStudio.vue` to support `pdf-to-qr` alongside `img-to-pdf` and `pdf-to-img` with `<keep-alive>` state preservation.
2. **Synchronized Navigation Controls**: Updating the sidebar navigation blocks in `ImgPdfPage.vue` and `PdfImgPage.vue` with identical styling, active states, and routing logic.
3. **MDI Icon System Registration**: Importing and registering `mdiQrcode` and `mdiQrcodeScan` in `frontend/src/plugins/icons.js` to ensure `<v-icon icon="mdi-qrcode">` renders crisp SVGs instead of fallback question marks.
4. **Complete Component Architecture for `PdfQrPage.vue`**: Specifying the exact visual shell, Vuetify 4 components, design tokens, responsive grid, client validation, upload lifecycle, live QR engine, contrast warning, in-tool PDF canvas preview, and deletion actions.

---

## 2. Studio Mode Switching Architecture (`PdfImageStudio.vue`)

### 2.1 Current State Analysis
File: `frontend/src/pages/Projects/PdfImageStudio.vue` (Lines 1-54)
- **Active Tab Initialization**:
  ```javascript
  const activeTab = ref(
    route.query.mode === "pdf-to-img" ? "pdf-to-img" : "img-to-pdf",
  );
  ```
  Only checks for `pdf-to-img`, defaulting everything else to `img-to-pdf`.
- **Query Parameter Watcher**:
  ```javascript
  watch(
    () => route.query.mode,
    (newMode) => {
      if (newMode === "pdf-to-img" || newMode === "img-to-pdf") {
        activeTab.value = newMode;
      }
    },
  );
  ```
  Ignores `pdf-to-qr`.
- **Template Dynamic Component**:
  ```vue
  <keep-alive>
    <component :is="activeTab === 'img-to-pdf' ? ImgPdfPage : PdfImgPage" />
  </keep-alive>
  ```
  Uses a binary ternary expression that cannot resolve a third mode.

### 2.2 Architectural Blueprint for `PdfImageStudio.vue`
1. **Import `PdfQrPage.vue`**:
   ```javascript
   import ImgPdfPage from "./ImgPdfPage.vue";
   import PdfImgPage from "./PdfImgPage.vue";
   import PdfQrPage from "./PdfQrPage.vue";
   ```
2. **Valid Modes Registry**:
   ```javascript
   const VALID_MODES = ["img-to-pdf", "pdf-to-img", "pdf-to-qr"];
   const resolveValidMode = (mode) =>
     VALID_MODES.includes(mode) ? mode : "img-to-pdf";
   ```
3. **Reactive State**:
   ```javascript
   const activeTab = ref(resolveValidMode(route.query.mode));

   watch(
     () => route.query.mode,
     (newMode) => {
       if (VALID_MODES.includes(newMode)) {
         activeTab.value = newMode;
       }
     },
   );
   ```
4. **Component Map & Computed Renderer**:
   ```javascript
   const MODE_COMPONENTS = {
     "img-to-pdf": ImgPdfPage,
     "pdf-to-img": PdfImgPage,
     "pdf-to-qr": PdfQrPage,
   };

   const currentComponent = computed(
     () => MODE_COMPONENTS[activeTab.value] || ImgPdfPage,
   );
   ```
5. **Preserved Dependency Injection Contract**:
   `PdfImageStudio.vue` continues to provide the identical contract:
   ```javascript
   provide("studioMode", {
     activeTab,
     switchTab,
   });
   ```
   Ensuring any child view calling `switchTab('pdf-to-qr')` immediately updates URL query parameters and reactive tab state.

---

## 3. Synchronized Mode Navigation Blueprint

Both `ImgPdfPage.vue` and `PdfImgPage.vue` render a sidebar navigation widget inside `v-col cols="12" md="4" lg="3"`. The design system uses custom `.mode-list-btn` elements with active states, icons, titles, and subtitles.

### 3.1 Button Specifications for All Three Modes

| Mode | Title | Subtitle | Icon | Active Chip Label |
|---|---|---|---|---|
| `img-to-pdf` | Image to PDF | Batch images into single PDF | `mdi-image-multiple-outline` | `Image → PDF` |
| `pdf-to-img` | PDF to Image | Extract pages to JPG / PNG | `mdi-file-pdf-box` | `PDF → Image` |
| `pdf-to-qr` | PDF to QR | Shareable QR link & preview | `mdi-qrcode` | `PDF → QR` |

### 3.2 Snippet to Update in `ImgPdfPage.vue`
Inside `frontend/src/pages/Projects/ImgPdfPage.vue` (around lines 705-735), append the third mode button:
```html
<div class="mode-list-container d-flex flex-column ga-2">
  <button
    type="button"
    class="mode-list-btn is-active"
    @click="switchTab('img-to-pdf')"
  >
    <div class="mode-btn-icon">
      <v-icon size="20">mdi-image-multiple-outline</v-icon>
    </div>
    <div class="mode-btn-content text-left">
      <div class="mode-btn-title">Image to PDF</div>
      <div class="mode-btn-subtitle">Batch images into single PDF</div>
    </div>
    <v-icon size="16" class="mode-btn-chevron">mdi-check</v-icon>
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
    class="mode-list-btn"
    @click="switchTab('pdf-to-qr')"
  >
    <div class="mode-btn-icon">
      <v-icon size="20">mdi-qrcode</v-icon>
    </div>
    <div class="mode-btn-content text-left">
      <div class="mode-btn-title">PDF to QR</div>
      <div class="mode-btn-subtitle">Shareable QR link & preview</div>
    </div>
    <v-icon size="16" class="mode-btn-chevron">mdi-chevron-right</v-icon>
  </button>
</div>
```

### 3.3 Snippet to Update in `PdfImgPage.vue`
Inside `frontend/src/pages/Projects/PdfImgPage.vue` (around lines 585-616), append the third mode button:
```html
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

  <button
    type="button"
    class="mode-list-btn"
    @click="switchTab('pdf-to-qr')"
  >
    <div class="mode-btn-icon">
      <v-icon size="20">mdi-qrcode</v-icon>
    </div>
    <div class="mode-btn-content text-left">
      <div class="mode-btn-title">PDF to QR</div>
      <div class="mode-btn-subtitle">Shareable QR link & preview</div>
    </div>
    <v-icon size="16" class="mode-btn-chevron">mdi-chevron-right</v-icon>
  </button>
</div>
```

---

## 4. Icon Registration in `frontend/src/plugins/icons.js`

### 4.1 Observations & Mechanism
- Vuetify icon resolution (`frontend/src/plugins/vuetify.js`):
  ```javascript
  const resolveMdiSvgIcon = (icon) => {
    if (typeof icon !== "string") return icon;
    if (icon.startsWith("svg:")) return icon.slice(4);
    return iconMap[icon] ?? iconMap["mdi-help-circle-outline"] ?? "";
  };
  ```
- Because `frontend/src/plugins/icons.js` does NOT currently import `mdiQrcode` or `mdiQrcodeScan`, any `<v-icon icon="mdi-qrcode">` falls back to `mdi-help-circle-outline`.
- Both `mdiQrcode` and `mdiQrcodeScan` are verified to exist in `@mdi/js` (tested via Node.js).

### 4.2 Required Registration
1. In `frontend/src/plugins/icons.js` imports:
   ```javascript
   import {
     ...
     mdiPlusCircleOutline,
     mdiQrcode,
     mdiQrcodeScan,
     mdiRefresh,
     ...
   } from "@mdi/js";
   ```
2. In `export const iconMap = { ... }`:
   ```javascript
   "mdi-qrcode": mdiQrcode,
   "mdi-qrcode-scan": mdiQrcodeScan,
   ```

---

## 5. Architectural Blueprint for `frontend/src/pages/Projects/PdfQrPage.vue`

### 5.1 Visual Shell & Layout Specification
To ensure seamless visual integration with `ImgPdfPage.vue` and `PdfImgPage.vue`, `PdfQrPage.vue` adopts the exact visual shell hierarchy:
```
.tool-page
└── Alerts (v-model="alertVisible")
└── v-container.py-8.py-md-12
    └── v-row(density="comfortable", align="start")
        ├── Left Sidebar: v-col(cols="12", md="4", lg="3")
        │   ├── v-card.tool-shell.p-5(rounded="xl", elevation="0")
        │   │   ├── .studio-mode-nav (Conversion Mode Chip: "PDF → QR")
        │   │   ├── .mode-list-container (3 buttons; button 3 is .is-active)
        │   │   ├── input[type=file, ref=fileInput] (hidden file selector)
        │   │   ├── .compact-upload-bar (shown when PDF loaded)
        │   │   ├── v-btn "Change PDF Document" (mdi-swap-horizontal)
        │   │   ├── .progress-shell (v-progress-linear when uploading)
        │   │   └── .studio-stats (2x2 grid: Size, Retention, Scannability, Status)
        │   └── v-card.tool-shell.control-panel.p-5.mt-4(v-if="uploadedDoc")
        │       ├── Header: "Production Tools" / "QR Customizer" (mdi-tune-vertical)
        │       ├── Contrast Evaluation Chip & Warning Alert (if CR < 3.0:1)
        │       ├── Color Selectors (Foreground & Background color presets + custom hex)
        │       ├── Size Slider (200px to 800px)
        │       ├── Center Logo Option (None vs Protected Studio Badge)
        │       └── v-btn "Reset to Defaults" (mdi-refresh)
        │
        └── Right Workspace: v-col(cols="12", md="8", lg="9")
            ├── Empty State: v-card.tool-shell.p-6.p-md-8(v-if="!uploadedDoc")
            │   ├── Title: "Generate Scannable PDF QR Code"
            │   ├── v-sheet.upload-zone.upload-zone-lg (drag & drop zone)
            │   │   ├── Icon: mdi-cloud-upload-outline (size 80)
            │   │   ├── Heading & instruction text
            │   │   ├── Feature chips (24h Retention, Error Correction H, Vector SVG)
            │   │   └── v-btn "Choose PDF File" (mdi-file-pdf-box)
            │   └── v-progress-linear upload indicator
            │
            └── Active State: v-card.tool-shell.p-6.p-md-8(v-else)
                ├── Workspace Header (Document Title, Public Link Badge, Delete Action)
                └── Responsive 2-Column Display:
                    ├── Sub-column 1: In-Tool PDF Page 1 Preview Canvas (pdfjs-dist)
                    └── Sub-column 2: Live QR Display & Sharing Actions
                        ├── QR Canvas Frame (rendered canvas with error correction 'H')
                        ├── Public Link Copy Box (readonly input + Copy button)
                        ├── Export Buttons (PNG standard, High-Res PNG 2000px, SVG vector)
                        └── Delete Confirmation Dialog
```

### 5.2 Responsive Breakpoints & Tokens
- Mobile (`cols="12"`): Left sidebar stacks on top of the workspace.
- Desktop (`md="4" lg="3"` vs `md="8" lg="9"`): Exact 12-column total matching `ImgPdfPage.vue` and `PdfImgPage.vue`.
- Design Tokens: Uses `--portfolio-primary` (`#7C0E44`), `--portfolio-secondary` (`#AA5E7A`), `--portfolio-bg` (`#F2DACE`), `--portfolio-surface` (`#FFFFFF`), and `--portfolio-panel-highlight` (`rgba(255, 255, 255, 0.92)`).

### 5.3 Client-Side Validation Rules
Must strictly enforce the specifications in `TEST_INFRA.md § F1`:
1. Reject `null` or empty file selection.
2. Accept files with MIME type `application/pdf` OR lowercase/uppercase `.pdf` extension.
3. Reject files exceeding 10 MB limit (`10 * 1024 * 1024 = 10,485,760` bytes) with clear user alert.
4. Reject 0-byte empty files.

### 5.4 Backend API Integration
- `POST /api/pdf/upload`: Multipart upload with `FormData.append("file", file)`. Tracks upload progress via `axios` or `XMLHttpRequest.upload.onprogress`.
- `DELETE /api/pdf/{id}`: Deletes file from backend and invalidates public landing route `/v/{id}`.
- Base URL obtained via `@/utils/apiBaseUrl.js: getApiBaseUrl()`.

### 5.5 QR Generation Engine
- Engine: `qrcode` package with error correction level `'H'` (30% error recovery).
- Color Customization: `{ color: { dark: fgColor, light: bgColor } }`.
- Contrast Engine: Real-time evaluation via WCAG 2.1 relative luminance ($CR = \frac{L_1 + 0.05}{L_2 + 0.05}$). If $CR < 3.0:1$, displays a warning alert notifying user that mobile cameras may fail to scan.
- Center Logo Badge: When enabled, draws a protective circular/rounded white badge in the center of the canvas ($\le 25\%$ of QR dimension) and renders the logo glyph inside.
- Multi-Format Export:
  - Standard PNG: Export canvas blob via `canvas.toBlob()`.
  - High-Resolution PNG: Re-render at 2000x2000px offscreen canvas and export.
  - Vector SVG: Generate standalone SVG via `QRCode.toString(url, { type: 'svg', ... })`.

---

## 6. Implementation Reference Template for `PdfQrPage.vue`

```vue
<script setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import QRCode from "qrcode";
import Alerts from "@/components/Alerts.vue";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import {
  calculateContrastRatio,
  evaluateQrScannability,
  validateClientPdf,
  formatFileSize,
  truncateFilename,
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

// Alert State
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type;
  alertVisible.value = true;
};

// Upload & Document State
const fileInput = ref(null);
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref("");
const uploadedDoc = ref(null); // { id, filename, size, url, expires_at }
const deleteDialogOpen = ref(false);
const isDeleting = ref(false);
const copySuccess = ref(false);

// PDF Page 1 Preview State
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
const qrSettings = reactive({
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  size: 320,
  includeLogo: false,
});

const DEFAULT_QR_SETTINGS = {
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  size: 320,
  includeLogo: false,
};

const COLOR_PRESETS = [
  { name: "Monochrome Black", fg: "#000000", bg: "#FFFFFF" },
  { name: "Brand Burgundy", fg: "#7C0E44", bg: "#FFFFFF" },
  { name: "Warm Portfolio", fg: "#7C0E44", bg: "#F2DACE" },
  { name: "Dark Navy", fg: "#0F172A", bg: "#FAF3F0" },
  { name: "High Contrast Inverted", fg: "#FFFFFF", bg: "#111827" },
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

const resetQrDefaults = () => {
  qrSettings.fgColor = DEFAULT_QR_SETTINGS.fgColor;
  qrSettings.bgColor = DEFAULT_QR_SETTINGS.bgColor;
  qrSettings.size = DEFAULT_QR_SETTINGS.size;
  qrSettings.includeLogo = DEFAULT_QR_SETTINGS.includeLogo;
  renderQrCode();
  showAlert("QR settings restored to defaults.", "info");
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

const processUpload = async (file) => {
  const validation = validateClientPdf(file);
  if (!validation.valid) {
    showAlert(validation.error, "error");
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 10;
  uploadStatus.value = "Preparing upload...";

  try {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (evt) => {
        if (evt.lengthComputable) {
          uploadProgress.value = Math.min(90, Math.round((evt.loaded / evt.total) * 100));
          uploadStatus.value = `Uploading PDF (${uploadProgress.value}%)...`;
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let errMsg = "Upload failed.";
          try {
            const errJson = JSON.parse(xhr.responseText);
            errMsg = errJson.detail || errMsg;
          } catch {}
          reject(new Error(errMsg));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error during upload.")));
      xhr.open("POST", `${getApiBaseUrl()}/api/pdf/upload`);
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

    showAlert("PDF uploaded successfully. QR code ready!", "success");

    // Render Preview & QR
    await Promise.all([renderPdfPreview(file), renderQrCode()]);
  } catch (err) {
    showAlert(err.message || "Failed to upload PDF.", "error");
  } finally {
    isUploading.value = false;
  }
};

// Render In-Tool PDF Page 1 Preview
const renderPdfPreview = async (file) => {
  try {
    const pdfjsLib = await loadPdfLib();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    if (pdfCanvasRef.value) {
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = pdfCanvasRef.value;
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
    }
  } catch (e) {
    console.warn("Could not render PDF preview canvas:", e);
  }
};

// Render QR Code onto Canvas
const renderQrCode = async () => {
  if (!publicUrl.value || !qrCanvasRef.value) return;

  const canvas = qrCanvasRef.value;
  await QRCode.toCanvas(canvas, publicUrl.value, {
    errorCorrectionLevel: "H",
    margin: 2,
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
    const logoSize = Math.floor(canvas.width * 0.22); // <= 25% area bound
    const half = logoSize / 2;

    // Draw white protective circular badge
    ctx.beginPath();
    ctx.arc(center, center, half + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = qrSettings.fgColor;
    ctx.stroke();

    // Render badge icon / text
    ctx.fillStyle = qrSettings.fgColor;
    ctx.font = `bold ${Math.floor(logoSize * 0.5)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PDF", center, center);
  }
};

watch(
  () => [qrSettings.fgColor, qrSettings.bgColor, qrSettings.size, qrSettings.includeLogo],
  () => renderQrCode(),
);

// Copy Link Action
const copyPublicLink = async () => {
  if (!publicUrl.value) return;
  try {
    await navigator.clipboard.writeText(publicUrl.value);
    copySuccess.value = true;
    showAlert("Public link copied to clipboard!", "success");
    setTimeout(() => (copySuccess.value = false), 2500);
  } catch {
    showAlert("Failed to copy link to clipboard.", "error");
  }
};

// Deletion Workflow
const confirmDeleteDocument = async () => {
  if (!uploadedDoc.value?.id) return;
  isDeleting.value = true;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/pdf/${uploadedDoc.value.id}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 404) {
      throw new Error("Deletion failed on server.");
    }
    uploadedDoc.value = null;
    deleteDialogOpen.value = false;
    showAlert("Document deleted and public QR link invalidated.", "success");
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
  link.download = `qr-${uploadedDoc.value?.id || "code"}.png`;
  link.href = qrCanvasRef.value.toDataURL("image/png");
  link.click();
};

const downloadPngHighRes = async () => {
  if (!publicUrl.value) return;
  const offscreen = document.createElement("canvas");
  await QRCode.toCanvas(offscreen, publicUrl.value, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 2000,
    color: {
      dark: qrSettings.fgColor,
      light: qrSettings.bgColor,
    },
  });
  const link = document.createElement("a");
  link.download = `qr-${uploadedDoc.value?.id || "code"}-2000px.png`;
  link.href = offscreen.toDataURL("image/png");
  link.click();
};

const downloadSvg = async () => {
  if (!publicUrl.value) return;
  const svgString = await QRCode.toString(publicUrl.value, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark: qrSettings.fgColor,
      light: qrSettings.bgColor,
    },
  });
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `qr-${uploadedDoc.value?.id || "code"}.svg`;
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
        <!-- Left Sidebar: Mode Navigation & QR Customizer Panel -->
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

            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept="application/pdf"
              @change="handleFileSelect"
              class="d-none"
            />

            <!-- Loaded Document Info -->
            <template v-if="uploadedDoc">
              <div class="compact-upload-bar d-flex align-center justify-space-between p-3 rounded-lg mb-3">
                <div class="d-flex align-center ga-2 min-w-0">
                  <v-icon color="primary" size="22">mdi-file-pdf-box</v-icon>
                  <div class="min-w-0">
                    <div class="text-body-2 font-weight-bold text-truncate">{{ uploadedDoc.filename }}</div>
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

            <!-- Contrast Scannability Warning Banner -->
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

            <!-- Color Palette Presets -->
            <div class="control-grid mb-3">
              <span class="control-label">Quick Themes</span>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="p in COLOR_PRESETS"
                  :key="p.name"
                  size="x-small"
                  variant="outlined"
                  class="cursor-pointer"
                  @click="qrSettings.fgColor = p.fg; qrSettings.bgColor = p.bg;"
                >
                  {{ p.name }}
                </v-chip>
              </div>
            </div>

            <!-- Foreground & Background Colors -->
            <div class="control-grid mb-3">
              <v-text-field
                v-model="qrSettings.fgColor"
                label="Dark Module Color"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prepend-inner-icon="mdi-pencil-outline"
                hide-details
              />
              <v-text-field
                v-model="qrSettings.bgColor"
                label="Light Module Color"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prepend-inner-icon="mdi-pencil-outline"
                hide-details
                class="mt-2"
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

            <!-- Optional Center Logo Badge -->
            <div class="mt-4">
              <v-switch
                v-model="qrSettings.includeLogo"
                label="Center Logo Badge"
                color="primary"
                hide-details
                density="compact"
              />
            </div>

            <!-- Reset to Defaults Button -->
            <v-btn
              block
              variant="outlined"
              color="primary"
              rounded="lg"
              prepend-icon="mdi-refresh"
              class="text-none font-weight-bold mt-4"
              @click="resetQrDefaults"
            >
              Reset to Defaults
            </v-btn>
          </v-card>
        </v-col>

        <!-- Right Main Workspace -->
        <v-col cols="12" md="8" lg="9">
          <!-- Upload Dropzone (shown when no document is uploaded) -->
          <v-card v-if="!uploadedDoc" class="tool-shell p-6 p-md-8" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-6">
              <div>
                <h2 class="text-h5 font-weight-bold my-0">Drop your PDF here</h2>
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
                <div class="text-body-1 text-medium-emphasis">or click anywhere in this container to browse (up to 10 MB)</div>

                <div class="d-flex flex-wrap justify-center ga-2 mt-2">
                  <span class="feature-chip">24h Auto-Retention</span>
                  <span class="feature-chip">Level 'H' Error Correction</span>
                  <span class="feature-chip">Vector SVG & High-Res PNG</span>
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
                <span class="text-body-2">{{ uploadStatus }}</span>
                <span class="text-caption">{{ uploadProgress }}%</span>
              </div>
              <v-progress-linear :model-value="uploadProgress" color="primary" rounded height="8" />
            </div>
          </v-card>

          <!-- Active Workspace (shown once PDF is uploaded) -->
          <v-card v-else class="tool-shell p-6 p-md-8" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
              <div>
                <h2 class="text-h5 font-weight-bold my-0">{{ uploadedDoc.filename }}</h2>
                <span class="text-caption text-medium-emphasis">Expires in 24 hours • Public URL active</span>
              </div>
              <div class="d-flex align-center ga-2">
                <v-btn
                  variant="outlined"
                  color="primary"
                  rounded="lg"
                  prepend-icon="mdi-open-in-new"
                  class="text-none"
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

            <!-- Two-Column Preview & QR Sharing Display -->
            <v-row density="comfortable">
              <!-- Left Sub-column: PDF Page 1 Preview -->
              <v-col cols="12" md="6">
                <div class="subpanel-shell p-4 rounded-xl">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-2 font-weight-bold">Document Preview (Page 1)</span>
                    <v-chip size="x-small" color="primary" variant="tonal">Page 1</v-chip>
                  </div>
                  <div class="canvas-wrapper d-flex align-center justify-center p-2 rounded-lg">
                    <canvas ref="pdfCanvasRef" class="pdf-preview-canvas" />
                  </div>
                </div>
              </v-col>

              <!-- Right Sub-column: Scannable QR Code & Sharing Actions -->
              <v-col cols="12" md="6">
                <div class="subpanel-shell p-4 rounded-xl d-flex flex-column align-center">
                  <div class="w-100 d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-2 font-weight-bold">Live Scannable QR Code</span>
                    <v-chip
                      size="x-small"
                      :color="contrastEvaluation.isWarning ? 'warning' : 'success'"
                      variant="tonal"
                    >
                      {{ contrastEvaluation.ratio }}:1 Ratio
                    </v-chip>
                  </div>

                  <div class="qr-canvas-wrapper d-flex align-center justify-center p-4 rounded-xl mb-4">
                    <canvas ref="qrCanvasRef" class="qr-preview-canvas" />
                  </div>

                  <!-- Public Sharing URL Box -->
                  <div class="w-100 copy-link-box p-2 rounded-lg d-flex align-center justify-space-between ga-2 mb-4">
                    <span class="text-caption text-truncate ml-2">{{ publicUrl }}</span>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="flat"
                      rounded="lg"
                      prepend-icon="mdi-content-copy"
                      class="text-none font-weight-bold flex-shrink-0"
                      @click="copyPublicLink"
                    >
                      {{ copySuccess ? "Copied!" : "Copy Link" }}
                    </v-btn>
                  </div>

                  <!-- Download Buttons -->
                  <div class="w-100 d-flex flex-column ga-2">
                    <div class="d-flex ga-2">
                      <v-btn
                        block
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
                        block
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
      <v-card rounded="xl" class="p-6">
        <h3 class="text-h6 font-weight-bold mb-2">Delete Uploaded Document?</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          This will permanently delete the PDF document from storage and immediately invalidate the public QR link. Anyone scanning the QR code will receive a 404 Not Found error.
        </p>
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" rounded="lg" @click="deleteDialogOpen = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="lg"
            :loading="isDeleting"
            @click="confirmDeleteDocument"
          >
            Confirm Delete
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

.subpanel-shell {
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.5);
}

.canvas-wrapper {
  background: #f7f3ea;
  border: 1px solid rgba(124, 14, 68, 0.1);
  min-height: 340px;
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
```

---

## 7. Contrast Utility Module Specification (`frontend/src/utils/qrContrast.js`)

```javascript
/**
 * frontend/src/utils/qrContrast.js
 * WCAG 2.1 Contrast Calculation & Validation Helpers for QR Customizer
 */

export function parseHexColor(hex) {
  let clean = String(hex || "").trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function getRelativeLuminance({ r, g, b }) {
  const normalize = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = normalize(r);
  const G = normalize(g);
  const B = normalize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function calculateContrastRatio(color1Hex, color2Hex) {
  const rgb1 = parseHexColor(color1Hex);
  const rgb2 = parseHexColor(color2Hex);
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function evaluateQrScannability(fgHex, bgHex) {
  try {
    const ratio = calculateContrastRatio(fgHex, bgHex);
    return {
      ratio,
      isOptimal: ratio >= 4.5,
      isAcceptable: ratio >= 3.0 && ratio < 4.5,
      isWarning: ratio < 3.0,
      warningMessage:
        ratio < 3.0
          ? "Low contrast may cause QR scanning failures on mobile devices."
          : null,
    };
  } catch {
    return {
      ratio: 1.0,
      isOptimal: false,
      isAcceptable: false,
      isWarning: true,
      warningMessage: "Invalid color format. Please check hex values.",
    };
  }
}

export function validateClientPdf(file) {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }
  const isPdfMime = file.type === "application/pdf";
  const hasPdfExt =
    typeof file.name === "string" && file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfMime && !hasPdfExt) {
    return { valid: false, error: "Please upload a valid PDF document." };
  }
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds 10 MB limit." };
  }
  if (file.size === 0) {
    return { valid: false, error: "File is empty (0 bytes)." };
  }
  return { valid: true, error: null };
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function truncateFilename(filename, maxLength = 30) {
  if (!filename || filename.length <= maxLength) return filename;
  const ext =
    filename.lastIndexOf(".") !== -1
      ? filename.slice(filename.lastIndexOf("."))
      : "";
  const base = filename.slice(0, filename.length - ext.length);
  if (base.length <= maxLength - ext.length - 3) return filename;
  return base.slice(0, maxLength - ext.length - 3) + "..." + ext;
}
```
