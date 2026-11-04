# Frontend Survey Analysis: PDF to QR Code Generator Integration

**Author**: Explorer 1 (Frontend Survey Explorer)  
**Date**: 2026-11-04  
**Target Workspace**: `c:\Users\laksh\Documents\GitHub\LakshSolanki\frontend`  
**Reference Request**: `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

This survey analyzes the existing frontend architecture in the `pdfimagestudio` workspace within the `LakshSolanki` monorepo. The objective is to design the integration of a new **PDF to QR Code Generator** tool mode into `PdfImageStudio.vue` and establish a dedicated public landing page for previewing and downloading shared PDFs.

The frontend is a modern **Vue 3 (v3.5.38)** single-page application built with **Vite (v8.0.16)**, **Vuetify (v4.1.2)**, and **Vue Router (v5.1.0)**. It does **not** use Tailwind CSS; styling is composed of Vuetify components, global design system tokens (`frontend/src/assets/main.css`), and scoped CSS. The current `PdfImageStudio.vue` component acts as a lightweight router/container switching between `ImgPdfPage.vue` (Image to PDF) and `PdfImgPage.vue` (PDF to Image) using `provide/inject` and `<keep-alive>`.

The investigation confirms that a new tool mode `pdf-to-qr` can be cleanly introduced as a peer component (`PdfQrPage.vue`) alongside a dedicated public landing page (`PdfSharePreview.vue`) without regressions or breaking changes to existing tools.

---

## 2. Workspace & Project Structure

### 2.1 Monorepo Layout
```
c:\Users\laksh\Documents\GitHub\LakshSolanki\
├── backend/                  # Python FastAPI + MongoDB backend
│   ├── app/
│   │   ├── main.py           # FastAPI routes & endpoints
│   │   ├── database.py       # MongoDB client with in-memory fallback
│   │   └── repositories.py   # Data repositories
│   └── requirements.txt
├── frontend/                 # Vue 3 SPA
│   ├── package.json          # Dependencies & build scripts
│   ├── vite.config.mjs       # Vite configuration & chunk splitting
│   ├── render.yaml           # Deployment rewrite rules (/* -> /index.html)
│   ├── scripts/
│   │   └── create-spa-route-pages.mjs  # Static SPA route generator for post-build
│   └── src/
│       ├── assets/
│       │   ├── main.css      # Design tokens, variables & typography
│       │   └── vuetify-spacing-compat.css
│       ├── components/
│       │   ├── Alerts.vue    # Snackbar notification banner
│       │   ├── PhotoZoomDialog.vue # Pan/zoom modal preview
│       │   ├── AppHeader.vue
│       │   └── AppFooter.vue
│       ├── pages/
│       │   ├── ProjectsPage.vue
│       │   └── Projects/
│       │       ├── PdfImageStudio.vue  # Main studio wrapper (54 lines)
│       │       ├── ImgPdfPage.vue      # Tool 1: Image to PDF (1660 lines)
│       │       └── PdfImgPage.vue      # Tool 2: PDF to Image (1520 lines)
│       ├── plugins/
│       │   ├── vuetify.js    # Vuetify setup, theme colors, MDI SVG compat
│       │   └── icons.js      # Explicit tree-shaken MDI icon registry
│       ├── router/
│       │   └── index.js      # Vue router definition
│       └── utils/
│           └── apiBaseUrl.js # Dynamic backend URL resolution
```

### 2.2 Key Dependencies (`frontend/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `vue` | `^3.5.38` | Core framework (Composition API, `<script setup>`) |
| `vite` | `^8.0.16` | Fast development server & ESBuild/Rollup bundler |
| `vuetify` | `^4.1.2` | Material Design UI component system |
| `@mdi/js` | `^7.4.47` | Material Design Icons SVG paths |
| `vue-router` | `^5.1.0` | Client-side routing with query param navigation |
| `pdfjs-dist` | `^5.7.284` | Client-side PDF parsing and rendering |
| `jspdf` | `^4.2.1` | Client-side PDF generation |
| `jszip` & `file-saver` | `^3.10.1`, `^2.0.5` | Zip bundling and file downloads |
| `unplugin-fonts` | `^2.0.0` | Self-hosted typography (Space Grotesk, Manrope, Roboto, JetBrains Mono) |

### 2.3 Router Configuration & Build Pipeline
- **Router Configuration (`frontend/src/router/index.js`)**:
  - `PdfImageStudio.vue` is mapped at lines 30–35:
    ```javascript
    {
      path: "pdf-image-studio",
      name: "PdfImageStudio",
      component: () => import("@/pages/Projects/PdfImageStudio.vue"),
      meta: { title: "LakshSolanki | PDF & Image Studio" },
    }
    ```
  - Redirect shortcuts exist at lines 36–43:
    ```javascript
    {
      path: "img-pdf",
      redirect: "/projects/pdf-image-studio?mode=img-to-pdf",
    },
    {
      path: "pdf-img",
      redirect: "/projects/pdf-image-studio?mode=pdf-to-img",
    }
    ```
- **Static SPA Page Generation (`frontend/scripts/create-spa-route-pages.mjs`)**:
  - Ran after `vite build` to generate static fallback `index.html` files for static hosts:
    ```javascript
    const spaRoutes = [
      ...
      "/projects/pdf-image-studio",
      "/projects/img-pdf",
      "/projects/pdf-img",
      ...
    ];
    ```
  - *Observation*: Any new top-level or static route (e.g. `/projects/pdf-qr` shortcut and `/share/pdf` public page) must be registered in `create-spa-route-pages.mjs` to prevent 404s on static hosting.

---

## 3. `PdfImageStudio.vue` Architecture & Patterns

### 3.1 Current Implementation (`frontend/src/pages/Projects/PdfImageStudio.vue`)
The component is 54 lines and acts as a tab orchestrator:
```vue
<script setup>
import { provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ImgPdfPage from "./ImgPdfPage.vue";
import PdfImgPage from "./PdfImgPage.vue";

const route = useRoute();
const router = useRouter();

const activeTab = ref(
  route.query.mode === "pdf-to-img" ? "pdf-to-img" : "img-to-pdf",
);

watch(
  () => route.query.mode,
  (newMode) => {
    if (newMode === "pdf-to-img" || newMode === "img-to-pdf") {
      activeTab.value = newMode;
    }
  },
);

const switchTab = (tab) => {
  activeTab.value = tab;
  router.replace({
    query: {
      ...route.query,
      mode: tab,
    },
  });
};

provide("studioMode", {
  activeTab,
  switchTab,
});
</script>

<template>
  <div class="pdf-image-studio">
    <!-- Active Tool View with state preservation -->
    <keep-alive>
      <component :is="activeTab === 'img-to-pdf' ? ImgPdfPage : PdfImgPage" />
    </keep-alive>
  </div>
</template>
```

### 3.2 State Preservation
- `<keep-alive>` is wrapped around `<component :is="..." />`, allowing users to switch tabs without losing in-progress files, configuration settings, or previews.
- Each sub-page injects `studioMode`:
  ```javascript
  const studioMode = inject("studioMode", null);
  const switchTab = (tab) => {
    if (studioMode?.switchTab) {
      studioMode.switchTab(tab);
    } else {
      router.replace({ query: { ...route.query, mode: tab } });
    }
  };
  ```

### 3.3 Navigation Sidebar Redundancy & Opportunity
- Currently, both `ImgPdfPage.vue` (lines 705–735) and `PdfImgPage.vue` (lines 585–615) duplicate the identical HTML and scoped CSS for `.studio-mode-nav` in their left sidebar.
- Each sidebar item is an HTML `<button type="button" class="mode-list-btn">` with an icon, title, subtitle, and chevron/check icon.
- When introducing `pdf-to-qr`, this navigation block can either be shared as a reusable component (e.g. `StudioModeNav.vue`) or added consistently to `ImgPdfPage.vue`, `PdfImgPage.vue`, and the new `PdfQrPage.vue`.

---

## 4. UI/UX, Design System & Layout Conventions

### 4.1 Color Palette & Theme Tokens
From `frontend/src/plugins/vuetify.js` (lines 55–77) and `frontend/src/assets/main.css` (lines 1–35):
- **Primary**: `#7C0E44` (Deep Plum / Burgundy)
- **Secondary**: `#AA5E7A` (Muted Rose / Plum)
- **Accent**: `#D49A9A` (Dusty Pink)
- **Background**: `#F2DACE` (Warm Beige / Biscuit)
- **Surface**: `#FFFFFF` (Pure White)
- **Surface Soft**: `#FAF3F0` (Off-white / Warm Canvas)
- **Ink / Text**: `#231219` (Near Black / Dark Plum)
- **Muted Ink**: `#7E636E` (Muted Purple-Gray)
- **Error**: `#A81D37` (Crimson Red)
- **Borders**: `rgba(124, 14, 68, 0.12)` (Subtle plum border)

### 4.2 Typography
- Headings: `Space Grotesk`, sans-serif (`font-weight: 700`)
- Body: `Manrope`, sans-serif (`font-weight: 400, 600`)
- Monospace / Stats: `JetBrains Mono`

### 4.3 Layout Grid
Both existing tools use a standardized 2-column responsive layout:
```html
<v-container class="py-8 py-md-12">
  <v-row density="comfortable" align="start">
    <!-- Left Column: Navigation & Control Cards -->
    <v-col cols="12" md="4" lg="3">
      <v-card class="tool-shell p-5" rounded="xl" elevation="0">
        <!-- Studio Mode Nav -->
        <!-- Loaded File Summary / Action Buttons -->
      </v-card>
      
      <!-- Control Panel (Options, Sliders, Swatches) -->
      <v-card class="tool-shell control-panel p-5 mt-4" rounded="xl" elevation="0">
        ...
      </v-card>
    </v-col>

    <!-- Right Column: Dropzone OR Workspace Preview Grid -->
    <v-col cols="12" md="8" lg="9">
      <!-- Big Upload Dropzone (When no file selected) -->
      <v-card v-if="!file" class="tool-shell p-6 p-md-8" rounded="xl" elevation="0">
        <v-sheet class="upload-zone upload-zone-lg" rounded="xl" border ...>
          ...
        </v-sheet>
      </v-card>

      <!-- Active Workspace (When file is loaded) -->
      <transition name="slide-up">
        <div v-if="file">
          <v-card class="tool-shell p-4 p-md-5" rounded="xl" elevation="0">
            ...
          </v-card>
        </div>
      </transition>
    </v-col>
  </v-row>
</v-container>
```

### 4.4 Responsive Viewport Behavior
- **Mobile (`< 600px` / `xs`)**:
  - `cols="12"` causes left sidebar to stack neatly above the main workspace.
  - Dropzone minimum height decreases from `440px` to `340px`.
  - Padding scales down via clamp: `padding-left: clamp(12px, 1.8vw, 24px)`.
- **Tablet (`md`: 600px–960px)**:
  - Sidebar is `cols="4"`, workspace is `cols="8"`.
- **Desktop (`lg`: > 960px)**:
  - Sidebar is `cols="3"`, workspace is `cols="9"`.

---

## 5. Component Patterns Analysis

### 5.1 Drag-and-Drop File Upload Pattern
Found in `PdfImgPage.vue` (lines 819–851, 202–213):
- **Template**:
  ```html
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
      <div class="d-flex flex-wrap justify-center ga-2 mt-2">
        <span class="feature-chip">PDF Document</span>
        <span class="feature-chip">Instant QR</span>
        <span class="feature-chip">Custom Styles</span>
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
  <input ref="fileInput" type="file" accept="application/pdf" @change="handleFileSelect" class="d-none" />
  ```
- **Lifecycle Protection**:
  ```javascript
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
  ```
- **CSS Styling (`.upload-zone`)**:
  ```css
  .upload-zone {
    border: 3px dashed rgba(124, 14, 68, 0.35) !important;
    background: rgba(124, 14, 68, 0.08) !important;
    padding: 36px 22px;
    cursor: pointer;
    transition: transform 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
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
  ```

### 5.2 PDF Loading & Thumbnail Rendering Pattern
`pdfjs-dist` is already installed and bundled in `pdf-tools` chunk.
From `PdfImgPage.vue` (lines 109–120, 223–272):
```javascript
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
```
Rendering page 1 as thumbnail:
```javascript
const renderPdfThumbnail = async (file) => {
  const pdfjsLib = await loadPdfLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return {
    thumbnailUrl: canvas.toDataURL("image/png"),
    pageCount: pdf.numPages,
  };
};
```

### 5.3 Notifications & Error Banners Pattern (`Alerts.vue`)
- Component: `@/components/Alerts.vue`
- Uses `<v-snackbar>` positioned `bottom center`:
  ```vue
  <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />
  ```
- Controller methods:
  ```javascript
  const showAlert = (message, type = "success") => {
    alertMessage.value = message;
    alertType.value = type === "error" ? "error" : "success";
    alertVisible.value = true;
  };
  ```

### 5.4 Progress Reporting Pattern
From `PdfImgPage.vue` lines 653–660:
```html
<div v-if="isUploading || isProcessing" class="progress-shell mt-4">
  <div class="d-flex justify-space-between align-center mb-2">
    <span class="text-body-2">{{ progressStatus }}</span>
    <span class="text-caption">{{ progressPercent }}%</span>
  </div>
  <v-progress-linear :model-value="progressPercent" color="primary" rounded height="8"></v-progress-linear>
</div>
```

### 5.5 Action Buttons Pattern
- Primary action: `<v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-download" class="text-none font-weight-bold">`
- Secondary action: `<v-btn color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-content-copy" class="text-none font-weight-bold">`
- Destructive action: `<v-btn color="error" variant="tonal" rounded="lg" prepend-icon="mdi-delete-outline" class="text-none font-weight-bold">`

### 5.6 Color Swatches Pattern
From `ImgPdfPage.vue` (lines 869–885, 1441–1469):
```html
<div class="swatch-row">
  <button
    v-for="swatch in swatches"
    :key="swatch.value"
    type="button"
    :class="['swatch-btn', { 'is-active': activeColor === swatch.value }]"
    :style="{ backgroundColor: swatch.value }"
    @click="activeColor = swatch.value"
  ></button>
</div>
```

---

## 6. Integration Points for "PDF to QR Code" Tool Mode

### 6.1 Component Architecture Map
```
frontend/src/
├── pages/
│   ├── Projects/
│   │   ├── PdfImageStudio.vue   [EDIT: support mode="pdf-to-qr", import PdfQrPage]
│   │   ├── ImgPdfPage.vue       [EDIT: add 'PDF to QR' button to sidebar nav]
│   │   ├── PdfImgPage.vue       [EDIT: add 'PDF to QR' button to sidebar nav]
│   │   ├── PdfQrPage.vue        [NEW: Tool mode 3 component]
│   │   └── PdfSharePreview.vue  [NEW: Public landing page for preview & download]
│   └── ProjectsPage.vue         [OPTIONAL: add "PDF to QR" tag to Studio card]
├── plugins/
│   └── icons.js                 [EDIT: register mdiQrcode, mdiQrcodeScan, etc.]
├── router/
│   └── index.js                 [EDIT: add route for /share/pdf/:id & redirect /projects/pdf-qr]
└── scripts/
    └── create-spa-route-pages.mjs [EDIT: add /projects/pdf-qr and /share/pdf to spaRoutes]
```

### 6.2 Detailed Integration Specifications

#### A. `PdfImageStudio.vue` Modifications
- **Query Mode**: Allow `route.query.mode === "pdf-to-qr"`.
- **Component Resolution**:
  ```javascript
  const activeComponent = computed(() => {
    switch (activeTab.value) {
      case "pdf-to-img":
        return PdfImgPage;
      case "pdf-to-qr":
        return PdfQrPage;
      case "img-to-pdf":
      default:
        return ImgPdfPage;
    }
  });
  ```
- **Tab Watcher**:
  ```javascript
  watch(
    () => route.query.mode,
    (newMode) => {
      if (["pdf-to-img", "img-to-pdf", "pdf-to-qr"].includes(newMode)) {
        activeTab.value = newMode;
      }
    },
  );
  ```

#### B. Sidebar Navigation in all 3 Tools (`ImgPdfPage`, `PdfImgPage`, `PdfQrPage`)
Add button 3 into the `.mode-list-container`:
```html
<button
  type="button"
  class="mode-list-btn"
  :class="{ 'is-active': activeTab === 'pdf-to-qr' }"
  @click="switchTab('pdf-to-qr')"
>
  <div class="mode-btn-icon">
    <v-icon size="20">mdi-qrcode</v-icon>
  </div>
  <div class="mode-btn-content text-left">
    <div class="mode-btn-title">PDF to QR Code</div>
    <div class="mode-btn-subtitle">Upload & share scannable QR</div>
  </div>
  <v-icon size="16" class="mode-btn-chevron">{{ activeTab === 'pdf-to-qr' ? 'mdi-check' : 'mdi-chevron-right' }}</v-icon>
</button>
```

#### C. New Tool Component: `PdfQrPage.vue`
- **File Upload & Validation**:
  - Drag-and-drop zone with MIME check (`application/pdf`) and signature validation (checking for `%PDF-` header bytes `[0x25, 0x50, 0x44, 0x46, 0x2D]`).
  - Max size limit enforcement (e.g. 25MB) with clear alert: `"Selected PDF exceeds the 25MB limit."`
  - Client-side integrity verification via PDF.js before upload.
- **Backend API Integration**:
  - Uses `getApiBaseUrl()` from `@/utils/apiBaseUrl`.
  - Endpoint `POST /api/pdf/upload` (multipart `file`).
  - Response: `{ id: string, fileName: string, fileSize: number, publicUrl: string, createdAt: string }`.
  - Endpoint `DELETE /api/pdf/:id` for manual deletion/invalidation.
- **Scannable QR Code Generation**:
  - Install dependency: `qrcode` (pure JavaScript, works in browser, supports canvas, SVG, data URL).
  - High error correction level (`errorCorrectionLevel: 'H'`) to allow center logo placement while preserving reliable scannability.
  - Reactive customization options:
    - Foreground color (Preset swatches: `#000000`, `#7C0E44`, `#111827`, `#0F172A`, plus custom color picker).
    - Background color (Preset swatches: `#FFFFFF`, `#FAF3F0`, `#F2DACE`, `transparent`, plus custom color picker).
    - Size slider (256px to 1024px output resolution, CSS-responsive display).
    - Contrast validation warning if foreground and background contrast is below WCAG/ISO scanning thresholds.
    - Optional center logo: file picker for custom image or preset logo, rendered on a rounded white backing badge to ensure quiet zone clearance.
    - Reset-to-defaults button: reverts foreground to `#000000`, background to `#FFFFFF`, size to 360, clears logo.
  - Export capabilities:
    - Download PNG (`file-saver` or anchor download).
    - Download SVG (`QRCode.toString(publicUrl, { type: 'svg' })`).
- **File & Link Management**:
  - Copy Public Link button with clipboard write and fallback textarea execCommand.
  - Open public page in new tab (`target="_blank"`).
  - Delete File button with confirmation: removes from backend and local state.

#### D. Dedicated Public Landing Page: `PdfSharePreview.vue`
- Requirement R1 & R2: Dedicated web page on the site that previews the PDF and provides a download action.
- Route: `/share/pdf/:id`
- Features:
  - Fetches metadata and PDF binary from `GET /api/pdf/:id`.
  - Renders document preview using PDF.js (page 1 thumbnail + interactive page viewer / full-screen zoom via `PhotoZoomDialog`).
  - Metadata banner: Document Name, File Size, Upload Date, Expiration status.
  - Direct "Download Original PDF" button.
  - Graceful Not-Found / Expired state:
    - If PDF is deleted or missing, displays a polite alert card with `"Document Not Found or Has Expired"` and a button to return to the Studio.
  - Fully responsive across mobile and desktop.

#### E. Icon Registry (`frontend/src/plugins/icons.js`)
Currently `mdiQrcode` is missing from `icons.js`.
Add imports:
```javascript
import {
  ...
  mdiQrcode,
  mdiQrcodeScan,
  mdiLinkVariant,
  ...
} from "@mdi/js";
```
And add entries to `iconMap`:
```javascript
"mdi-qrcode": mdiQrcode,
"mdi-qrcode-scan": mdiQrcodeScan,
"mdi-link-variant": mdiLinkVariant,
```

#### F. Package Dependency
Run in `frontend`:
```bash
pnpm add qrcode
```

---

## 7. Risk Assessment & Verification Matrix

| Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|
| Icon missing in tree-shaken `icons.js` | UI displays fallback question mark icon | High if forgotten | Explicitly import `mdiQrcode` from `@mdi/js` and register in `iconMap`. |
| Static SPA 404 on deployment | Direct links to `/share/pdf/...` fail on refresh | Medium | Add `/share/pdf` and `/projects/pdf-qr` to `create-spa-route-pages.mjs`. Verify `render.yaml` wildcard rewrite. |
| QR Code scannability degraded by center logo or low contrast | QR code fails to scan on mobile devices | Medium | Use High error correction level (`'H'`), limit logo size to max 20% of QR dimensions, render a solid background badge behind logo, and enforce minimum color contrast. |
| State leakage between tabs | Settings or files from one mode affect another | Low | Isolate state inside `PdfQrPage.vue`. `<keep-alive>` keeps each component's local state independent. |
| Large PDF memory footprint | Browser tab lags or crashes on huge PDFs | Low | Validate file size before processing (<25MB). Render only page 1 for initial thumbnail preview rather than all pages. |
