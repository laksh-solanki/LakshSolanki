# Technical Analysis & Implementation Blueprint: Canvas-Based PDF Viewer

**Agent**: Explorer M2-2 (PDF Canvas Viewer Specialist)  
**Target File**: `frontend/src/pages/PdfLandingPage.vue`  
**Date**: 2026-11-04  
**Integrity Mode**: Development / Read-Only Exploration  

---

## 1. Executive Summary

This blueprint defines the architecture and exact implementation specifications for the high-performance, canvas-based PDF renderer in `frontend/src/pages/PdfLandingPage.vue`. The design addresses the five core requirements:
1. **Worker Pattern**: Adopts the established Vite dynamic import pattern (`import('pdfjs-dist/build/pdf')` and `pdf.worker.mjs?url`) matching `PdfImgPage.vue` without duplicating bundle weight across unrelated routes.
2. **Binary Buffer Loading**: Fetches document bytes via standard `fetch()`, handles HTTP status codes explicitly (404/410 vs network errors), and instantiates PDF documents via `pdfjsLib.getDocument({ data: uint8Array }).promise`.
3. **Responsive High-DPI Canvas Scaling**: Solves canvas pixelation on mobile smartphones and Retina/4K displays by computing `renderViewport = page.getViewport({ scale: baseScale * dpr })` while locking CSS styling dimensions `style.width = baseScale * unscaledWidth`, rendering laser-sharp typography at native hardware density.
4. **Pagination & Navigation**: Provides Previous/Next controls, direct numeric input with bounds clamping, keyboard shortcuts (`ArrowLeft`/`ArrowRight`/`PageUp`/`PageDown`), and safe render cancellation (`RenderingCancelledException`).
5. **Resilient Failure Fallback**: Intercepts worker failures, WebGL/canvas context failures, or corrupted streams, displaying an informative fallback card with direct download actions and new-tab browser viewing.

---

## 2. Core Architectural Decisions

### 2.1 Worker Loading & Vite Chunking
- `frontend/package.json` specifies `"pdfjs-dist": "^5.7.284"`.
- In `frontend/vite.config.mjs`, `manualChunks` routes `pdfjs-dist` to chunk `pdf-tools`.
- `PdfImgPage.vue` (lines 109-120) establishes the working pattern:
  ```javascript
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
  ```
- **Rationale**:
  1. Vite's `?url` query resolves the worker bundle directly from Vite's asset pipeline, eliminating path resolution mismatches between local dev server (`localhost:3000`) and production static hosting.
  2. Singleton caching (`pdfLibPromise`) ensures the 828 KB library and 2.16 MB worker chunk are loaded only once on demand, keeping initial portfolio bundle size minimal.

### 2.2 Binary Fetching vs URL Delegation
- Rather than passing a string URL to `pdfjsLib.getDocument({ url })`, the landing page executes:
  ```javascript
  const response = await fetch(`${getApiBaseUrl()}/api/pdf/${docId}`);
  if (!response.ok) {
    if (response.status === 404 || response.status === 410) {
      isNotFound.value = true;
      return;
    }
    throw new Error(`Failed to download PDF (${response.status} ${response.statusText})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDoc = await loadingTask.promise;
  ```
- **Rationale**:
  1. Guarantees clean detection of HTTP 404 / 410 (expired or deleted documents) before invoking PDF.js parser.
  2. Avoids CORS byte-range request complications across varying hosting providers.
  3. Preserves `uint8Array` in reactive memory so re-rendering pages or toggling zoom levels requires zero subsequent network calls.
  4. Allows reading `Content-Disposition` or `Content-Length` headers directly.

### 2.3 High-DPI (Retina / 4K / Smartphone) Mathematics
Standard `<canvas>` implementations specify `canvas.width = viewport.width` at 72 DPI (scale 1.0). On modern mobile smartphones (device pixel ratio `dpr = 2` or `3`) and macOS Retina screens, the browser upscales the bitmap via bilinear filtering, causing blurry text and fuzzy vectors.

To guarantee retina-sharp rendering:
$$\text{renderScale} = \text{baseScale} \times \text{dpr}$$
$$\text{canvas.width} = \lfloor \text{unscaledWidth} \times \text{renderScale} \rfloor$$
$$\text{canvas.height} = \lfloor \text{unscaledHeight} \times \text{renderScale} \rfloor$$
$$\text{canvas.style.width} = \lfloor \text{unscaledWidth} \times \text{baseScale} \rfloor + \text{"px"}$$
$$\text{canvas.style.height} = \lfloor \text{unscaledHeight} \times \text{baseScale} \rfloor + \text{"px"}$$

Where:
- `unscaledWidth` is derived from `page.getViewport({ scale: 1.0 }).width`.
- In **"fit"** mode:
  $$\text{availableWidth} = \max(\text{containerClientWidth} - 32\text{px}, 240\text{px})$$
  $$\text{baseScale} = \frac{\text{availableWidth}}{\text{unscaledWidth}}$$
- In **"100%"** mode: $\text{baseScale} = 1.0$.
- In **"150%"** mode: $\text{baseScale} = 1.5$.
- `renderViewport = page.getViewport({ scale: baseScale * dpr })`.
- Drawing call: `page.render({ canvasContext: ctx, viewport: renderViewport })`.

Because `renderViewport` embeds the `dpr` scaling factor in PDF.js's internal transform matrix, PDF.js renders vectors and glyphs at native physical resolution. The CSS `style.width` scales the element visually back to CSS pixels, producing razor-sharp results.

### 2.4 Cancellation Token & Re-entrance Protection
Rapid navigation (e.g., clicking "Next Page" three times quickly or resizing the browser window) can invoke `page.render()` while a prior render is still in flight on the same canvas. PDF.js strictly prohibits concurrent renders on one canvas and will throw an unhandled exception.

To handle this cleanly:
```javascript
let currentRenderTask = null;

const renderCurrentPage = async () => {
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel();
    } catch {
      // Ignore cancellation rejection
    }
    currentRenderTask = null;
  }

  isPageRendering.value = true;
  try {
    const page = await pdfDoc.getPage(currentPage.value);
    ...
    const renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
    currentRenderTask = renderTask;
    await renderTask.promise;
  } catch (err) {
    if (err?.name === "RenderingCancelledException") {
      // Intentional abort due to rapid user interaction; ignore silently
      return;
    }
    throw err;
  } finally {
    isPageRendering.value = false;
  }
};
```

### 2.5 Resilient Fallback Strategy
If any step in the canvas rendering pipeline fails:
- Worker initialization failure (blocked worker scripts, CSP restrictions).
- WebGL or Canvas context allocation failure (iOS Safari memory budget exceeded).
- PDF stream parsing error (unsupported encryption or corrupted stream).

The viewer seamlessly transitions to the fallback state:
1. `canvasError.value = true`.
2. Hides the canvas container.
3. Renders a fallback card with:
   - Clear user messaging: *"In-browser preview is unavailable on this device."*
   - Primary Action: **Download Original PDF** button (`GET /api/pdf/${id}/download`) with icon `mdi-download`.
   - Secondary Action: **Open in New Tab** (`GET /api/pdf/${id}`) with icon `mdi-open-in-new`.
   - Tertiary Action: **Retry Preview** button with icon `mdi-refresh`.

---

## 3. UI/UX Design System Specification

### 3.1 Design Tokens (from `frontend/src/assets/main.css`)
- **Primary Burgundy**: `#7C0E44` (`var(--portfolio-primary)`)
- **Secondary Rose**: `#AA5E7A` (`var(--portfolio-secondary)`)
- **Background**: `#F2DACE` (`var(--portfolio-bg)`)
- **Surface**: `#FFFFFF` (`var(--portfolio-surface)`)
- **Surface Soft**: `#FAF3F0` (`var(--portfolio-surface-soft)`)
- **Border**: `rgba(124, 14, 68, 0.12)` (`var(--portfolio-border-color)`)
- **Shadow**: `0 8px 24px rgba(124, 14, 68, 0.06)` (`var(--portfolio-shadow)`)
- **Heading Font**: Space Grotesk
- **Body Font**: Manrope
- **Numeric/Page Font**: JetBrains Mono

### 3.2 Icon Availability (from `frontend/src/plugins/icons.js`)
All required icons are verified present in `icons.js`:
- Navigation: `mdi-arrow-left`, `mdi-arrow-right`
- Zoom: `mdi-magnify-plus-outline`, `mdi-magnify-minus-outline`
- Actions: `mdi-download`, `mdi-open-in-new`, `mdi-refresh`, `mdi-file-pdf-box`
- Status: `mdi-alert-circle`, `mdi-check-circle`
*(Note: `mdi-chevron-left` is NOT in `icons.js`; `mdi-arrow-left` and `mdi-arrow-right` MUST be used instead to prevent question-mark fallbacks).*

### 3.3 CSS Constraint Defense
In `main.css` lines 70–76:
```css
img, video, canvas, svg {
  max-width: 100%;
  height: auto;
}
```
When a user selects "150%" zoom on a narrow mobile screen, `max-width: 100%` would compress the canvas horizontally while keeping its height proportional, distorting the document's aspect ratio.
**Critical Fix**: The canvas MUST have:
```css
.pdf-canvas {
  max-width: none !important;
  display: block;
  margin: 0 auto;
}
```
The surrounding wrapper `.pdf-canvas-viewport` provides `overflow: auto; -webkit-overflow-scrolling: touch;`, allowing fluid horizontal panning when zoomed.

---

## 4. Complete Implementation Blueprint

Below is the production-ready implementation code structured for `frontend/src/pages/PdfLandingPage.vue`:

```vue
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";

const route = useRoute();
const docId = computed(() => String(route.params.id || "").trim());

// --- State Variables ---
const isLoadingDoc = ref(true);
const isNotFound = ref(false);
const fetchError = ref("");

const docMetadata = ref(null);
const numPages = ref(1);
const currentPage = ref(1);
const pageInputVal = ref(1);
const isPageRendering = ref(false);

const zoomMode = ref("fit"); // "fit" | "100" | "150"
const canvasError = ref(false);
const canvasErrorMessage = ref("");

// DOM References
const canvasContainerRef = ref(null);
const canvasRef = ref(null);

// Internal PDF.js Handles
let pdfDoc = null;
let cachedPdfBytes = null;
let currentRenderTask = null;
let resizeObserver = null;
let resizeDebounceTimer = null;
let pdfLibPromise = null;

// --- Worker & Library Loader ---
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

// --- Computed URLs ---
const apiBase = computed(() => getApiBaseUrl());
const fileUrl = computed(() => `${apiBase.value}/api/pdf/${docId.value}`);
const downloadUrl = computed(() => `${apiBase.value}/api/pdf/${docId.value}/download`);

const formattedFileSize = computed(() => {
  const bytes = docMetadata.value?.size || cachedPdfBytes?.byteLength;
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
});

// --- Fetch Document & Initialize ---
const loadDocument = async () => {
  isLoadingDoc.value = true;
  fetchError.value = "";
  isNotFound.value = false;
  canvasError.value = false;

  try {
    // 1. Fetch metadata in parallel (non-blocking if it fails)
    fetch(`${apiBase.value}/api/pdf/${docId.value}/metadata`)
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (meta) docMetadata.value = meta;
      })
      .catch(() => {});

    // 2. Fetch raw PDF binary
    const response = await fetch(fileUrl.value);
    if (response.status === 404 || response.status === 410) {
      isNotFound.value = true;
      isLoadingDoc.value = false;
      return;
    }
    if (!response.ok) {
      throw new Error(`Failed to load document (${response.status} ${response.statusText})`);
    }

    const buffer = await response.arrayBuffer();
    cachedPdfBytes = new Uint8Array(buffer);

    // 3. Load PDF.js worker & parse document
    const pdfjsLib = await loadPdfLib();
    const loadingTask = pdfjsLib.getDocument({ data: cachedPdfBytes });
    pdfDoc = await loadingTask.promise;

    numPages.value = pdfDoc.numPages;
    currentPage.value = 1;
    pageInputVal.value = 1;

    isLoadingDoc.value = false;
    await nextTick();
    await renderCurrentPage();
  } catch (err) {
    console.error("PDF initialization failure:", err);
    isLoadingDoc.value = false;
    canvasError.value = true;
    canvasErrorMessage.value = err?.message || "Failed to parse PDF document.";
  }
};

// --- Render Canvas Page ---
const renderCurrentPage = async () => {
  if (!pdfDoc || !canvasRef.value) return;

  // Cancel prior render if still running
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel();
    } catch {
      // Ignored
    }
    currentRenderTask = null;
  }

  isPageRendering.value = true;
  canvasError.value = false;

  try {
    const page = await pdfDoc.getPage(currentPage.value);
    const dpr = window.devicePixelRatio || 1;
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    let baseScale = 1.0;
    if (zoomMode.value === "fit") {
      const containerWidth = canvasContainerRef.value?.clientWidth || window.innerWidth;
      const availableWidth = Math.max(containerWidth - 32, 240);
      baseScale = availableWidth / unscaledViewport.width;
    } else if (zoomMode.value === "100") {
      baseScale = 1.0;
    } else if (zoomMode.value === "150") {
      baseScale = 1.5;
    }

    const renderViewport = page.getViewport({ scale: baseScale * dpr });
    const canvas = canvasRef.value;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Unable to obtain 2D canvas context.");
    }

    // Set physical backing buffer
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    // Set logical CSS display size
    const cssWidth = Math.floor(unscaledViewport.width * baseScale);
    const cssHeight = Math.floor(unscaledViewport.height * baseScale);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const renderTask = page.render({
      canvasContext: context,
      viewport: renderViewport,
    });
    currentRenderTask = renderTask;

    await renderTask.promise;
  } catch (err) {
    if (err?.name === "RenderingCancelledException") {
      return; // Harmless abort
    }
    console.error("Canvas rendering failure:", err);
    canvasError.value = true;
    canvasErrorMessage.value = err?.message || "Failed to render PDF page on canvas.";
  } finally {
    isPageRendering.value = false;
  }
};

// --- Pagination Actions ---
const goToPage = (pageNumber) => {
  const target = Math.max(1, Math.min(numPages.value, pageNumber));
  if (target === currentPage.value) return;
  currentPage.value = target;
  pageInputVal.value = target;
  renderCurrentPage();
};

const commitPageInput = () => {
  let val = parseInt(pageInputVal.value, 10);
  if (isNaN(val)) val = currentPage.value;
  goToPage(val);
};

// --- Zoom Actions ---
const setZoom = (mode) => {
  if (zoomMode.value === mode) return;
  zoomMode.value = mode;
  renderCurrentPage();
};

// --- Keyboard Navigation ---
const handleKeydown = (e) => {
  if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
  if (e.key === "ArrowLeft" || e.key === "PageUp") {
    if (currentPage.value > 1) {
      e.preventDefault();
      goToPage(currentPage.value - 1);
    }
  } else if (e.key === "ArrowRight" || e.key === "PageDown") {
    if (currentPage.value < numPages.value) {
      e.preventDefault();
      goToPage(currentPage.value + 1);
    }
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  loadDocument();
  window.addEventListener("keydown", handleKeydown);

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (zoomMode.value !== "fit" || !pdfDoc) return;
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(() => {
        renderCurrentPage();
      }, 150);
    });

    if (canvasContainerRef.value) {
      resizeObserver.observe(canvasContainerRef.value);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  clearTimeout(resizeDebounceTimer);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel();
    } catch {}
    currentRenderTask = null;
  }
  if (pdfDoc) {
    pdfDoc.destroy();
    pdfDoc = null;
  }
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) loadDocument();
  }
);
</script>

<template>
  <v-container class="pdf-viewer-shell py-8 py-md-12">
    <!-- State 1: 404 / Missing / Expired Document (Coordinated with M2-3) -->
    <div v-if="isNotFound" class="notfound-card text-center pa-8 pa-md-12">
      <v-chip color="secondary" variant="tonal" class="font-weight-bold mb-4">
        Unavailable
      </v-chip>
      <h1 class="text-h4 font-weight-bold mb-3">Document Not Found</h1>
      <p class="muted-copy mb-8">
        This PDF document may have expired, been deleted, or never existed.
      </p>
      <div class="d-flex flex-wrap justify-center ga-3">
        <v-btn
          color="primary"
          size="large"
          rounded="xl"
          class="text-none font-weight-bold px-7"
          to="/projects/pdf-image-studio?mode=pdf-to-qr"
          prepend-icon="mdi-arrow-left"
        >
          Create New QR
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          size="large"
          rounded="xl"
          class="text-none px-7"
          to="/"
          prepend-icon="mdi-home-variant-outline"
        >
          Home
        </v-btn>
      </div>
    </div>

    <!-- State 2: Active Document Viewer -->
    <div v-else class="viewer-card">
      <!-- Header Toolbar -->
      <header class="viewer-header d-flex flex-wrap align-center justify-space-between pa-4 pa-md-5 ga-3">
        <div class="doc-info d-flex align-center ga-3">
          <div class="pdf-badge">
            <v-icon icon="mdi-file-pdf-box" size="32" color="primary" />
          </div>
          <div>
            <h2 class="doc-title text-subtitle-1 text-md-h6 font-weight-bold mb-0">
              {{ docMetadata?.filename || "PDF Document" }}
            </h2>
            <div class="d-flex align-center ga-2 mt-1">
              <v-chip v-if="formattedFileSize" size="x-small" variant="tonal" color="primary">
                {{ formattedFileSize }}
              </v-chip>
              <v-chip v-if="numPages > 0" size="x-small" variant="tonal" color="secondary">
                {{ numPages }} {{ numPages === 1 ? "page" : "pages" }}
              </v-chip>
            </div>
          </div>
        </div>

        <div class="header-actions d-flex align-center ga-2">
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="text-none font-weight-bold px-5"
            prepend-icon="mdi-download"
            :href="downloadUrl"
            download
            elevation="0"
          >
            Download PDF
          </v-btn>
        </div>
      </header>

      <!-- Viewer Navigation & Zoom Controls Bar -->
      <nav class="controls-bar d-flex flex-wrap align-center justify-space-between px-4 py-2 ga-2" aria-label="PDF controls">
        <!-- Pagination Controls -->
        <div class="pagination-controls d-flex align-center ga-1">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            density="comfortable"
            color="primary"
            :disabled="currentPage <= 1 || isPageRendering || isLoadingDoc"
            aria-label="Previous Page"
            @click="goToPage(currentPage - 1)"
          />

          <div class="page-indicator d-flex align-center ga-1 px-2">
            <input
              v-model="pageInputVal"
              type="number"
              min="1"
              :max="numPages"
              class="page-number-input"
              :disabled="isLoadingDoc || numPages <= 1"
              aria-label="Current Page Number"
              @change="commitPageInput"
              @keyup.enter="commitPageInput"
            />
            <span class="page-total text-caption font-weight-medium">/ {{ numPages }}</span>
          </div>

          <v-btn
            icon="mdi-arrow-right"
            variant="text"
            density="comfortable"
            color="primary"
            :disabled="currentPage >= numPages || isPageRendering || isLoadingDoc"
            aria-label="Next Page"
            @click="goToPage(currentPage + 1)"
          />
        </div>

        <!-- Zoom Scaling Controls -->
        <div class="zoom-controls d-flex align-center ga-1">
          <v-btn-toggle
            :model-value="zoomMode"
            mandatory
            density="compact"
            rounded="lg"
            color="primary"
            class="zoom-toggle-group"
          >
            <v-btn value="fit" class="text-none text-caption" @click="setZoom('fit')">
              Fit Width
            </v-btn>
            <v-btn value="100" class="text-none text-caption" @click="setZoom('100')">
              100%
            </v-btn>
            <v-btn value="150" class="text-none text-caption" @click="setZoom('150')">
              150%
            </v-btn>
          </v-btn-toggle>
        </div>
      </nav>

      <!-- Canvas Rendering Viewport -->
      <main
        ref="canvasContainerRef"
        class="pdf-canvas-viewport"
        :class="{ 'is-loading': isLoadingDoc || isPageRendering }"
      >
        <!-- Loading Spinner -->
        <div v-if="isLoadingDoc" class="viewer-loading-state py-16 text-center">
          <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
          <p class="text-body-2 muted-copy">Loading document preview...</p>
        </div>

        <!-- Error / Fallback State -->
        <div v-else-if="canvasError" class="pdf-fallback-card text-center pa-8 pa-md-10">
          <v-icon icon="mdi-alert-circle" size="48" color="warning" class="mb-3" />
          <h3 class="text-h6 font-weight-bold mb-2">Unable to display preview</h3>
          <p class="text-body-2 muted-copy mb-6" style="max-width: 440px; margin: 0 auto;">
            Your browser could not render the canvas preview. You can download the file or open it directly in a new tab.
          </p>
          <div class="d-flex flex-wrap justify-center ga-3">
            <v-btn
              color="primary"
              size="large"
              rounded="lg"
              class="text-none font-weight-bold px-6"
              prepend-icon="mdi-download"
              :href="downloadUrl"
              download
            >
              Download PDF
            </v-btn>
            <v-btn
              variant="outlined"
              color="primary"
              size="large"
              rounded="lg"
              class="text-none px-6"
              prepend-icon="mdi-open-in-new"
              :href="fileUrl"
              target="_blank"
            >
              Open in Browser
            </v-btn>
            <v-btn
              variant="text"
              color="primary"
              size="large"
              rounded="lg"
              class="text-none px-4"
              prepend-icon="mdi-refresh"
              @click="loadDocument"
            >
              Retry
            </v-btn>
          </div>
        </div>

        <!-- High-DPI Crisp Canvas -->
        <div v-show="!isLoadingDoc && !canvasError" class="canvas-stage">
          <canvas ref="canvasRef" class="pdf-canvas"></canvas>
        </div>
      </main>

      <!-- Footer Bar -->
      <footer class="viewer-footer d-flex align-center justify-space-between px-4 py-3 text-caption muted-copy">
        <span>Powered by LakshSolanki PDF Studio</span>
        <span>Press <kbd>&larr;</kbd> and <kbd>&rarr;</kbd> to navigate pages</span>
      </footer>
    </div>
  </v-container>
</template>

<style scoped>
.pdf-viewer-shell {
  max-width: 980px;
  margin: 0 auto;
}

.viewer-card {
  background: var(--portfolio-surface, #ffffff);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  border-radius: 20px;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
  overflow: hidden;
}

.notfound-card {
  background: var(--portfolio-surface, #ffffff);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  border-radius: 24px;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
  max-width: 680px;
  margin: 0 auto;
}

.viewer-header {
  border-bottom: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  background: var(--portfolio-surface, #ffffff);
}

.pdf-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--portfolio-surface-soft, #faf3f0);
}

.doc-title {
  color: var(--portfolio-ink, #231219);
  max-width: 480px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls-bar {
  background: var(--portfolio-surface-soft, #faf3f0);
  border-bottom: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
}

.page-number-input {
  width: 48px;
  height: 32px;
  text-align: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--portfolio-ink, #231219);
  background: #ffffff;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.2));
  border-radius: 6px;
  outline: none;
  padding: 0 4px;
}

.page-number-input:focus {
  border-color: var(--portfolio-primary, #7c0e44);
}

.page-total {
  font-family: "JetBrains Mono", monospace;
  color: var(--portfolio-muted, #7e636e);
}

.pdf-canvas-viewport {
  position: relative;
  min-height: 420px;
  background: #f8fafc;
  padding: 24px 16px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  text-align: center;
}

.canvas-stage {
  display: inline-block;
  vertical-align: middle;
  padding: 4px;
}

.pdf-canvas {
  /* Override main.css max-width: 100% to permit fluid horizontal pan when zoomed */
  max-width: none !important;
  display: block;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.pdf-fallback-card {
  background: #ffffff;
  border: 1px dashed var(--portfolio-border-strong, rgba(124, 14, 68, 0.24));
  border-radius: 16px;
  margin: 32px auto;
  max-width: 580px;
}

.viewer-footer {
  background: var(--portfolio-surface, #ffffff);
  border-top: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
}

kbd {
  background: var(--portfolio-surface-soft, #faf3f0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.2));
  border-radius: 4px;
  padding: 1px 5px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .doc-title {
    max-width: 220px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.v-btn) {
    width: 100%;
  }

  .controls-bar {
    justify-content: center !important;
    gap: 8px;
  }

  .pdf-canvas-viewport {
    padding: 12px 6px;
  }

  .viewer-footer {
    display: none !important;
  }
}
</style>
```

---

## 5. Verification & Testing Matrix

| Requirement | Test Scenario | Expected Outcome | Verification Tool / Command |
|-------------|---------------|------------------|-----------------------------|
| **Worker Pattern** | Initial page visit to `/v/:id` | `pdf-tools` chunk and `pdf.worker` load asynchronously on demand; Vite build passes cleanly | `pnpm run build` |
| **High-DPI Clarity** | Load PDF on Retina display (`window.devicePixelRatio = 2`) | `canvas.width` is $2 \times$ `canvas.style.width`; text renders with zero blur | Inspect canvas attributes in DOM |
| **Responsive Fit** | Resize viewport from 1200px to 375px (mobile) in "Fit Width" mode | Debounced `ResizeObserver` re-renders canvas to fill mobile width without horizontal overflow | Chrome DevTools device mode |
| **Pagination** | Click Previous on Page 1, Next on last page; input page number | Buttons disable at limits; input clamps to $[1, \text{numPages}]$ | Interactive UI verification |
| **Render Cancellation** | Fast double-click on Next Page button | Prior render task is cancelled; `RenderingCancelledException` caught without console error | Console log inspection |
| **Fallback Resiliency** | Simulate worker or context error (corrupt Uint8Array or disabled worker) | Canvas error caught; fallback card displays with working Download button | Unit test / mock failure |

---

## 6. Integration Checklist for M2 Worker

- [ ] Place component at `frontend/src/pages/PdfLandingPage.vue`.
- [ ] Ensure route `/v/:id` is registered in `frontend/src/router/index.js` (M2-3).
- [ ] Ensure `/v` is added to `spaRoutes` in `frontend/scripts/create-spa-route-pages.mjs` (M2-3).
- [ ] Confirm `getApiBaseUrl()` returns local or production backend based on environment.
- [ ] Execute `pnpm run build` to verify zero bundling or syntax warnings.
