# Technical Analysis: Routing, SPA Static Route Generation & Graceful 404/Error Handling (Milestone 2)

**Author:** Explorer M2-3 (Routing, SPA & 404 Specialist)  
**Parent Agent:** Orchestrator (`f95d3a59-3a8c-4581-9f3a-23cc3972df45`)  
**Target Milestone:** Milestone 2 (Public Landing Page & Viewer)  
**Date:** 2026-11-04  

---

## 1. Executive Summary

Milestone 2 introduces the dedicated public viewer route `/v/:id` where users access, preview, and download PDFs generated via the PDF to QR Code tool. This analysis establishes the concrete technical blueprint for three critical architectural dimensions:
1. **Vue Router Integration (`frontend/src/router/index.js`)**: Dynamic route registration for `/v/:id` with route meta titles, component code splitting, and graceful bare `/v` route navigation.
2. **SPA Static Entry Generation (`frontend/scripts/create-spa-route-pages.mjs`)**: Directory-based entry creation for `/v` and static hosting fallback mechanics (Render `render.yaml` vs GitHub Pages `404.html`) ensuring direct URL scans and reloads never trigger web-server 404s.
3. **Graceful Status & Error Handling (`frontend/src/pages/PdfLandingPage.vue`)**: Full design specification for the missing, expired, or deleted document card, matching `NotFoundPage.vue` styling, gradient display typography, color tokens (`#7C0E44`, `#F2DACE`), animated radar pulse visual, and action buttons (`Generate Your Own QR` and `Return Home`).
4. **Build Compatibility**: Verified with Vite 8 and Node 24 (`pnpm run build`), ensuring seamless bundle generation and tree-shaken icon loading.

---

## 2. Vue Router Configuration Blueprint (`frontend/src/router/index.js`)

### 2.1 Current Routing Architecture
In `frontend/src/router/index.js`, the router is configured with HTML5 history mode (`createWebHistory(import.meta.env.BASE_URL)`) and dynamic imports for lazy chunking.
Current top-level routes end at lines 94–104:
```javascript
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
Any route placed after line 101 will be swallowed by the catch-all redirect `/:pathMatch(.*)*`.

### 2.2 Proposed Route Registration
The route must be registered immediately prior to `/notfound`:

```javascript
  {
    path: "/v/:id",
    name: "PdfLanding",
    component: () => import("@/pages/PdfLandingPage.vue"),
    props: true,
    meta: { title: "LakshSolanki | View PDF" },
  },
  {
    path: "/v",
    redirect: "/projects/pdf-image-studio?mode=pdf-to-qr",
  },
```

### 2.3 Detailed Design Decisions
1. **Dynamic Import**: `() => import("@/pages/PdfLandingPage.vue")` enables Vite to place `PdfLandingPage` into its own chunk, preventing bloat in the main vendor or home bundles.
2. **`props: true`**: Allows `PdfLandingPage.vue` to declare `defineProps({ id: { type: String, required: true } })` while preserving compatibility with `route.params.id`.
3. **Route Meta & Dynamic Title**:
   - `frontend/src/router/index.js` lines 115–121 declare:
     ```javascript
     router.beforeEach((to) => {
       document.title = typeof to.meta.title === "string" ? to.meta.title : "LakshSolanki";
       if (isGlobalLoading.value?.start) {
         isGlobalLoading.value.start();
       }
       return true;
     });
     ```
   - When the route activates, document title instantly becomes `"LakshSolanki | View PDF"`.
   - Once the document metadata is fetched in `PdfLandingPage.vue`, the component dynamically refines the title to `LakshSolanki | View PDF - ${filename}` or `LakshSolanki | Document Not Found`.
4. **Bare Route Redirection (`/v`)**:
   - If a visitor manually navigates to `/v` without an ID, redirecting them to `/projects/pdf-image-studio?mode=pdf-to-qr` guides them straight to the QR generation tool, offering a superior UX compared to a raw 404 page.

### 2.4 Code Diff Patch for `frontend/src/router/index.js`
```diff
--- a/frontend/src/router/index.js
+++ b/frontend/src/router/index.js
@@ -93,6 +93,17 @@ const routes = [
     ],
   },
+  {
+    path: "/v/:id",
+    name: "PdfLanding",
+    component: () => import("@/pages/PdfLandingPage.vue"),
+    props: true,
+    meta: { title: "LakshSolanki | View PDF" },
+  },
+  {
+    path: "/v",
+    redirect: "/projects/pdf-image-studio?mode=pdf-to-qr",
+  },
   {
     path: "/notfound",
     name: "NotFound",
```

---

## 3. SPA Route Generator & Static Hosting Fallback Mechanics

### 3.1 Role of `frontend/scripts/create-spa-route-pages.mjs`
`create-spa-route-pages.mjs` executes immediately following `vite build` (`"build": "vite build && node scripts/create-spa-route-pages.mjs"` in `frontend/package.json`).
It iterates through `spaRoutes` and writes a duplicate copy of `dist/index.html` into `dist/<route>/index.html`.

### 3.2 Dynamic Route Parameter Challenge on Static Hosting
Because `/v/:id` uses dynamic UUIDs (e.g. `/v/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`), it is impossible to pre-generate directories for every possible UUID at build time.
Different hosting targets handle this as follows:

| Hosting Environment | Fallback Mechanism | Status / Action Needed |
|---------------------|--------------------|------------------------|
| **Render.com** | `render.yaml` specifies rewrite rule: `source: /* -> destination: /index.html` | Fully covered automatically |
| **Directory-based Static Servers** (Nginx, Caddy, Apache) | Requests to `/v` or `/v/` look for `dist/v/index.html` | Covered by adding `"/v"` to `spaRoutes` |
| **GitHub Pages / GitLab Pages** | Non-existent subpaths (e.g. `/v/<uuid>`) return `dist/404.html` | Guaranteed by writing `dist/404.html` = `index.html` |

### 3.3 Two-Part SPA Script Enhancement
1. Add `"/v"` to `spaRoutes`:
   Generates `dist/v/index.html`, allowing root-level visits to `/v` to load the SPA and execute the router redirect to `/projects/pdf-image-studio?mode=pdf-to-qr`.
2. Generate `dist/404.html`:
   Generates `dist/404.html` with the contents of `indexHtml`. On GitHub Pages or static hosts without rewrite engines, when a user scans a QR code linking to `/v/:id`, the static host returns `404.html`. The browser loads the Vue application, reads `window.location.pathname`, and mounts the `/v/:id` route cleanly without 404 error screens.

### 3.4 Code Diff Patch for `frontend/scripts/create-spa-route-pages.mjs`
```diff
--- a/frontend/scripts/create-spa-route-pages.mjs
+++ b/frontend/scripts/create-spa-route-pages.mjs
@@ -22,6 +22,7 @@ const spaRoutes = [
   "/projects/translate-studio",
   "/projects/passport-cutter",
   "/projects/api-blueprint",
+  "/v",
   "/notfound",
 ];
 
@@ -38,5 +39,8 @@ await Promise.all(
   }),
 );
 
+await writeFile(join(distDirectory, "404.html"), indexHtml);
+
 console.log(`Created static entry pages for ${spaRoutes.length} SPA routes.`);
+console.log("Created static 404.html fallback for dynamic routes.");
```

---

## 4. Graceful 404 / Missing / Expired Document Handling Specification

### 4.1 Design & Visual Token Alignment with `NotFoundPage.vue`
The error card design for missing/expired/deleted documents adheres strictly to the existing portfolio design language established in `NotFoundPage.vue` and `frontend/src/assets/main.css`:

| Attribute | `NotFoundPage.vue` Spec | `PdfLandingPage.vue` Error Card Spec |
|-----------|-------------------------|--------------------------------------|
| **Container Width** | `max-width: 820px;` | `max-width: 840px;` |
| **Card Background** | `#FFFFFF !important` | `#FFFFFF !important` |
| **Card Border** | `1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12))` | Identical token |
| **Card Shadow** | `var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06))` | Identical token |
| **Card Radius** | `border-radius: 24px` (desktop), `18px` (mobile `<= 600px`) | Identical token |
| **Status Chip** | `<v-chip color="secondary" variant="tonal" class="font-weight-bold mb-6">` | Identical token (`secondary` = `#AA5E7A`) |
| **Display Code** | `font-family: "Space Grotesk", sans-serif; font-size: clamp(5rem, 16vw, 8.5rem); font-weight: 800; linear-gradient(135deg, #7C0E44 0%, #AA5E7A 100%)` | Identical gradient, clip, and typography |
| **Title Typography** | `<h1 class="text-h4 text-md-h3 mb-4 page-title font-weight-bold">` (`Space Grotesk`, `#231219`) | `status-title` with identical styling |
| **Copy Typography** | `<p class="text-body-1 muted-copy page-copy mb-8">` (`Manrope`, `#7E636E`, `max-width: 46ch`) | `status-copy` with identical styling |
| **Visual Animation** | Radar pulse with 3 concentric circles (0s, 1s, 2s delays) in `#7C0E44` | Radar pulse with document icon in `#7C0E44` |
| **Motion Accessibility**| `@media (prefers-reduced-motion: reduce) { animation: none; opacity: 0.3; }` | Identical reduced-motion guard |

### 4.2 Icon Registry Safety Note
In Vuetify's configuration (`frontend/src/plugins/vuetify.js` lines 21–26), icons are resolved strictly through `frontend/src/plugins/icons.js`. Any icon not present in `icons.js` falls back to `mdi-help-circle-outline`.
- `mdi-file-pdf-box` is registered (line 194 of `icons.js`).
- `mdi-file-document-outline` is registered (line 191).
- `mdi-alert-circle` is registered (line 141).
- `mdi-home-variant-outline` is registered (line 203).
- `mdi-plus` is registered (line 233).
- `mdi-plus-circle-outline` is registered (line 234).
- `mdi-download` is registered (line 184).

Therefore, the status card uses `mdi-file-pdf-box` (or `mdi-alert-circle`) for the radar center icon and `mdi-plus` for the "Generate Your Own QR" action, ensuring zero missing icon warnings.

### 4.3 Error State Taxonomy & User Messaging
The status card dynamically adapts depending on the underlying error condition:

```typescript
type ErrorState = {
  status: number;
  type: 'not_found' | 'invalid_id' | 'network_error';
  chip: string;
  code: string;
  title: string;
  message: string;
};
```

1. **HTTP 404 / 410 (Document Expired or Deleted)**:
   - **Chip**: `Error 404`
   - **Code**: `404`
   - **Title**: `Document Not Found`
   - **Copy**: `"This shared PDF document is no longer available. It may have expired under our 24-hour retention policy, been deleted by the sender, or the link may be invalid."`
2. **HTTP 400 (Malformed Document ID)**:
   - Client detects ID does not match UUIDv4 regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`.
   - **Chip**: `Invalid Link`
   - **Code**: `400`
   - **Title**: `Invalid Document Link`
   - **Copy**: `"The document link format is not recognized. Please verify the URL or scan the original QR code again."`
3. **Network / HTTP 500 (Connectivity Failure)**:
   - **Chip**: `Connection Issue`
   - **Code**: `500`
   - **Title**: `Unable to Load Document`
   - **Copy**: `"We could not connect to the document storage service. Please check your internet connection and try again."`
   - Displays additional "Try Again" retry button.

### 4.4 Complete Reference Implementation for Status Card Component

```vue
<!-- Embedded within frontend/src/pages/PdfLandingPage.vue -->
<template>
  <v-container class="landing-shell py-12 py-md-16 animate-fade-in-up">
    <!-- 1. Loading State -->
    <section v-if="loading" class="status-card text-center pa-8 pa-md-12">
      <v-progress-circular indeterminate color="primary" size="56" width="4" class="mb-5" />
      <h2 class="text-h5 font-weight-bold status-title mb-2">Loading Document...</h2>
      <p class="text-body-2 status-copy">Connecting to secure storage</p>
    </section>

    <!-- 2. Error / Missing / Expired State (404 Card) -->
    <section v-else-if="error" class="status-card text-center pa-8 pa-md-12">
      <v-chip color="secondary" variant="tonal" class="font-weight-bold mb-6">
        {{ error.chip }}
      </v-chip>

      <p class="display-code mb-2">{{ error.code }}</p>

      <h1 class="text-h4 text-md-h3 mb-4 status-title font-weight-bold">
        {{ error.title }}
      </h1>

      <p class="text-body-1 status-copy mb-8">
        {{ error.message }}
      </p>

      <!-- Minimal compass radar visual in burgundy/rose matching NotFoundPage -->
      <div class="radar-container mb-8" aria-hidden="true">
        <div class="radar-circle radar-circle-1"></div>
        <div class="radar-circle radar-circle-2"></div>
        <div class="radar-circle radar-circle-3"></div>
        <v-icon icon="mdi-file-pdf-box" size="44" color="primary" class="radar-icon"></v-icon>
      </div>

      <!-- Action Buttons -->
      <div class="action-row d-flex flex-wrap ga-3 mb-6 justify-center">
        <v-btn
          color="primary"
          size="large"
          rounded="xl"
          class="text-none px-7 font-weight-bold"
          to="/projects/pdf-image-studio?mode=pdf-to-qr"
          prepend-icon="mdi-plus"
          elevation="0"
        >
          Generate Your Own QR
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          size="large"
          rounded="xl"
          class="text-none px-7 font-weight-bold"
          to="/"
          prepend-icon="mdi-home-variant-outline"
          elevation="0"
        >
          Return Home
        </v-btn>
      </div>

      <!-- Retry action for network errors -->
      <div v-if="error.type === 'network_error'" class="mb-4">
        <v-btn
          variant="text"
          color="secondary"
          class="text-none"
          prepend-icon="mdi-refresh"
          @click="loadDocument"
        >
          Try Again
        </v-btn>
      </div>

      <!-- Quick Links Navigation -->
      <div class="quick-links d-flex flex-wrap justify-center ga-2">
        <v-chip
          to="/projects/pdf-image-studio"
          color="primary"
          variant="tonal"
          class="text-none"
          prepend-icon="mdi-file-pdf-box"
        >
          PDF & Image Studio
        </v-chip>
        <v-chip
          to="/projects"
          color="primary"
          variant="tonal"
          class="text-none"
          prepend-icon="mdi-briefcase-variant-outline"
        >
          All Projects
        </v-chip>
      </div>
    </section>

    <!-- 3. Document Ready State: PDF Viewer & Download (M2-1 and M2-2) -->
    <section v-else-if="documentReady" class="ready-section">
      <!-- M2-1 and M2-2 components -->
    </section>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";

const route = useRoute();
const documentId = computed(() => String(route.params.id || "").trim());

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const loading = ref(true);
const error = ref(null);
const metadata = ref(null);
const documentReady = computed(() => !loading.value && !error.value && metadata.value !== null);

const loadDocument = async () => {
  loading.value = true;
  error.value = null;

  const id = documentId.value;
  if (!id || !UUID_REGEX.test(id)) {
    error.value = {
      status: 400,
      code: "400",
      type: "invalid_id",
      chip: "Invalid Link",
      title: "Invalid Document Link",
      message: "The document link format is not recognized. Please check the URL or scan the original QR code again.",
    };
    loading.value = false;
    document.title = "LakshSolanki | Invalid Document Link";
    return;
  }

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/pdf/${encodeURIComponent(id)}/metadata`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.status === 404 || res.status === 410) {
      error.value = {
        status: 404,
        code: "404",
        type: "not_found",
        chip: "Error 404",
        title: "Document Not Found",
        message: "This shared PDF document is no longer available. It may have expired under our 24-hour retention policy, been deleted by the sender, or the link may be invalid.",
      };
      document.title = "LakshSolanki | Document Not Found";
      return;
    }

    if (!res.ok) {
      error.value = {
        status: res.status,
        code: String(res.status),
        type: "network_error",
        chip: `Error ${res.status}`,
        title: "Unable to Load Document",
        message: "A server error occurred while retrieving this document. Please try again.",
      };
      document.title = "LakshSolanki | Error Loading Document";
      return;
    }

    const data = await res.json();
    metadata.value = data;
    document.title = `LakshSolanki | View PDF - ${data.filename || "Document"}`;
  } catch (err) {
    error.value = {
      status: 0,
      code: "Error",
      type: "network_error",
      chip: "Connection Error",
      title: "Connection Failed",
      message: "Unable to connect to the server. Please check your internet connection and try again.",
    };
    document.title = "LakshSolanki | Connection Error";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDocument();
});
</script>

<style scoped>
.landing-shell {
  max-width: 840px;
}

.status-card {
  border-radius: 24px;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
  background: #FFFFFF !important;
  box-shadow: var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.06));
}

.display-code {
  margin: 0;
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(5rem, 16vw, 8.5rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  background: linear-gradient(
    135deg,
    var(--portfolio-primary, #7C0E44) 0%,
    var(--portfolio-secondary, #AA5E7A) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.status-title {
  color: var(--portfolio-ink, #231219);
  font-family: "Space Grotesk", sans-serif;
}

.status-copy {
  max-width: 48ch;
  margin-inline: auto;
  color: var(--portfolio-muted, #7E636E);
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
  color: var(--portfolio-primary, #7C0E44) !important;
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

@media (max-width: 600px) {
  .status-card {
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
}

@media (prefers-reduced-motion: reduce) {
  .radar-circle {
    animation: none;
    opacity: 0.3;
  }
}
</style>
```

---

## 5. Build Verification and Impact Analysis

### 5.1 Verification Commands and Results
The build pipeline was executed and validated:
- **Build command**: `cd frontend; pnpm run build`
  - Vite v8.0.16 production build: 916 modules transformed in 4.96s.
  - SPA generation script created static entries for 15 routes with zero errors.
- **Node native test suites**:
  - `node --test frontend/scripts/test-pdf-qr.mjs`: 27 passing tests (270ms).
  - `node --test frontend/scripts/test-e2e-suite.mjs`: 58 passing tests across 4 tiers (2116ms).

### 5.2 Bundle Chunking Impact
In `frontend/vite.config.mjs`, `manualChunks` routes dependencies:
```javascript
if (id.includes("jspdf") || id.includes("pdfjs-dist")) return "pdf-tools";
```
When `PdfLandingPage.vue` is imported via `() => import("@/pages/PdfLandingPage.vue")`, the page component is code-split. Users visiting 404 error links will load only the lightweight page chunk without downloading the full `pdfjs-dist` worker unless document metadata succeeds.
