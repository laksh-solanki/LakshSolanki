<template>
  <v-container class="pdf-landing-shell py-6 py-md-10 animate-fade-in-up">
    <!-- 1. LOADING STATE -->
    <v-card v-if="viewState === 'loading'" class="tool-shell p-6 p-md-10 text-center mx-auto" rounded="xl"
      elevation="0">
      <div class="loading-wrap py-10">
        <v-progress-circular indeterminate color="primary" size="56" width="4" class="mb-5" />
        <h2 class="text-h5 font-weight-bold mb-2 doc-heading">
          Loading Document
        </h2>
        <p class="text-body-1 muted-copy mb-4">
          {{ loadingStatusText }}
        </p>
        <v-progress-linear indeterminate color="secondary" rounded height="4" class="mx-auto loading-bar" />
      </div>
    </v-card>

    <!-- 2. NOT FOUND / EXPIRED / INVALID UUID STATE (Matches NotFoundPage.vue styling) -->
    <v-card v-else-if="viewState === 'not_found'" class="minimal-404 section-shell p-8 p-md-12 text-center mx-auto"
      rounded="xl" elevation="0">
      <v-chip color="secondary" variant="tonal" class="font-weight-bold mb-6">
        Document Expired or Missing
      </v-chip>

      <p class="display-code mb-2">404</p>

      <h1 class="text-h4 text-md-h3 mb-4 page-title font-weight-bold">
        Document Not Found
      </h1>

      <p class="text-body-1 muted-copy page-copy mb-8">
        This document may have reached its 24-hour expiration limit, was deleted by its owner, or the link is invalid.
      </p>

      <!-- Minimal compass radar visual in burgundy/rose with mdi-file-pdf-box -->
      <div class="radar-container mb-8" aria-hidden="true">
        <div class="radar-circle radar-circle-1" />
        <div class="radar-circle radar-circle-2" />
        <div class="radar-circle radar-circle-3" />
        <v-icon icon="mdi-file-pdf-box" size="44" color="primary" class="radar-icon" />
      </div>

      <div class="action-row d-flex flex-wrap ga-3 mb-6 justify-center">
        <v-btn color="primary" size="large" rounded="xl" class="text-none px-7 font-weight-bold"
          to="/projects/pdf-image-studio?mode=pdf-to-qr" prepend-icon="mdi-plus" elevation="0">
          Generate Your Own QR
        </v-btn>
        <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-7 font-weight-bold"
          to="/" prepend-icon="mdi-home-variant-outline" elevation="0">
          Return Home
        </v-btn>
      </div>

      <div class="quick-links d-flex flex-wrap justify-center ga-2">
        <v-chip to="/projects/pdf-image-studio" color="primary" variant="tonal" class="text-none"
          prepend-icon="mdi-file-pdf-box">
          PDF &amp; Image Studio
        </v-chip>
        <v-chip to="/projects" color="primary" variant="tonal" class="text-none"
          prepend-icon="mdi-briefcase-variant-outline">
          All Projects
        </v-chip>
      </div>
    </v-card>

    <!-- 3. ERROR STATE (Network or Server Connectivity Issue) -->
    <v-card v-else-if="viewState === 'error'" class="tool-shell p-6 p-md-10 text-center mx-auto error-shell"
      rounded="xl" elevation="0">
      <v-avatar color="error" variant="tonal" size="64" class="mb-4">
        <v-icon icon="mdi-alert-circle" size="36" color="error" />
      </v-avatar>
      <h2 class="text-h5 font-weight-bold mb-2 doc-heading text-error">
        {{ errorTitle }}
      </h2>
      <p class="text-body-1 muted-copy mb-6 max-w-prose mx-auto">
        {{ errorMessage }}
      </p>
      <div class="d-flex flex-wrap ga-3 justify-center">
        <v-btn v-if="canRetry" color="primary" size="large" rounded="xl" class="text-none px-6 font-weight-bold"
          prepend-icon="mdi-refresh" elevation="0" @click="initDocument">
          Retry
        </v-btn>
        <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-6 font-weight-bold"
          to="/" prepend-icon="mdi-home-variant-outline" elevation="0">
          Return Home
        </v-btn>
      </div>
    </v-card>

    <!-- 4. READY STATE (Public Viewer & Download Page) -->
    <v-card v-else-if="viewState === 'ready'" class="tool-shell p-5 p-md-8 viewer-card" rounded="xl" elevation="0">
      <!-- HEADER ROW -->
      <div class="doc-header-card mb-6">
        <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center ga-4">
          <!-- Document Metadata Info -->
          <div class="doc-info-block min-w-0">
            <div class="d-flex align-center ga-2 mb-2 flex-wrap">
              <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold"
                to="/projects/pdf-image-studio?mode=pdf-to-qr">
                PDF &amp; Image Studio
              </v-chip>
              <v-chip v-if="expiryTimeFormatted" size="small" color="secondary" variant="outlined"
                class="font-weight-medium font-mono">
                Expires: {{ expiryTimeFormatted }}
              </v-chip>
            </div>

            <h1 class="doc-title text-h5 text-md-h4 font-weight-bold mb-2 text-truncate" :title="metadata.filename">
              {{ metadata.filename }}
            </h1>

            <div class="doc-meta-chips d-flex flex-wrap align-center ga-2">
              <v-chip size="small" variant="flat" color="surface-variant" prepend-icon="mdi-file-pdf-box"
                class="font-mono text-caption">
                {{ formatFileSize(metadata.size) }}
              </v-chip>
              <v-chip v-if="metadata.created_at" size="small" variant="flat" color="surface-variant"
                prepend-icon="mdi-calendar-check-outline" class="font-mono text-caption">
                {{ formatDate(metadata.created_at) }}
              </v-chip>
              <v-chip v-if="totalPages > 0" size="small" variant="flat" color="surface-variant"
                class="font-mono text-caption">
                {{ totalPages }} page{{ totalPages > 1 ? 's' : '' }}
              </v-chip>
            </div>
          </div>

          <!-- Primary Actions (Prominent Download Button + Secondary Actions) -->
          <div
            class="doc-actions-block d-flex flex-column flex-sm-row align-stretch align-sm-center ga-2 w-100 w-md-auto">
            <v-btn :href="downloadEndpointUrl" download target="_blank" rel="noopener" color="primary" size="large"
              rounded="xl" class="download-cta-btn text-none px-6 font-weight-bold" prepend-icon="mdi-download"
              elevation="0">
              Download Original PDF
            </v-btn>

            <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-4"
              prepend-icon="mdi-content-copy" elevation="0" @click="copyPublicLink">
              Copy Link
            </v-btn>

            <v-btn :href="inlineViewUrl" target="_blank" rel="noopener" variant="text" color="primary" size="large"
              rounded="xl" class="text-none px-4" prepend-icon="mdi-open-in-new">
              Open
            </v-btn>
          </div>
        </div>
      </div>

      <!-- VIEWER TOOLBAR -->
      <div class="viewer-toolbar p-3 mb-4 rounded-lg d-flex flex-wrap justify-space-between align-center ga-2">
        <!-- Pagination Controls -->
        <div class="pagination-controls d-flex align-center ga-1">
          <v-btn size="small" variant="text" rounded="lg" icon="mdi-arrow-left"
            :disabled="currentPage <= 1 || isRenderingPage" aria-label="Previous Page" @click="prevPage" />
          <div class="page-indicator d-flex align-center ga-1 px-2 font-mono text-caption font-weight-bold">
            <span>Page</span>
            <input v-model="pageInputVal" type="number" min="1" :max="totalPages" class="page-number-input"
              :disabled="totalPages <= 1 || isRenderingPage" aria-label="Current Page Number" @change="commitPageInput"
              @keyup.enter="commitPageInput" />
            <span class="text-caption font-weight-medium">/ {{ totalPages }}</span>
          </div>
          <v-btn size="small" variant="text" rounded="lg" icon="mdi-arrow-right"
            :disabled="currentPage >= totalPages || isRenderingPage" aria-label="Next Page" @click="nextPage" />
        </div>

        <!-- Zoom Controls: "Fit Width", "100%", "150%" -->
        <div class="zoom-controls d-flex align-center ga-1">
          <v-btn-toggle :model-value="zoomMode" mandatory density="compact" rounded="lg" color="primary"
            class="zoom-toggle-group">
            <v-btn value="fit" class="text-none text-caption" :disabled="isRenderingPage" @click="setZoom('fit')">
              Fit Width
            </v-btn>
            <v-btn value="100" class="text-none text-caption" :disabled="isRenderingPage" @click="setZoom('100')">
              100%
            </v-btn>
            <v-btn value="150" class="text-none text-caption" :disabled="isRenderingPage" @click="setZoom('150')">
              150%
            </v-btn>
          </v-btn-toggle>

          <v-btn size="small" variant="text" rounded="lg" icon="mdi-magnify-minus-outline" :disabled="isRenderingPage"
            aria-label="Zoom Out" @click="zoomStep(-0.25)" />
          <v-btn size="small" variant="text" rounded="lg" icon="mdi-magnify-plus-outline" :disabled="isRenderingPage"
            aria-label="Zoom In" @click="zoomStep(0.25)" />
        </div>
      </div>

      <!-- CANVAS VIEWER VIEWPORT (overflow-x: auto container) -->
      <div ref="canvasContainerRef" class="canvas-viewport p-2 p-md-4 rounded-xl text-center">
        <!-- Canvas Fallback Card (if PDF.js fails to render) -->
        <div v-if="canvasError" class="pdf-fallback-card text-center pa-8 pa-md-10 mx-auto">
          <v-icon icon="mdi-alert-circle" size="48" color="warning" class="mb-3" />
          <h3 class="text-h6 font-weight-bold mb-2">Unable to display preview</h3>
          <p class="text-body-2 muted-copy mb-6 max-w-prose mx-auto">
            Your browser could not render the canvas preview. You can download the file directly or open it in a new
            tab.
          </p>
          <div class="d-flex flex-wrap justify-center ga-3">
            <v-btn color="primary" size="large" rounded="lg" class="text-none font-weight-bold px-6"
              prepend-icon="mdi-download" :href="downloadEndpointUrl" download>
              Download PDF
            </v-btn>
            <v-btn variant="outlined" color="primary" size="large" rounded="lg" class="text-none px-6"
              prepend-icon="mdi-open-in-new" :href="inlineViewUrl" target="_blank" rel="noopener">
              Open in New Tab
            </v-btn>
            <v-btn variant="text" color="primary" size="large" rounded="lg" class="text-none px-4"
              prepend-icon="mdi-refresh" @click="initDocument">
              Retry
            </v-btn>
          </div>
        </div>

        <!-- Crisp High-DPI Canvas -->
        <div v-show="!canvasError" class="canvas-scroll-wrap">
          <canvas ref="pdfCanvasRef" class="pdf-canvas elevation-1" />
        </div>

        <div v-if="isRenderingPage" class="canvas-render-overlay d-flex align-center justify-center">
          <v-progress-circular indeterminate color="primary" size="36" />
        </div>
      </div>

      <!-- FOOTER INFO BAR -->
      <div
        class="viewer-footer mt-4 d-flex flex-wrap align-center justify-space-between ga-2 text-caption muted-copy px-2">
        <span>🔒 Ephemeral storage: files are automatically purged after 24 hours.</span>
        <span>Use <kbd>&larr;</kbd> and <kbd>&rarr;</kbd> keys to change pages</span>
      </div>
    </v-card>

    <!-- NOTIFICATION SNACKBAR -->
    <v-snackbar v-model="snackbarVisible" :timeout="2500" color="primary" location="bottom center" rounded="pill">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
import { getApiBaseUrl } from "@/utils/apiBaseUrl.js";

const route = useRoute();

// UUIDv4 validation pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 4 Reactive States: 'loading' | 'ready' | 'not_found' | 'error'
const viewState = ref("loading");
const loadingStatusText = ref("Connecting to secure storage...");
const errorTitle = ref("");
const errorMessage = ref("");
const canRetry = ref(true);

// Document Metadata
const metadata = ref({
  id: "",
  filename: "document.pdf",
  size: 0,
  created_at: "",
  expires_at: "",
});

// PDF.js & Viewer State
let pdfjsLibInstance = null;
let pdfDocInstance = null;
let activeRenderTask = null;
let currentRenderId = 0;
let cachedPdfBytes = null;
let resizeObserver = null;
let resizeDebounceTimer = null;

const currentPage = ref(1);
const totalPages = ref(1);
const pageInputVal = ref(1);
const zoomMode = ref("fit"); // "fit" | "100" | "150" | "custom"
const customZoomScale = ref(1.0);
const isRenderingPage = ref(false);
const canvasError = ref(false);

const canvasContainerRef = ref(null);
const pdfCanvasRef = ref(null);

// UI Notifications
const snackbarVisible = ref(false);
const snackbarText = ref("");

// Computed Endpoints & Values
const documentId = computed(() => String(route.params.id || "").trim());

const downloadEndpointUrl = computed(() => {
  return `${getApiBaseUrl()}/api/pdf/${encodeURIComponent(documentId.value)}/download`;
});

const inlineViewUrl = computed(() => {
  return `${getApiBaseUrl()}/api/pdf/${encodeURIComponent(documentId.value)}`;
});

const expiryTimeFormatted = computed(() => {
  const exp = metadata.value.expires_at || metadata.value.expiresAt;
  if (!exp) return null;
  const d = new Date(exp);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
});

// Utility Helpers
const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const copyPublicLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    snackbarText.value = "Public link copied to clipboard!";
    snackbarVisible.value = true;
  } catch (_e) {
    snackbarText.value = "Could not copy link to clipboard.";
    snackbarVisible.value = true;
  }
};

// Dynamic PDF.js Loader with Web Worker
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

// Core Document Initialization
const initDocument = async () => {
  const id = documentId.value;

  // Initial check: Validate UUIDv4 format on client
  if (!id || !UUID_REGEX.test(id)) {
    viewState.value = "not_found";
    document.title = "LakshSolanki | Document Not Found";
    return;
  }

  viewState.value = "loading";
  loadingStatusText.value = "Retrieving document metadata...";
  canvasError.value = false;

  try {
    const baseUrl = getApiBaseUrl();

    // 1. Fetch metadata from GET ${getApiBaseUrl()}/api/pdf/${route.params.id}/metadata
    const metaRes = await fetch(`${baseUrl}/api/pdf/${encodeURIComponent(id)}/metadata`);
    if (metaRes.status === 404 || metaRes.status === 410) {
      viewState.value = "not_found";
      document.title = "LakshSolanki | Document Not Found";
      return;
    }
    if (!metaRes.ok) {
      throw new Error(`Failed to load metadata (HTTP ${metaRes.status})`);
    }

    const metaData = await metaRes.json();
    metadata.value = metaData;
    document.title = `LakshSolanki | View PDF - ${metaData.filename || "Document"}`;

    // 2. Fetch binary arrayBuffer from GET ${getApiBaseUrl()}/api/pdf/${route.params.id}
    loadingStatusText.value = "Streaming PDF file...";
    const binRes = await fetch(`${baseUrl}/api/pdf/${encodeURIComponent(id)}`);
    if (binRes.status === 404 || binRes.status === 410) {
      viewState.value = "not_found";
      document.title = "LakshSolanki | Document Not Found";
      return;
    }
    if (!binRes.ok) {
      throw new Error(`Failed to load PDF file (HTTP ${binRes.status})`);
    }

    const arrayBuffer = await binRes.arrayBuffer();
    cachedPdfBytes = new Uint8Array(arrayBuffer);

    // 3. Load pdfjs-dist dynamically with Web Worker
    loadingStatusText.value = "Initializing PDF viewer...";
    pdfjsLibInstance = await loadPdfLib();

    // Load document with Uint8Array
    const loadingTask = pdfjsLibInstance.getDocument({
      data: cachedPdfBytes,
    });
    pdfDocInstance = await loadingTask.promise;

    totalPages.value = pdfDocInstance.numPages;
    currentPage.value = 1;
    pageInputVal.value = 1;

    viewState.value = "ready";

    await nextTick();
    await renderPage(currentPage.value);
  } catch (err) {
    console.error("PDF Landing Page initialization error:", err);
    viewState.value = "error";
    errorTitle.value = "Unable to Display Document";
    errorMessage.value = err?.message || "An unexpected error occurred while loading the PDF document.";
    canRetry.value = true;
    document.title = "LakshSolanki | Error Loading Document";
  }
};

// Canvas Rendering: High-DPI crisp rendering & Cancellation safety
const renderPage = async (pageNumber) => {
  if (!pdfDocInstance || !pdfCanvasRef.value) return;

  const renderId = ++currentRenderId;

  // Cancellation safety: if activeRenderTask exists, call .cancel()
  if (activeRenderTask) {
    try {
      activeRenderTask.cancel();
    } catch (_e) {
      // Ignore cancellation exception
    }
    activeRenderTask = null;
  }

  isRenderingPage.value = true;
  canvasError.value = false;

  try {
    const page = await pdfDocInstance.getPage(pageNumber);
    if (renderId !== currentRenderId) return; // Stale request superseded by newer render request

    const unscaledViewport = page.getViewport({ scale: 1.0 });

    // Calculate base scale according to zoom mode
    let baseScale = 1.0;
    if (zoomMode.value === "fit") {
      const containerWidth = canvasContainerRef.value?.clientWidth || window.innerWidth;
      const availableWidth = Math.max(containerWidth - 32, 240);
      baseScale = availableWidth / unscaledViewport.width;
    } else if (zoomMode.value === "100") {
      baseScale = 1.0;
    } else if (zoomMode.value === "150") {
      baseScale = 1.5;
    } else if (zoomMode.value === "custom") {
      baseScale = customZoomScale.value;
    }

    // High-DPI crisp rendering: multiply viewport scale by window.devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    const renderViewport = page.getViewport({ scale: baseScale * dpr });

    const canvas = pdfCanvasRef.value;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Unable to obtain 2D canvas context.");
    }

    // Set canvas.width/height to physical pixels
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    // Set canvas.style.width/height to CSS logical pixels
    const cssWidth = Math.floor(unscaledViewport.width * baseScale);
    const cssHeight = Math.floor(unscaledViewport.height * baseScale);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const renderTask = page.render({
      canvasContext: context,
      viewport: renderViewport,
    });
    activeRenderTask = renderTask;

    await renderTask.promise;
    if (activeRenderTask === renderTask) {
      activeRenderTask = null;
    }
  } catch (err) {
    if (
      err?.name === "RenderingCancelledException" ||
      err?.message?.includes("Cannot use the same canvas during multiple render() operations")
    ) {
      // Rapid navigation or resize cancelation; safely ignore
      return;
    }
    console.error("PDF canvas render failure:", err);
    canvasError.value = true;
  } finally {
    if (renderId === currentRenderId) {
      isRenderingPage.value = false;
    }
  }
};

// Pagination Controls
const goToPage = (pageNumber) => {
  const target = Math.max(1, Math.min(totalPages.value, pageNumber));
  if (target === currentPage.value) return;
  currentPage.value = target;
  pageInputVal.value = target;
  renderPage(currentPage.value);
};

const prevPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1);
  }
};

const commitPageInput = () => {
  let val = parseInt(pageInputVal.value, 10);
  if (isNaN(val)) val = currentPage.value;
  goToPage(val);
};

// Zoom Controls: "Fit Width", "100%", "150%"
const setZoom = (mode) => {
  zoomMode.value = mode;
  renderPage(currentPage.value);
};

const zoomStep = (delta) => {
  let currentEffectiveScale = 1.0;
  if (zoomMode.value === "100") currentEffectiveScale = 1.0;
  else if (zoomMode.value === "150") currentEffectiveScale = 1.5;
  else if (zoomMode.value === "custom") currentEffectiveScale = customZoomScale.value;
  else if (zoomMode.value === "fit" && pdfDocInstance && canvasContainerRef.value && pdfCanvasRef.value) {
    const containerWidth = canvasContainerRef.value.clientWidth;
    const availableWidth = Math.max(containerWidth - 32, 240);
    // Approximate current scale
    currentEffectiveScale = Math.max(0.5, Math.min(2.0, availableWidth / 600));
  }

  const nextScale = Math.max(0.5, Math.min(2.5, +(currentEffectiveScale + delta).toFixed(2)));
  if (nextScale === 1.0) {
    zoomMode.value = "100";
  } else if (nextScale === 1.5) {
    zoomMode.value = "150";
  } else {
    zoomMode.value = "custom";
    customZoomScale.value = nextScale;
  }
  renderPage(currentPage.value);
};

// Keyboard Navigation
const handleKeydown = (e) => {
  if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
  if (isRenderingPage.value) return;
  if (e.key === "ArrowLeft" || e.key === "PageUp") {
    if (currentPage.value > 1) {
      e.preventDefault();
      prevPage();
    }
  } else if (e.key === "ArrowRight" || e.key === "PageDown") {
    if (currentPage.value < totalPages.value) {
      e.preventDefault();
      nextPage();
    }
  }
};

// Lifecycle Hooks
onMounted(() => {
  initDocument();
  window.addEventListener("keydown", handleKeydown);

  // ResizeObserver on viewer container to auto-resize when in "Fit Width" mode
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (zoomMode.value !== "fit" || !pdfDocInstance || isRenderingPage.value) return;
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(() => {
        renderPage(currentPage.value);
      }, 150);
    });

    if (canvasContainerRef.value) {
      resizeObserver.observe(canvasContainerRef.value);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  clearTimeout(resizeDebounceTimer);

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (activeRenderTask) {
    try {
      activeRenderTask.cancel();
    } catch (_e) { }
    activeRenderTask = null;
  }
  if (pdfDocInstance) {
    try {
      pdfDocInstance.destroy();
    } catch (_e) { }
    pdfDocInstance = null;
  }
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) initDocument();
  }
);
</script>

<style scoped>
.pdf-landing-shell {
  max-width: 1040px;
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12)) !important;
  background: var(--portfolio-surface, #ffffff) !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06)) !important;
}

.doc-heading,
.doc-title {
  font-family: "Space Grotesk", sans-serif;
  color: var(--portfolio-ink, #231219);
}

.muted-copy {
  color: var(--portfolio-muted, #7e636e);
}

.font-mono {
  font-family: "JetBrains Mono", monospace !important;
}

.loading-bar {
  max-width: 280px;
}

/* Minimal 404 Styling Matching NotFoundPage.vue */
.minimal-404 {
  max-width: 820px;
  border-radius: 24px;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  background: #ffffff !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
}

.display-code {
  margin: 0;
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(5rem, 16vw, 8.5rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg,
      var(--portfolio-primary, #7c0e44) 0%,
      var(--portfolio-secondary, #aa5e7a) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-title {
  color: var(--portfolio-ink, #231219);
  font-family: "Space Grotesk", sans-serif;
}

.page-copy {
  max-width: 48ch;
  margin-inline: auto;
  color: var(--portfolio-muted, #7e636e);
  line-height: 1.6;
}

.radar-container {
  position: relative;
  width: 110px;
  height: 110px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-circle {
  position: absolute;
  border: 1px solid rgba(124, 14, 68, 0.18);
  border-radius: 50%;
  animation: radarPulse 3s infinite ease-out;
}

.radar-circle-1 {
  width: 100%;
  height: 100%;
  animation-delay: 0s;
}

.radar-circle-2 {
  width: 70%;
  height: 70%;
  animation-delay: 1s;
}

.radar-circle-3 {
  width: 40%;
  height: 40%;
  animation-delay: 2s;
}

.radar-icon {
  position: relative;
  z-index: 2;
  color: var(--portfolio-primary, #7c0e44) !important;
}

@keyframes radarPulse {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }

  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* Document Header Card */
.doc-header-card {
  border-bottom: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.1));
  padding-bottom: 20px;
}

.download-cta-btn {
  font-size: 1rem !important;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.download-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(124, 14, 68, 0.24) !important;
}

/* Viewer Toolbar */
.viewer-toolbar {
  background: var(--portfolio-surface-soft, #faf3f0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
}

.page-indicator {
  color: var(--portfolio-ink, #231219);
}

.page-number-input {
  width: 46px;
  height: 30px;
  text-align: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85rem;
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

/* Canvas Viewport (overflow-x: auto container) */
.canvas-viewport {
  position: relative;
  background: var(--portfolio-surface-soft, #faf3f0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  min-height: 420px;
  overflow: auto;
  overflow-x: auto;
  touch-action: pan-y pinch-zoom;
  -webkit-overflow-scrolling: touch;
}

.canvas-scroll-wrap {
  display: inline-block;
  padding: 4px;
}

/* Explicit CSS rule: max-width: none !important to prevent distortion on zoom */
.pdf-canvas {
  max-width: none !important;
  display: block;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.canvas-render-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(2px);
  z-index: 5;
}

.pdf-fallback-card {
  background: #ffffff;
  border: 1px dashed var(--portfolio-border-color, rgba(124, 14, 68, 0.24));
  border-radius: 16px;
  max-width: 540px;
}

.viewer-footer {
  border-top: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.08));
  padding-top: 12px;
}

kbd {
  background: var(--portfolio-surface-soft, #faf3f0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.2));
  border-radius: 4px;
  padding: 1px 5px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.75rem;
}

.max-w-prose {
  max-width: 480px;
}

/* Responsive Overrides */
@media (max-width: 600px) {
  .minimal-404 {
    padding: 28px 16px !important;
    border-radius: 18px;
  }

  .action-row {
    width: 100%;
    flex-direction: column;
  }

  .action-row :deep(.v-btn) {
    width: 100% !important;
    justify-content: center;
  }

  .doc-title {
    font-size: 1.35rem !important;
  }

  .doc-actions-block {
    width: 100%;
  }

  .download-cta-btn {
    width: 100%;
    justify-content: center;
  }

  .viewer-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-controls,
  .zoom-controls {
    justify-content: space-between;
    width: 100%;
  }

  .canvas-viewport {
    padding: 8px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .radar-circle {
    animation: none;
    opacity: 0.3;
  }
}
</style>
