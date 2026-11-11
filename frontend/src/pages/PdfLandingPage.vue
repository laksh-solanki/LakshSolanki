<template>
  <div ref="viewerShellRef" class="pdf-landing-shell animate-fade-in-up">
    <!-- 1. LOADING STATE -->
    <div v-if="viewState === 'loading'" class="state-card-wrapper my-auto py-8">
      <v-card class="tool-shell state-card text-center mx-auto pa-6 pa-sm-8" rounded="xl" elevation="0">
        <v-progress-circular indeterminate color="primary" size="36" width="3" class="mb-3" />
        <h2 class="text-subtitle-1 font-weight-bold mb-1 doc-heading">
          Loading Document
        </h2>
        <p class="text-caption muted-copy mb-3">
          {{ loadingStatusText }}
        </p>
        <v-progress-linear indeterminate color="secondary" rounded height="3" class="mx-auto loading-bar" />
      </v-card>
    </div>

    <!-- 2. NOT FOUND / EXPIRED / INVALID UUID STATE -->
    <div v-else-if="viewState === 'not_found'" class="state-card-wrapper my-auto py-8">
      <v-card class="tool-shell state-card text-center mx-auto pa-6 pa-sm-8" rounded="xl" elevation="0">
        <div class="status-icon-badge mx-auto mb-3">
          <v-icon icon="mdi-file-remove-outline" size="24" color="primary" />
        </div>

        <v-chip color="secondary" variant="tonal" size="x-small" class="font-weight-bold mb-2">
          404 • Missing or Expired
        </v-chip>

        <h1 class="text-h6 font-weight-bold mb-1 page-title">
          Document Not Found
        </h1>

        <p class="text-caption muted-copy mb-4 max-w-prose mx-auto">
          This document may have exceeded its 24-hour limit, was removed by the owner, or the link is invalid.
        </p>

        <div class="d-flex flex-wrap ga-2 justify-center">
          <v-btn color="primary" size="small" rounded="lg" class="text-none px-4 font-weight-semibold ui-control-32"
            to="/projects/pdf-image-studio?mode=pdf-to-qr" prepend-icon="mdi-file-pdf-box" elevation="0">
            Create Your QR
          </v-btn>
          <v-btn variant="outlined" color="primary" size="small" rounded="lg"
            class="text-none px-4 font-weight-semibold ui-control-32" to="/" prepend-icon="mdi-home-variant-outline"
            elevation="0">
            Return Home
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- 3. ERROR STATE -->
    <div v-else-if="viewState === 'error'" class="state-card-wrapper my-auto py-8">
      <v-card class="tool-shell state-card text-center mx-auto pa-6 pa-sm-8" rounded="lg" elevation="0">
        <div class="status-icon-badge error-badge mx-auto mb-3">
          <v-icon icon="mdi-alert-circle" size="24" color="error" />
        </div>
        <h2 class="text-h6 font-weight-bold mb-1 text-error">
          {{ errorTitle }}
        </h2>
        <p class="text-caption muted-copy mb-4 max-w-prose mx-auto">
          {{ errorMessage }}
        </p>
        <div class="d-flex flex-wrap ga-2 justify-center">
          <v-btn v-if="canRetry" color="primary" size="small" rounded="lg"
            class="text-none px-4 font-weight-semibold ui-control-32" prepend-icon="mdi-refresh" elevation="0"
            @click="initDocument">
            Retry
          </v-btn>
          <v-btn variant="outlined" color="primary" size="small" rounded="lg"
            class="text-none px-4 font-weight-semibold ui-control-32" to="/" prepend-icon="mdi-home-variant-outline"
            elevation="0">
            Return Home
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- 4. READY STATE: PIXEL-PERFECT FULLSCREEN VIEWER -->
    <div v-else-if="viewState === 'ready'" class="viewer-workspace d-flex flex-column flex-grow-1 w-100 min-w-0">
      <!-- HEADER SHELL -->
      <header
        class="header-shell d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-2 px-3 py-3 mb-2 rounded-lg">
        <!-- Left: PDF Badge & Metadata -->
        <div class="d-flex align-center ga-2 min-w-0 flex-grow-1 w-100 w-sm-auto">
          <div class="doc-icon-badge flex-shrink-0 d-flex align-center justify-center">
            <v-icon icon="mdi-file-pdf-box" size="20" color="primary" />
          </div>

          <div class="doc-header-text min-w-0 flex-grow-1">
            <div class="d-flex align-center min-w-0">
              <h1 class="doc-title d-flex align-center font-weight-bold min-w-0" :title="metadata.filename">
                <span class="text-truncate">{{ filenameSplit.base }}</span>
                <span class="flex-shrink-0 font-weight-bold">{{ filenameSplit.ext }}</span>
              </h1>
            </div>

            <div class="doc-meta-row d-flex align-center flex-wrap ga-2 mt-0.5">
              <span class="meta-tag font-mono text-caption">{{ formatFileSize(metadata.size) }}</span>
              <span v-if="totalPages > 0" class="meta-tag-dot" aria-hidden="true">•</span>
              <span v-if="totalPages > 0" class="meta-tag font-mono text-caption">
                {{ totalPages }} {{ totalPages > 1 ? 'pages' : 'page' }}
              </span>
              <template v-if="expiryTimeFormatted">
                <span class="meta-tag-dot" aria-hidden="true">•</span>
                <span class="meta-tag font-mono text-caption expiry-tag d-inline-flex align-center">
                  <v-icon icon="mdi-clock-outline" size="12" class="me-1 flex-shrink-0" />
                  Expires {{ expiryTimeFormatted }}
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- Right: Action Buttons (Identical 32px Height Symmetry) -->
        <v-btn-toggle border divided variant="elevated" color="primary" rounded="lg">
          <v-btn :href="downloadEndpointUrl" download target="_blank" rel="noopener" prepend-icon="mdi-download">
            Download
          </v-btn>
          <v-btn :href="inlineViewUrl" target="_blank" rel="noopener" prepend-icon="mdi-open-in-new">
            Open
          </v-btn>
          <v-tooltip text="Copy public link" location="bottom" color="primary">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-content-copy" aria-label="Copy public link" @click="copyPublicLink" />
            </template>
          </v-tooltip>

          <v-tooltip :text="isFullscreen ? 'Exit full screen' : 'Full screen'" location="bottom" color="primary ">
            <template #activator="{ props }">
              <v-btn v-bind="props" :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                aria-label="Toggle Fullscreen" @click="toggleFullscreen" />
            </template>
          </v-tooltip>
        </v-btn-toggle>
      </header>

      <!-- VIEWER TOOLBAR (Accessible role="toolbar", Single Tab Stop & Symmetry) -->
      <nav role="toolbar" aria-label="PDF viewer controls"
        class="viewer-toolbar d-flex align-center justify-space-between flex-wrap ga-2 px-2 py-2 mb-2 rounded-lg">
        <!-- Pagination Controls Group -->
        <div role="group" aria-label="Pagination" class="d-flex justify-content-center align-items-center ga-1">
          <v-btn size="x-small" variant="text" icon="mdi-chevron-left" rounded="md" class="toolbar-btn"
            :disabled="currentPage <= 1 || isRenderingPage" aria-label="Previous Page" @click="prevPage" />
          <div class="page-indicator d-flex align-center ga-1 px-1">
            <input v-model="pageInputVal" type="number" min="1" :max="totalPages" class="page-number-input font-mono"
              :disabled="totalPages <= 1 || isRenderingPage" aria-label="Current Page Number" @change="commitPageInput"
              @keyup.enter="commitPageInput" />
            <span class="page-count text-caption font-mono">/ {{ totalPages }}</span>
          </div>
          <v-btn size="x-small" variant="text" icon="mdi-chevron-right" rounded="md" class="toolbar-btn"
            :disabled="currentPage >= totalPages || isRenderingPage" aria-label="Next Page" @click="nextPage" />
        </div>

        <!-- Zoom Controls Group -->
        <div role="group" aria-label="Zoom controls" class="d-flex align-items-center ga-1">
          <v-btn-toggle :model-value="zoomMode" mandatory density="compact" border color="primary" rounded="xl"
            variant="text">
            <v-btn value="fit" class="text-none text-caption px-2 zoom-toggle-btn" :disabled="isRenderingPage"
              @click="setZoom('fit')">
              Fit
            </v-btn>
            <v-btn value="100" class="text-none text-caption px-2 zoom-toggle-btn" :disabled="isRenderingPage"
              @click="setZoom('100')">
              100%
            </v-btn>
            <v-btn value="150" class="text-none text-caption px-2 zoom-toggle-btn d-none d-sm-inline-flex"
              :disabled="isRenderingPage" @click="setZoom('150')">
              150%
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-btn-toggle density="compact" border color="primary"
          class="d-flex align-items-center justify-content-between flex-shrink-0" rounded="xl">
          <v-btn :disabled="isRenderingPage" aria-label="Zoom Out" @click="zoomStep(-0.25)">
            <v-icon>mdi-magnify-minus-outline</v-icon>
          </v-btn>
          <v-btn :disabled="isRenderingPage" aria-label="Zoom In" @click="zoomStep(0.25)">
            <v-icon>mdi-magnify-plus-outline</v-icon>
          </v-btn>
        </v-btn-toggle>
      </nav>

      <!-- CANVAS VIEWER VIEWPORT (Fluid Responsiveness & Crisp DPI) -->
      <main ref="canvasContainerRef" class="canvas-viewport rounded-lg" tabindex="0" aria-label="PDF Canvas Preview">
        <!-- Canvas Fallback Card -->
        <div v-if="canvasError" class="pdf-fallback-card text-center pa-6 mx-auto my-auto">
          <v-icon icon="mdi-alert-circle" size="32" color="warning" class="mb-2" />
          <h3 class="text-subtitle-1 font-weight-bold mb-1">Unable to display preview</h3>
          <p class="text-caption muted-copy mb-4 max-w-prose mx-auto">
            Your browser could not render the canvas preview. You can download the original file directly or open it in
            a new
            tab.
          </p>
          <div class="d-flex flex-wrap justify-center ga-2">
            <v-btn color="primary" size="small" rounded="lg" class="text-none font-weight-bold px-4 ui-control-32"
              prepend-icon="mdi-download" :href="downloadEndpointUrl" download>
              Download PDF
            </v-btn>
            <v-btn variant="tonal" color="primary" size="small" rounded="lg" class="text-none px-3 ui-control-32"
              prepend-icon="mdi-open-in-new" :href="inlineViewUrl" target="_blank" rel="noopener">
              Open in Tab
            </v-btn>
            <v-btn variant="text" color="primary" size="small" rounded="lg" class="text-none px-3 ui-control-32"
              prepend-icon="mdi-refresh" @click="initDocument">
              Retry
            </v-btn>
          </div>
        </div>

        <!-- Crisp High-DPI Canvas Wrap -->
        <div v-show="!canvasError" class="canvas-scroll-wrap">
          <canvas ref="pdfCanvasRef" class="pdf-canvas" />
        </div>

        <!-- Loading Overlay -->
        <div v-if="isRenderingPage" class="canvas-render-overlay d-flex align-center justify-center">
          <v-progress-circular indeterminate color="primary" size="32" width="3" />
        </div>
      </main>

      <!-- FOOTER INFO BAR -->
      <footer
        class="viewer-footer mt-2 px-2 d-flex align-center justify-space-between flex-wrap ga-2 text-caption muted-copy">
        <span class="d-inline-flex align-center ga-1">
          <v-icon icon="mdi-shield-check-outline" size="14" color="secondary" />
          Ephemeral link • Auto-purged after 24h
        </span>
        <span class="d-none d-sm-inline">
          Use <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to switch pages
        </span>
      </footer>
    </div>

    <!-- NOTIFICATION SNACKBAR -->
    <v-snackbar v-model="snackbarVisible" :timeout="2500" color="primary" location="bottom center" rounded="pill">
      {{ snackbarText }}
    </v-snackbar>
  </div>
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
const isFullscreen = ref(false);

const viewerShellRef = ref(null);
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

const filenameSplit = computed(() => {
  const fn = metadata.value.filename || "document.pdf";
  const lastDot = fn.lastIndexOf(".");
  if (lastDot > 0) {
    return {
      base: fn.substring(0, lastDot),
      ext: fn.substring(lastDot),
    };
  }
  return { base: fn, ext: "" };
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

// Fullscreen toggle helper
const toggleFullscreen = async () => {
  try {
    const targetEl = viewerShellRef.value || document.documentElement;
    if (!document.fullscreenElement) {
      if (targetEl.requestFullscreen) {
        await targetEl.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  } catch (err) {
    console.warn("Fullscreen toggle error:", err);
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  if (zoomMode.value === "fit") {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
      renderPage(currentPage.value);
    }, 120);
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

    // 1. Fetch metadata
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

    // 2. Fetch binary arrayBuffer
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

    // 3. Load pdfjs-dist dynamically
    loadingStatusText.value = "Initializing PDF viewer...";
    pdfjsLibInstance = await loadPdfLib();

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
    if (renderId !== currentRenderId) return;

    const unscaledViewport = page.getViewport({ scale: 1.0 });

    // Calculate base scale according to zoom mode
    let baseScale = 1.0;
    if (zoomMode.value === "fit") {
      const containerWidth = canvasContainerRef.value?.clientWidth || window.innerWidth;
      const availableWidth = Math.max(containerWidth - 24, 240);
      baseScale = availableWidth / unscaledViewport.width;
    } else if (zoomMode.value === "100") {
      baseScale = 1.0;
    } else if (zoomMode.value === "150") {
      baseScale = 1.5;
    } else if (zoomMode.value === "custom") {
      baseScale = customZoomScale.value;
    }

    const dpr = window.devicePixelRatio || 1;
    const renderViewport = page.getViewport({ scale: baseScale * dpr });

    const canvas = pdfCanvasRef.value;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Unable to obtain 2D canvas context.");
    }

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

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

// Zoom Controls
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
    const availableWidth = Math.max(containerWidth - 24, 240);
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
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (zoomMode.value !== "fit" || !pdfDocInstance || isRenderingPage.value) return;
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(() => {
        renderPage(currentPage.value);
      }, 120);
    });

    if (canvasContainerRef.value) {
      resizeObserver.observe(canvasContainerRef.value);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
/* 1. Full Screen Layout & Base Spacing Scale */
.pdf-landing-shell {
  width: 100%;
  max-width: 100%;
  min-height: calc(100vh - 64px);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-x: clip;
}

/* Browser Fullscreen Mode */
.pdf-landing-shell:fullscreen {
  background: var(--portfolio-bg, #f2dace) !important;
  padding: 8px 12px !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  overflow: hidden;
}

.pdf-landing-shell:fullscreen .canvas-viewport {
  height: calc(100vh - 104px) !important;
}

/* 2. Header Shell (32px Symmetry & Ellipsis Protection) */
.header-shell {
  background: var(--portfolio-surface, #ffffff);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  box-shadow: 0 2px 8px rgba(124, 14, 68, 0.04);
}

.doc-icon-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(124, 14, 68, 0.07);
}

.doc-title {
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  line-height: 1.25;
  color: var(--portfolio-ink, #231219);
  max-width: 100%;
}

.meta-tag {
  color: var(--portfolio-muted, #7e636e);
  font-size: 0.72rem;
  line-height: 1;
}

.meta-tag-dot {
  color: var(--portfolio-border-strong, rgba(124, 14, 68, 0.24));
  font-size: 0.7rem;
  line-height: 1;
}

.expiry-tag {
  color: var(--portfolio-primary, #7c0e44);
  font-weight: 600;
}

/* Control Symmetry (Exact 32px height for all header actions) */
.ui-control-32 {
  height: 32px !important;
  min-height: 32px !important;
  border-radius: 8px !important;
  font-size: 0.82rem !important;
  letter-spacing: 0.01em;
}

/* 3. Toolbar (Accessible role="toolbar", 28px Symmetry) */
.viewer-toolbar {
  background: var(--portfolio-surface, #ffffff);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  box-shadow: 0 1px 4px rgba(124, 14, 68, 0.03);
}

.page-indicator {
  color: var(--portfolio-ink, #231219);
}

.page-number-input {
  width: 36px;
  height: 28px;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--portfolio-ink, #231219);
  background: var(--portfolio-surface-soft, #faf3f0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.18));
  border-radius: 6px;
  outline: none;
  padding: 0 2px;
  box-sizing: border-box;
}

.page-number-input:focus {
  border-color: var(--portfolio-primary, #7c0e44);
  background: #ffffff;
}

.page-count {
  font-size: 0.75rem;
  color: var(--portfolio-muted, #7e636e);
  font-weight: 600;
}

.toolbar-sep {
  display: inline-block;
  width: 1px;
  height: 18px;
  background: var(--portfolio-border-color, rgba(124, 14, 68, 0.15));
  margin: 0 4px;
}

/* 4. Canvas Viewport */
.canvas-viewport {
  position: relative;
  flex: 1 1 auto;
  height: calc(100vh - 176px);
  min-height: 480px;
  background: var(--portfolio-surface-soft, #faf3f0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  overflow: auto;
  overflow-x: auto;
  touch-action: pan-x pan-y pinch-zoom;
  -webkit-overflow-scrolling: touch;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px;
  outline: none;
}

.canvas-viewport:focus-visible {
  border-color: var(--portfolio-primary, #7c0e44);
}

.canvas-scroll-wrap {
  display: inline-block;
  margin: auto;
}

.pdf-canvas {
  max-width: none !important;
  display: block;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 4px 20px -2px rgba(124, 14, 68, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.05);
}

.canvas-render-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  z-index: 5;
}

.pdf-fallback-card {
  background: #ffffff;
  border: 1px dashed var(--portfolio-border-color, rgba(124, 14, 68, 0.24));
  border-radius: 12px;
  max-width: 420px;
}

/* 5. State Cards (Loading, 404, Error) */
.state-card-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12)) !important;
  background: var(--portfolio-surface, #ffffff) !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06)) !important;
}

.state-card {
  max-width: 440px;
  width: 100%;
}

.status-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(124, 14, 68, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-badge {
  background: rgba(186, 26, 26, 0.08);
}

.doc-heading,
.page-title {
  font-family: "Space Grotesk", sans-serif;
  color: var(--portfolio-ink, #231219);
}

.muted-copy {
  color: var(--portfolio-muted, #7e636e);
  line-height: 1.5;
}

.font-mono {
  font-family: "JetBrains Mono", monospace !important;
}

.loading-bar {
  max-width: 200px;
}

.max-w-prose {
  max-width: 380px;
}

.viewer-footer {
  border-top: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.08));
  padding-top: 6px;
}

kbd {
  background: var(--portfolio-surface-soft, #faf3f0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.18));
  border-radius: 3px;
  padding: 1px 4px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.7rem;
}

/* 6. Responsive Reflow (Mobile < 600px) */
@media (max-width: 600px) {
  .pdf-landing-shell {
    padding: 8px;
  }

  .canvas-viewport {
    padding: 8px;
    height: calc(100vh - 200px);
    min-height: 380px;
  }

  .download-btn {
    flex-grow: 1;
    justify-content: center;
  }

  .state-card {
    padding: 20px 16px !important;
    border-radius: 16px;
  }
}
</style>
