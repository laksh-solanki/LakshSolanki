# Architecture Blueprint & Specification: Public PDF Landing Page (`PdfLandingPage.vue`)

**Document Version:** 1.0.0  
**Target File:** `frontend/src/pages/PdfLandingPage.vue`  
**Route Path:** `/v/:id`  
**Milestone:** M2 — Public Landing Page & Viewer  
**Author:** Explorer M2-1 (Public Landing Page Architect)  
**Date:** 2026-11-04  

---

## 1. Executive Summary

This document specifies the complete architectural blueprint and production component template for `frontend/src/pages/PdfLandingPage.vue`, the dedicated public preview and download landing page for the PDF to QR Code Generator system in `PdfImageStudio`.

When users scan a generated QR code or open a shared link (`/v/:id`), this component:
1. Validates the 36-character UUIDv4 document identifier on the client.
2. Retrieves document metadata (`GET /api/pdf/${id}/metadata`) including filename, file size, upload timestamp, and expiration timestamp.
3. Retrieves the PDF binary stream (`GET /api/pdf/${id}`) and renders pages crisply using HTML5 `<canvas>` via `pdfjs-dist` (version 5.7).
4. Provides a prominent, high-visibility "Download Original PDF" action button (`mdiDownload` icon) streaming from `/api/pdf/${id}/download`.
5. Implements a robust 3-state reactive lifecycle (`loading`, `ready`, `error`/`not_found`) with graceful 404 styling mirroring `NotFoundPage.vue`.
6. Delivers a responsive mobile-first layout that smoothly adapts between small smartphones (vertically stacked controls, full-width viewport) and high-resolution desktops.

---

## 2. Interface Contracts & Data Flow

### 2.1 Backend API Endpoints (FastAPI Port 5001 / Vercel Serverless)

| Endpoint | HTTP Method | Request Params | Success Response (200) | Error Codes |
|---|---|---|---|---|
| `/api/pdf/{id}/metadata` | `GET` | `id: UUIDv4` path param | `{"id": string, "filename": string, "size": number, "created_at": string, "expires_at": string}` | `400` (invalid ID)<br>`404` (not found/expired) |
| `/api/pdf/{id}` | `GET` | `id: UUIDv4` path param | Binary stream (`Content-Type: application/pdf`, `Content-Disposition: inline; filename="..."`) | `400`<br>`404` |
| `/api/pdf/{id}/download` | `GET` | `id: UUIDv4` path param | Binary stream (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="..."`) | `400`<br>`404` |
| `/api/pdf/{id}` | `DELETE` | `id: UUIDv4` path param | `{"status": "deleted", "id": string}` | `400`<br>`404` |

### 2.2 Client-Side URL Resolution
API requests are dispatched to `getApiBaseUrl()` from `@/utils/apiBaseUrl.js`:
- In local development (`localhost` / `127.0.0.1`): `http://localhost:5001`
- In production: `https://lakshsolanki-backend.vercel.app` (or `VITE_API_URL` override)

### 2.3 End-to-End Sequence Diagram

```
User (Browser / QR Scanner)
       │
       ▼
1. Navigates to /v/:id
       │
       ├─► Check UUIDv4 Regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
       │   └─ [Invalid] ──► State = 'error' (Invalid Document Link)
       │
       ├─► State = 'loading'
       │
       ├─► GET ${getApiBaseUrl()}/api/pdf/:id/metadata
       │   ├─ [404 Not Found] ──► State = 'not_found' (Expired / Deleted 404 card)
       │   ├─ [400 Bad Req]   ──► State = 'error'
       │   └─ [200 OK]        ──► Store metadata, set document.title = `${filename} | PDF Document Viewer`
       │
       ├─► GET ${getApiBaseUrl()}/api/pdf/:id
       │   ├─ [Fetch Error]   ──► State = 'error' (Network / Server issue)
       │   └─ [200 OK]        ──► Read ArrayBuffer, create Blob URL
       │
       ├─► Lazy-load `pdfjs-dist` worker via `loadPdfLib()`
       │   └─► `pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise`
       │
       ├─► State = 'ready'
       │
       └─► Render Page 1 to HTML5 <canvas>
             ├─ Auto-fit scale to container width
             ├─ Apply window.devicePixelRatio for Retina sharpness
             └─ Enable user page navigation (Prev/Next) & Zoom (In/Out/Fit)
```

---

## 3. Reactive State Machine Design

The component operates on four distinct operational states:

```
                  ┌──────────────────────┐
                  │      INITIALIZE      │
                  └──────────┬───────────┘
                             │
                      Validate UUIDv4
                             ├─── Invalid ───► ┌────────────────────────┐
                             │                 │   STATE: 'error'       │
                             ▼                 │   (Bad Link / ID)      │
                  ┌──────────────────────┐     └────────────────────────┘
                  │    STATE: 'loading'  │
                  │  (Progress Spinner & │
                  │   Skeleton Loaders)  │
                  └──────────┬───────────┘
                             │
                    Fetch Metadata & PDF
                             ├─── 404 / Expired ─► ┌────────────────────────┐
                             │                     │   STATE: 'not_found'   │
                             │                     │   (Minimal 404 Radar)  │
                             ├─── Network Error ─► └────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │    STATE: 'ready'    │
                  │  (Header, Download   │
                  │   Canvas Viewer,     │
                  │   Toolbar, Footer)   │
                  └──────────────────────┘
```

### State Definitions
1. **`loading` State:**
   - Displays a clean `.tool-shell` card containing `<v-progress-circular indeterminate color="primary">`.
   - Dynamic status indicator: "Connecting to secure storage...", "Retrieving document...", "Rendering PDF canvas...".
   - Subtle animated progress bar `<v-progress-linear indeterminate color="secondary">`.

2. **`ready` State:**
   - **Header section:**
     - Left: Document filename (in `Space Grotesk`, truncated with tooltip for long names), formatted file size chip (`formatFileSize(bytes)`), creation timestamp chip, remaining retention badge (`Expires in ~Xh`).
     - Right: High-visibility "Download Original PDF" button (`mdi-download`, `color="primary"`, `size="large"`, `rounded="xl"`), plus secondary "Open in Tab" (`mdi-open-in-new`) and "Copy Link" (`mdi-content-copy`) action buttons.
   - **Viewer toolbar:**
     - Page navigation: `Previous` button, `Page X of Y` indicator, `Next` button.
     - Zoom controls: `Zoom In` (`mdi-magnify-plus-outline`), `Reset / Fit Width`, `Zoom Out` (`mdi-magnify-minus-outline`).
   - **Canvas viewport:**
     - HTML5 `<canvas ref="pdfCanvasRef">` wrapped in `.canvas-wrapper`.
     - Handles DPI scaling, page changes, container resizing, and cancelation of active render tasks.

3. **`not_found` State:**
   - Directly adopts the design system of `NotFoundPage.vue`:
     - Centered minimal shell `.minimal-404`.
     - Monospace gradient display code `404` (`Space Grotesk`, gradient primary-to-secondary).
     - Pulsing radar circles visual (`.radar-container`).
     - Title: "Document Not Found or Expired".
     - Copy: "This document may have reached its 24-hour expiration limit, was deleted by the author, or the link is invalid."
     - Actions: "Go Home" (`mdi-home-variant-outline`) and "Create New QR Code" (`/projects/pdf-image-studio?mode=pdf-to-qr`).

4. **`error` State:**
   - Displayed on malformed UUIDv4, network timeout, or unexpected server error.
   - Card displays warning badge, clear error message, and a "Retry Loading" button (`mdi-refresh`).

---

## 4. Responsive Design & Layout Specifications

### 4.1 Breakpoint Behaviors

| Viewport | Container Padding | Header Layout | Download Button | Toolbar Layout | Canvas Width |
|---|---|---|---|---|---|
| **Mobile (`< 600px`)** | `12px` horizontal | Stacked vertical: Title, chips, actions in 1 column | `width: 100%`, `size="large"`, stacked prominently | 2 stacked rows (Row 1: Prev/Page/Next; Row 2: Zoom -/Fit/+) | `100%` (fill screen, touch-scrollable) |
| **Tablet (`600px - 960px`)** | `24px` horizontal | Title & chips on top, action buttons wrapped below | Auto-width, inline with secondary actions | Single centered row | Fit width with max margin |
| **Desktop (`> 960px`)** | `32px` horizontal | Horizontal split: Title + chips left, Actions right | Prominent right-aligned primary CTA | Full toolbar with pagination & zoom aligned | Centered, max-width 900px |

### 4.2 Portfolio Styling Tokens Applied

| Token | CSS Variable / Value | Application |
|---|---|---|
| Primary Color | `var(--portfolio-primary, #7C0E44)` | Main CTA buttons, active chips, headings |
| Secondary Color | `var(--portfolio-secondary, #AA5E7A)` | Accent badges, borders, gradients |
| Surface Soft | `var(--portfolio-surface-soft, #FAF3F0)` | Toolbar background, canvas container backdrop |
| Border Color | `var(--portfolio-border-color, rgba(124, 14, 68, 0.12))` | Card borders, toolbars, divider lines |
| Card Shell | `.tool-shell` | Main document container with `border-radius: 20px` |
| Box Shadow | `var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06))` | Card elevation and canvas frame shadow |
| Typography | Space Grotesk (headings), Manrope (body), JetBrains Mono (metrics) | Universal site typography |

---

## 5. Production Component Template: `PdfLandingPage.vue`

Below is the complete, self-contained implementation blueprint for `frontend/src/pages/PdfLandingPage.vue`:

```vue
<template>
  <v-container class="pdf-landing-shell py-6 py-md-10 animate-fade-in-up">
    <!-- 1. LOADING STATE -->
    <v-card
      v-if="viewState === 'loading'"
      class="tool-shell p-6 p-md-10 text-center"
      rounded="xl"
      elevation="0"
    >
      <div class="loading-wrap py-10">
        <v-progress-circular
          indeterminate
          color="primary"
          size="56"
          width="4"
          class="mb-5"
        />
        <h2 class="text-h5 font-weight-bold mb-2 doc-heading">
          Loading Document
        </h2>
        <p class="text-body-1 muted-copy mb-4">
          {{ loadingStatusText }}
        </p>
        <v-progress-linear
          indeterminate
          color="secondary"
          rounded
          height="4"
          class="mx-auto loading-bar"
        />
      </div>
    </v-card>

    <!-- 2. NOT FOUND / EXPIRED STATE (Matches NotFoundPage.vue styling) -->
    <v-card
      v-else-if="viewState === 'not_found'"
      class="minimal-404 section-shell p-8 p-md-12 text-center mx-auto"
      rounded="xl"
      elevation="0"
    >
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

      <!-- Minimal compass radar visual in burgundy/rose -->
      <div class="radar-container mb-8" aria-hidden="true">
        <div class="radar-circle radar-circle-1" />
        <div class="radar-circle radar-circle-2" />
        <div class="radar-circle radar-circle-3" />
        <v-icon
          icon="mdi-file-pdf-box"
          size="44"
          color="primary"
          class="radar-icon"
        />
      </div>

      <div class="action-row d-flex flex-wrap ga-3 mb-6 justify-center">
        <v-btn
          color="primary"
          size="large"
          rounded="xl"
          class="text-none px-7 font-weight-bold"
          prepend-icon="mdi-home-variant-outline"
          elevation="0"
          to="/"
        >
          Go Home
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          size="large"
          rounded="xl"
          class="text-none px-7"
          to="/projects/pdf-image-studio?mode=pdf-to-qr"
          prepend-icon="mdi-plus"
          elevation="0"
        >
          Create New QR Code
        </v-btn>
      </div>
    </v-card>

    <!-- 3. ERROR STATE (Bad ID or Network Failure) -->
    <v-card
      v-else-if="viewState === 'error'"
      class="tool-shell p-6 p-md-10 text-center mx-auto error-shell"
      rounded="xl"
      elevation="0"
    >
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
        <v-btn
          v-if="canRetry"
          color="primary"
          size="large"
          rounded="xl"
          class="text-none px-6"
          prepend-icon="mdi-refresh"
          elevation="0"
          @click="initDocument"
        >
          Retry
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          size="large"
          rounded="xl"
          class="text-none px-6"
          to="/"
          prepend-icon="mdi-home-variant-outline"
          elevation="0"
        >
          Return Home
        </v-btn>
      </div>
    </v-card>

    <!-- 4. READY STATE (Public Viewer & Download Page) -->
    <v-card
      v-else-if="viewState === 'ready'"
      class="tool-shell p-5 p-md-8"
      rounded="xl"
      elevation="0"
    >
      <!-- HEADER ROW -->
      <div class="doc-header-card mb-6">
        <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center ga-4">
          <!-- Document Metadata Info -->
          <div class="doc-info-block min-w-0">
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip
                size="small"
                color="primary"
                variant="tonal"
                class="font-weight-bold"
                to="/projects/pdf-image-studio"
              >
                PDF Image Studio
              </v-chip>
              <v-chip
                v-if="expiryTimeFormatted"
                size="small"
                color="secondary"
                variant="outlined"
                class="font-weight-medium font-mono"
              >
                Expires: {{ expiryTimeFormatted }}
              </v-chip>
            </div>

            <h1
              class="doc-title text-h5 text-md-h4 font-weight-bold mb-2 text-truncate"
              :title="metadata.filename"
            >
              {{ metadata.filename }}
            </h1>

            <div class="doc-meta-chips d-flex flex-wrap align-center ga-2">
              <v-chip
                size="small"
                variant="flat"
                color="surface-variant"
                prepend-icon="mdi-file-pdf-box"
                class="font-mono text-caption"
              >
                {{ formatFileSize(metadata.size) }}
              </v-chip>
              <v-chip
                size="small"
                variant="flat"
                color="surface-variant"
                prepend-icon="mdi-calendar-check-outline"
                class="font-mono text-caption"
              >
                {{ formatDate(metadata.created_at) }}
              </v-chip>
              <v-chip
                size="small"
                variant="flat"
                color="surface-variant"
                class="font-mono text-caption"
              >
                {{ totalPages }} page{{ totalPages > 1 ? 's' : '' }}
              </v-chip>
            </div>
          </div>

          <!-- Primary Actions (Prominent Download Button) -->
          <div class="doc-actions-block d-flex flex-column flex-sm-row align-stretch align-sm-center ga-2 w-100 w-md-auto">
            <v-btn
              :href="downloadEndpointUrl"
              download
              target="_blank"
              rel="noopener"
              color="primary"
              size="large"
              rounded="xl"
              class="download-cta-btn text-none px-6 font-weight-bold"
              prepend-icon="mdi-download"
              elevation="0"
            >
              Download Original PDF
            </v-btn>

            <v-menu location="bottom end">
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  variant="outlined"
                  color="primary"
                  size="large"
                  rounded="xl"
                  class="text-none px-4"
                  prepend-icon="mdi-dots-vertical"
                  elevation="0"
                >
                  More
                </v-btn>
              </template>
              <v-list rounded="lg" elevation="2" class="p-1">
                <v-list-item
                  :href="inlineViewUrl"
                  target="_blank"
                  rel="noopener"
                  prepend-icon="mdi-open-in-new"
                  title="Open in New Tab"
                />
                <v-list-item
                  prepend-icon="mdi-content-copy"
                  title="Copy Public Link"
                  @click="copyPublicLink"
                />
              </v-list>
            </v-menu>
          </div>
        </div>
      </div>

      <!-- VIEWER TOOLBAR -->
      <div class="viewer-toolbar p-3 mb-4 rounded-lg d-flex flex-wrap justify-space-between align-center ga-2">
        <!-- Pagination Controls -->
        <div class="pagination-controls d-flex align-center ga-1">
          <v-btn
            size="small"
            variant="text"
            rounded="lg"
            icon="mdi-arrow-left"
            :disabled="currentPage <= 1 || isRenderingPage"
            @click="prevPage"
          />
          <div class="page-indicator font-mono text-caption px-2 font-weight-bold">
            Page {{ currentPage }} / {{ totalPages }}
          </div>
          <v-btn
            size="small"
            variant="text"
            rounded="lg"
            icon="mdi-arrow-right"
            :disabled="currentPage >= totalPages || isRenderingPage"
            @click="nextPage"
          />
        </div>

        <!-- Zoom & Scale Controls -->
        <div class="zoom-controls d-flex align-center ga-1">
          <v-btn
            size="small"
            variant="text"
            rounded="lg"
            icon="mdi-magnify-minus-outline"
            :disabled="zoomScale <= 0.6 || isRenderingPage"
            @click="zoomOut"
          />
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            rounded="lg"
            class="text-caption font-mono px-2 text-none"
            :disabled="isRenderingPage"
            @click="fitToWidth"
          >
            {{ Math.round(zoomScale * 100) }}%
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            rounded="lg"
            icon="mdi-magnify-plus-outline"
            :disabled="zoomScale >= 2.5 || isRenderingPage"
            @click="zoomIn"
          />
          <v-btn
            size="small"
            variant="text"
            rounded="lg"
            class="text-caption text-none"
            :disabled="isRenderingPage"
            @click="fitToWidth"
          >
            Fit
          </v-btn>
        </div>
      </div>

      <!-- CANVAS VIEWER SHELL -->
      <div
        ref="canvasContainerRef"
        class="canvas-viewport p-2 p-md-4 rounded-xl text-center"
      >
        <div class="canvas-scroll-wrap">
          <canvas
            ref="pdfCanvasRef"
            class="pdf-page-canvas elevation-1"
          />
        </div>

        <div
          v-if="isRenderingPage"
          class="canvas-render-overlay d-flex align-center justify-center"
        >
          <v-progress-circular
            indeterminate
            color="primary"
            size="32"
          />
        </div>
      </div>

      <!-- RETENTION & PRIVACY FOOTER -->
      <div class="viewer-footer mt-6 text-center">
        <p class="text-caption muted-copy m-0">
          🔒 Secure ephemeral storage. Uploaded PDFs are automatically purged after 24 hours.
        </p>
      </div>
    </v-card>

    <!-- NOTIFICATION SNACKBAR -->
    <v-snackbar
      v-model="snackbarVisible"
      :timeout="2500"
      color="primary"
      location="bottom center"
      rounded="pill"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute } from "vue-router";
import { getApiBaseUrl } from "@/utils/apiBaseUrl.js";

const route = useRoute();

// Reactive View State: 'loading' | 'ready' | 'not_found' | 'error'
const viewState = ref("loading");
const loadingStatusText = ref("Connecting to storage...");
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

// PDF.js State (kept non-deeply reactive for performance)
let pdfjsLibInstance = null;
let pdfDocInstance = null;
let activeRenderTask = null;

const currentPage = ref(1);
const totalPages = ref(1);
const zoomScale = ref(1.0);
const isRenderingPage = ref(false);

const canvasContainerRef = ref(null);
const pdfCanvasRef = ref(null);

// UI Notifications
const snackbarVisible = ref(false);
const snackbarText = ref("");

// Computed Endpoints
const documentId = computed(() => String(route.params.id || "").trim());

const downloadEndpointUrl = computed(() => {
  return `${getApiBaseUrl()}/api/pdf/${documentId.value}/download`;
});

const inlineViewUrl = computed(() => {
  return `${getApiBaseUrl()}/api/pdf/${documentId.value}`;
});

const expiryTimeFormatted = computed(() => {
  const exp = metadata.value.expires_at || metadata.value.expiresAt;
  if (!exp) return null;
  const d = new Date(exp);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
});

// Helpers
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

// PDF.js Dynamic Loader (reusing proven pattern from PdfImgPage.vue)
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

// Core Initialization Flow
const initDocument = async () => {
  const id = documentId.value;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    viewState.value = "error";
    errorTitle.value = "Invalid Document Link";
    errorMessage.value = "The provided document identifier is invalid or malformed.";
    canRetry.value = false;
    return;
  }

  viewState.value = "loading";
  loadingStatusText.value = "Retrieving document metadata...";

  try {
    // 1. Fetch Metadata
    const metaRes = await fetch(`${getApiBaseUrl()}/api/pdf/${id}/metadata`);
    if (metaRes.status === 404) {
      viewState.value = "not_found";
      return;
    }
    if (!metaRes.ok) {
      throw new Error(`Failed to load document metadata (HTTP ${metaRes.status})`);
    }

    const metaData = await metaRes.json();
    metadata.value = metaData;
    document.title = `${metaData.filename || "Document"} | PDF Document Viewer`;

    // 2. Fetch Binary Stream
    loadingStatusText.value = "Streaming PDF file...";
    const binRes = await fetch(`${getApiBaseUrl()}/api/pdf/${id}`);
    if (binRes.status === 404) {
      viewState.value = "not_found";
      return;
    }
    if (!binRes.ok) {
      throw new Error(`Failed to load PDF binary (HTTP ${binRes.status})`);
    }

    const arrayBuffer = await binRes.arrayBuffer();

    // 3. Load PDF.js and initialize document
    loadingStatusText.value = "Initializing viewer...";
    pdfjsLibInstance = await loadPdfLib();
    pdfDocInstance = await pdfjsLibInstance.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    totalPages.value = pdfDocInstance.numPages;
    currentPage.value = 1;

    viewState.value = "ready";

    await nextTick();
    fitToWidth();
  } catch (err) {
    console.error("PDF Landing Page error:", err);
    viewState.value = "error";
    errorTitle.value = "Unable to Display Document";
    errorMessage.value = err.message || "An unexpected error occurred while loading the PDF document.";
    canRetry.value = true;
  }
};

// Canvas Rendering
const renderPage = async (pageNumber) => {
  if (!pdfDocInstance || !pdfCanvasRef.value) return;

  if (activeRenderTask) {
    try {
      activeRenderTask.cancel();
    } catch (_e) {
      // Ignore cancellation exceptions
    }
    activeRenderTask = null;
  }

  isRenderingPage.value = true;

  try {
    const page = await pdfDocInstance.getPage(pageNumber);
    const viewport = page.getViewport({ scale: zoomScale.value });
    const canvas = pdfCanvasRef.value;
    const context = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const renderContext = {
      canvasContext: context,
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
    };

    activeRenderTask = page.render(renderContext);
    await activeRenderTask.promise;
    activeRenderTask = null;
  } catch (err) {
    if (err?.name !== "RenderingCancelledException") {
      console.error("PDF canvas render error:", err);
    }
  } finally {
    isRenderingPage.value = false;
  }
};

// Navigation & Zoom Handlers
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    renderPage(currentPage.value);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    renderPage(currentPage.value);
  }
};

const zoomIn = () => {
  if (zoomScale.value < 2.5) {
    zoomScale.value = Math.min(2.5, +(zoomScale.value + 0.25).toFixed(2));
    renderPage(currentPage.value);
  }
};

const zoomOut = () => {
  if (zoomScale.value > 0.5) {
    zoomScale.value = Math.max(0.5, +(zoomScale.value - 0.25).toFixed(2));
    renderPage(currentPage.value);
  }
};

const fitToWidth = async () => {
  if (!pdfDocInstance || !canvasContainerRef.value) return;
  try {
    const page = await pdfDocInstance.getPage(currentPage.value);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const containerWidth = canvasContainerRef.value.clientWidth - 32;
    if (containerWidth > 0 && unscaledViewport.width > 0) {
      const calculatedScale = +(containerWidth / unscaledViewport.width).toFixed(2);
      zoomScale.value = Math.max(0.5, Math.min(2.0, calculatedScale));
    } else {
      zoomScale.value = 1.0;
    }
    renderPage(currentPage.value);
  } catch (e) {
    console.error("fitToWidth error:", e);
    renderPage(currentPage.value);
  }
};

// Lifecycle Hooks
let resizeObserver = null;

onMounted(() => {
  initDocument();

  // Recompute fit when window or container resizes (e.g., orientation change)
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (viewState.value === "ready" && !isRenderingPage.value) {
        // debounce slightly
        fitToWidth();
      }
    });
    if (canvasContainerRef.value) {
      resizeObserver.observe(canvasContainerRef.value);
    }
  }
});

onBeforeUnmount(() => {
  if (activeRenderTask) {
    try {
      activeRenderTask.cancel();
    } catch (_e) {}
  }
  if (pdfDocInstance) {
    try {
      pdfDocInstance.destroy();
    } catch (_e) {}
    pdfDocInstance = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
.pdf-landing-shell {
  max-width: 1040px;
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12)) !important;
  background: var(--portfolio-surface, #FFFFFF) !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06)) !important;
}

.doc-heading,
.doc-title {
  font-family: "Space Grotesk", sans-serif;
  color: var(--portfolio-ink, #231219);
}

.muted-copy {
  color: var(--portfolio-muted, #7E636E);
}

.font-mono {
  font-family: "JetBrains Mono", monospace !important;
}

.loading-bar {
  max-width: 280px;
}

/* Minimal 404 Styling Matching NotFoundPage.vue */
.minimal-404 {
  max-width: 760px;
  border-radius: 24px;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  background: #FFFFFF !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
}

.display-code {
  margin: 0;
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(4.5rem, 14vw, 7.5rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, var(--portfolio-primary, #7C0E44) 0%, var(--portfolio-secondary, #AA5E7A) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
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
  color: var(--portfolio-primary, #7C0E44) !important;
}

@keyframes radarPulse {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(1.3); opacity: 0; }
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
  background: var(--portfolio-surface-soft, #FAF3F0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
}

.page-indicator {
  color: var(--portfolio-ink, #231219);
}

/* Canvas Viewport */
.canvas-viewport {
  position: relative;
  background: var(--portfolio-surface-soft, #FAF3F0);
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  min-height: 400px;
  overflow: auto;
  touch-action: pan-y pinch-zoom;
}

.canvas-scroll-wrap {
  display: inline-block;
  max-width: 100%;
}

.pdf-page-canvas {
  display: block;
  margin: 0 auto;
  background: #FFFFFF;
  border-radius: 4px;
}

.canvas-render-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(2px);
  z-index: 5;
}

/* Responsive Overrides */
@media (max-width: 600px) {
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
</style>
```

---

## 6. Route Registration & SPA Scripts

### 6.1 Route Definition in `frontend/src/router/index.js`
The route `/v/:id` must be registered at the root router level immediately before the `/notfound` and catch-all routes:

```javascript
// In frontend/src/router/index.js:
  {
    path: "/v/:id",
    name: "PdfLanding",
    component: () => import("@/pages/PdfLandingPage.vue"),
    meta: { title: "LakshSolanki | View Document" },
  },
  {
    path: "/notfound",
    name: "NotFound",
    component: () => import("@/pages/NotFoundPage.vue"),
    meta: { title: "LakshSolanki | Not Found" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/notfound",
  },
```

### 6.2 SPA Entry Point in `frontend/scripts/create-spa-route-pages.mjs`
To ensure static web hosts without native wildcard rewrites properly serve direct visits to `/v/...`, add `/v` to `spaRoutes`:

```javascript
// In frontend/scripts/create-spa-route-pages.mjs:
const spaRoutes = [
  "/about",
  "/projects",
  "/projects/certificate-gen",
  "/projects/pdf-image-studio",
  "/projects/img-pdf",
  "/projects/pdf-img",
  "/projects/text-to-speech",
  "/projects/mindlytic_ai",
  "/projects/json-forge",
  "/projects/web-lab-compiler",
  "/projects/dev-utility-hub",
  "/projects/translate-studio",
  "/projects/passport-cutter",
  "/projects/api-blueprint",
  "/v",
  "/notfound",
];
```

---

## 7. Performance, Security & Memory Management

1. **Memory Leak Prevention:**
   - On component unmount (`onBeforeUnmount`), any active `renderTask` must be cancelled with `renderTask.cancel()`.
   - The PDF.js document instance must be cleaned up via `pdfDocInstance.destroy()` to free memory held by the worker and rendering pipelines.
   - Any `ResizeObserver` listener must be explicitly disconnected.

2. **Render Cancellation Tokens:**
   - PDF.js throws errors if a new render operation is initiated on the same canvas while another is still active. The `activeRenderTask` tracker safely cancels previous jobs before starting new ones.

3. **High-DPI / Retina Sharpness:**
   - Canvas coordinate dimensions (`canvas.width`, `canvas.height`) are scaled by `window.devicePixelRatio`, while CSS styling dimensions (`canvas.style.width`, `canvas.style.height`) match logical viewport pixels. This prevents blurry rendering on mobile Retina and 4K desktop screens.

4. **Security & Input Sanitization:**
   - The document ID is strictly validated against a UUIDv4 pattern before any API call.
   - All filenames are escaped in HTML templates, and downloads specify `Content-Disposition: attachment`.
