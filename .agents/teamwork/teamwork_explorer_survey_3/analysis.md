# QR Code, Public Landing Page, PDF Viewing, and Testing Architecture Analysis

**Explorer:** Explorer 3 (QR & Landing Survey Explorer)  
**Date:** 2026-11-04  
**Workspace:** `c:\Users\laksh\Documents\GitHub\LakshSolanki`

---

## Executive Summary

This investigation analyzed the repository architecture to establish the blueprint for implementing the **PDF to QR Code Generator** tool. The workspace consists of a Vue 3 / Vite / Vuetify frontend and a Python FastAPI backend.

Key discoveries:
1. **QR Code Libraries:** No QR code library is currently installed. `qrcode` (v1.5.4) is recommended as the core generation engine (pure JavaScript, works in both browser and Node.js testing environments, supports Canvas and SVG vector output, custom colors, sizing, and center logo placement). `jsqr` (v1.4.0) is recommended for programmatic decoding verification in automated tests.
2. **Public Landing Page Architecture:** The frontend utilizes `vue-router` in HTML5 history mode with Render rewrite rules (`/*` -> `/index.html`). A dedicated top-level route `/v/:id` provides an ultra-compact URL format, which is essential for keeping QR code matrix density low (Version 2-4) and maximizing mobile camera scanning speed. Missing or deleted documents can be rendered gracefully using existing design tokens derived from `NotFoundPage.vue`.
3. **PDF Viewing Capabilities:** `pdfjs-dist` (v5.7.284) is already installed in `frontend/package.json` with a working Vite worker pattern in `PdfImgPage.vue`. Canvas-based rendering is recommended over `<iframe>` / `<object>` because mobile browsers (especially iOS Safari) suffer severe rendering failures with embedded PDF iframes.
4. **Testing Infrastructure:** Python 3.14 includes `pytest` 9.1.1 and FastAPI `TestClient`, enabling robust backend testing with in-memory fixtures. Node.js v24.19.0 includes the native test runner `node --test` with `node:assert/strict`, allowing instantaneous execution of frontend QR generation and decoding suites without additional heavy test frameworks.

---

## 1. QR Code Libraries & Customization Capabilities

### 1.1 Current Workspace State
- In `frontend/package.json` (lines 17–44), no QR code generation or decoding library is present.
- In `backend/requirements.txt` and `pyproject.toml`, no Python QR library is installed.
- Search across the workspace for `qrcode` and `qr-code` confirmed zero references.

### 1.2 Library Comparison: `qrcode` vs `qr-code-styling`

| Feature | `qrcode` (v1.5.4) | `qr-code-styling` (v1.9.2) |
|---|---|---|
| **Bundle Footprint** | ~25 KB gzipped | ~150 KB+ |
| **Node.js Test Compatibility** | Native (works headless without DOM/canvas polyfills) | Requires DOM / Canvas polyfills in Node.js |
| **SVG Vector Output** | Native string `<svg>` generation via `QRCode.toString()` | Supported via internal DOM renderer |
| **Canvas Output** | Native `QRCode.toCanvas(canvas, text, opts)` | Native `qrCode.append(container)` |
| **Center Logo Overlay** | Drawn via Canvas 2D API / SVG `<image>` tag | Built-in logo property |
| **Reliability & Maintenance** | Industry standard, >12M weekly downloads | Active, specialized for custom dot shapes |

**Recommendation:** Install `qrcode` in `frontend/package.json`. It is lightweight, reliable, supports SVG and PNG outputs directly, and allows automated testing in Node.js scripts without requiring virtual browser environments.

### 1.3 QR Code Customization Engine Design

#### A. Foreground & Background Colors
`qrcode` natively accepts 8-digit or 6-digit hex RGBA strings:
```javascript
const qrOptions = {
  errorCorrectionLevel: "H",
  width: customSize, // e.g., 300px
  margin: 2,
  color: {
    dark: foregroundColor, // e.g., "#7C0E44"
    light: backgroundColor, // e.g., "#FFFFFF"
  },
};
```

#### B. Sizing & High-Resolution Export
- **Standard Preview & Export:** Renders to an on-screen `<canvas>` at 300–400px.
- **High-Resolution Export (e.g. 2000x2000px):** Render to an offscreen canvas with `width: 2000` to produce print-quality PNG files suitable for posters, flyers, and banners without pixelation.
- **SVG Vector Export:** Call `QRCode.toString(url, { type: "svg", ... })` to obtain an XML SVG string. Download using `new Blob([svg], { type: "image/svg+xml" })` and `saveAs` from `file-saver` (already installed in `frontend/package.json:24`).

#### C. Optional Center Logo Integration
When embedding a center logo:
1. **Error Correction Level:** Must be set to `H` (High), which provides **30% damage recovery**.
2. **Logo Dimension Constraints:** The logo area must not exceed 20–22% of the QR code width (e.g. for a 300px QR code, the logo should be at most 60x60px).
3. **Backdrop Shield:** When drawing the logo onto the canvas, draw a solid background badge (circular or rounded rectangle matching the QR background color with a 3–4px padding buffer). This isolates the logo graphics from adjacent QR data modules to prevent scanner confusion:
```javascript
const drawCenterLogo = (canvas, logoImg, qrSize, bgColor = "#FFFFFF") => {
  const ctx = canvas.getContext("2d");
  const logoSize = Math.floor(qrSize * 0.22);
  const centerPos = (qrSize - logoSize) / 2;
  const padding = 6;
  const badgeSize = logoSize + padding * 2;
  const badgePos = (qrSize - badgeSize) / 2;

  // Draw background badge shield
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(qrSize / 2, qrSize / 2, badgeSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw center logo image
  ctx.drawImage(logoImg, centerPos, centerPos, logoSize, logoSize);
};
```
4. **SVG Center Logo:** For SVG vector export, parse the generated SVG string and inject `<image href="${logoDataUrl}" x="${centerPos}" y="${centerPos}" width="${logoSize}" height="${logoSize}" />`.

#### D. Real-Time Contrast Checking (WCAG 2.1)
To ensure scannability across diverse phone cameras and lighting environments:
1. Calculate relative luminance ($L$):
   $$L = 0.2126 \times R + 0.7152 \times G + 0.0722 \times B$$
   where normalized $C = C_{sRGB} / 255$:
   - If $C_{sRGB} \le 0.04045$, $C = C_{sRGB} / 12.92$
   - Else $C = ((C_{sRGB} + 0.055) / 1.055)^{2.4}$
2. Contrast ratio:
   $$CR = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (L_1 > L_2)$$
3. **Thresholds & Warnings:**
   - $CR \ge 4.5:1$: Optimal scannability (Green status).
   - $3.0:1 \le CR < 4.5:1$: Moderate contrast warning (Amber status: "Low contrast may affect scan speed").
   - $CR < 3.0:1$: Severe contrast error (Red status: "Insufficient contrast. QR code may fail to scan").
   - **Inverted Color Alert:** If dark color luminance > light color luminance (light modules on dark background), display a caution flag ("Inverted colors may fail with standard camera apps").

#### E. Reset-to-Default Control
A reactive reset action reinstating standard default values:
- Foreground: `#000000`
- Background: `#FFFFFF`
- Size: `300` px
- Error Correction: `H`
- Logo: `null`

#### F. Automated Decoding Library
For automated testing, install `jsqr` (v1.4.0, zero dependencies). It takes standard `ImageData` pixel buffers (`{ data, width, height }`) and returns `{ data: "decoded_url" }`, verifying end-to-end scannability programmatically.

---

## 2. Public Landing Page Architecture & Routing

### 2.1 Route Definitions in `frontend/src/router/index.js`
The application uses `createRouter` with `createWebHistory(import.meta.env.BASE_URL)`:
```javascript
// frontend/src/router/index.js:106-112
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, _savedPosition) {
    return { top: 0 };
  },
});
```

Existing routes include:
- `/` -> `HomePage.vue`
- `/about` -> `AboutPage.vue`
- `/projects` -> `ProjectsPage.vue` (contains child routes `certificate-gen`, `pdf-image-studio`, etc.)
- `/notfound` -> `NotFoundPage.vue`
- `/:pathMatch(.*)*` -> redirect to `/notfound`

### 2.2 SPA Server Rewrites and Deep Linking
- In `render.yaml` (lines 8–11), all incoming requests rewrite to `/index.html`:
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```
- In `frontend/scripts/create-spa-route-pages.mjs` (lines 9–25), static route directories are generated during `pnpm build` for static hosting providers. Adding `/projects/pdf-image-studio` is already present.

### 2.3 Optimal Public URL Format
**Recommended Route:** `/v/:id` (e.g. `https://lakshsolanki.onrender.com/v/k7R2p9Xm1L4q`)
- **Reasoning:**
  - URL length directly dictates QR code version (grid density).
  - A short URL (~35–45 characters total) produces a Version 2 or 3 QR code (25x25 or 29x29 modules), which has large, crisp blocks that scan instantly even from several feet away or at low resolution.
  - A long URL (e.g., `/projects/pdf-image-studio/preview/123456...`) forces a Version 6+ grid (41x41 modules), making scanning sensitive to focus and reducing tolerance for center logos.
- **Route Definition in `frontend/src/router/index.js`:**
```javascript
{
  path: "/v/:id",
  name: "PdfLanding",
  component: () => import("@/pages/PdfLandingPage.vue"),
  meta: { title: "LakshSolanki | View PDF" },
}
```

### 2.4 Cryptographic Identifiers & Security
- **Identifier Generation:** Generate random, non-sequential, cryptographically secure IDs on the backend using Python's `secrets.token_urlsafe(16)` (22 characters) or `uuid.uuid4().hex` (32 characters).
- **Path Traversal Protection:**
  - Strictly validate `:id` against regex: `^[a-zA-Z0-9_-]{12,64}$`.
  - Reject any path characters (`/`, `\`, `..`, `%2f`).
  - Isolate physical file storage into a dedicated subdirectory (`backend/data/uploads/` or `backend/uploads/`), resolving absolute paths via `os.path.realpath` and verifying that the target path begins with the storage directory.

### 2.5 Handling Missing, Expired, or Deleted Documents
When a visitor accesses `/v/:id`:
1. The landing page calls `GET /api/pdf/:id`.
2. **Success (200):** Display PDF viewer and metadata (filename, size, page count, upload date, download button).
3. **Missing / Expired / Deleted (404):**
   - Render a dedicated graceful status card consistent with `NotFoundPage.vue`:
     * Chip: `v-chip color="secondary" variant="tonal"` with text "Document Expired or Removed".
     * Title: "Document Unavailable".
     * Explanation: "The PDF you are trying to view has been removed by its creator or has expired in accordance with our retention policy."
     * Action Buttons: "Generate Your Own QR" (`to="/projects/pdf-image-studio?mode=pdf-to-qr"`), "Return Home" (`to="/"`)
     * Uses portfolio CSS variables: `var(--portfolio-border-color)`, `var(--portfolio-shadow)`, `var(--portfolio-primary)`.

---

## 3. PDF Viewing Capabilities

### 3.1 Existing PDF Tools in Workspace
Inspection of `frontend/package.json` revealed:
- `pdfjs-dist`: `^5.7.284` (installed)
- `jspdf`: `^4.2.1` (installed)
- `html2canvas`: `^1.4.1` (installed)

### 3.2 Existing `pdfjs-dist` Integration Pattern
In `frontend/src/pages/Projects/PdfImgPage.vue` (lines 109–120 and 223–260), the application already demonstrates a performant, lazy-loaded Vite web worker pattern:

```javascript
// frontend/src/pages/Projects/PdfImgPage.vue:109-120
let pdfLibPromise;

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
And page rendering onto `<canvas>`:
```javascript
// frontend/src/pages/Projects/PdfImgPage.vue:223-258
const pdfjsLib = await loadPdfLib();
const arrayBuffer = await file.arrayBuffer();
const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
const page = await pdf.getPage(1);
const viewport = page.getViewport({ scale: 1.5 });
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
canvas.width = viewport.width;
canvas.height = viewport.height;
await page.render({ canvasContext: context, viewport }).promise;
```

### 3.3 Canvas Rendering vs `<iframe>` / `<object>`
| Criteria | Canvas Rendering (`pdfjs-dist`) | Embedded `<iframe>` / `<object>` |
|---|---|---|
| **iOS Safari Compatibility** | 100% reliable | Flawed (only shows page 1, scroll broken, zoom locked) |
| **Android Chrome Compatibility** | 100% reliable | Often forces download popup instead of displaying preview |
| **Custom UI & Styling** | Full control (dark mode, custom zoom, page flip) | Native browser chrome (uncontrollable styling) |
| **Mobile Experience** | Seamless touch swipe and pinch zoom | Clunky, inconsistent viewport clipping |
| **Bundle Cost** | 0 KB additional (already bundled in chunk `pdf-tools`) | 0 KB |

**Conclusion:** Canvas rendering powered by `pdfjs-dist` is the superior solution, particularly because QR codes are predominantly scanned on mobile smartphones.

### 3.4 In-Tool Creator Preview vs Public Landing Preview
1. **In-Tool Preview (`PdfQrPage.vue`):**
   - Directly renders local `File` or `ArrayBuffer` in memory.
   - Shows instant visual confirmation (Page 1 preview, page count, aspect ratio, file size) prior to or alongside upload.
2. **Public Landing Page Preview (`PdfLandingPage.vue`):**
   - Fetches binary PDF from backend endpoint (`GET /api/pdf/:id/file`).
   - Renders interactive canvas viewer with zoom controls (Fit-to-Width, 100%, 150%), pagination navigation (`< Prev`, `Next >`, `Page X of Y`), fullscreen modal, and high-visibility "Download PDF" button.

---

## 4. Testing Setup & Infrastructure

### 4.1 Current Testing Environment
1. **Frontend Testing:**
   - No external test runners (`vitest`, `jest`, `playwright`, `cypress`) are installed in `frontend/package.json`.
   - Node.js version is **v24.19.0**.
   - `frontend/scripts/test-ai-engines.mjs` establishes the testing precedent using Node's standard module system and `node:assert/strict`.
   - Node v24 features a built-in test runner (`node --test`) that executes in milliseconds without requiring external testing packages.
2. **Backend Testing:**
   - Python environment is **Python 3.14.6**.
   - `pytest` version **9.1.1** is installed and accessible via `python -m pytest`.
   - `fastapi.testclient.TestClient` is functional and tested in the environment.
   - `pypdfium2` (v5.13.0) is installed, enabling in-memory PDF parsing and synthesis during tests.

### 4.2 Automated Test Execution Architecture

```
Automated Test Pipeline
├── Frontend Test Runner: `node --test frontend/scripts/test-pdf-qr.mjs`
│   ├── Test 1: QR code generation produces valid matrix & data URL
│   ├── Test 2: Center logo positioning & error correction level 'H'
│   ├── Test 3: Contrast calculation & WCAG threshold warnings
│   ├── Test 4: Programmatic QR decoding verification via `jsqr`
│   └── Test 5: Reset-to-default state integrity
│
└── Backend Test Runner: `python -m pytest backend/tests/test_pdf_upload.py`
    ├── Test 1: Valid PDF upload, cryptographically secure ID generation
    ├── Test 2: Rejection of non-PDF MIME types and fake file extensions
    ├── Test 3: Rejection of corrupted PDFs (invalid magic bytes)
    ├── Test 4: Rejection of oversized files exceeding limit (413/400)
    ├── Test 5: Path traversal attack prevention in ID and filename
    ├── Test 6: Public link retrieval & file download endpoint
    ├── Test 7: Deletion with valid delete token & rejection with invalid token
    ├── Test 8: Public link resolution returns 404 after document deletion
    └── Test 9: Document expiration & retention policy cleanup
```

### 4.3 Synthesizing Automated Test Fixtures
Tests can construct valid, corrupted, and oversized fixtures in memory without external disk dependencies:

1. **Minimalist Valid PDF Fixture:**
```python
VALID_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
)
```
2. **Corrupted PDF Fixture:**
```python
CORRUPTED_PDF_BYTES = b"%PDF-1.4 corrupted invalid stream without xref or trailer"
```
3. **Non-PDF Fixture:**
```python
NON_PDF_BYTES = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR..."  # PNG header
```
4. **Oversized PDF Fixture:**
```python
OVERSIZED_PDF_BYTES = b"%PDF-1.4\n" + b"0" * (12 * 1024 * 1024) + b"\n%%EOF" # 12 MB
```

---

## 5. Summary of Recommended Files to Create/Update

| Target File | Status | Action / Role |
|---|---|---|
| `frontend/package.json` | Existing | Add `qrcode: "^1.5.4"`, `jsqr: "^1.4.0"` to dependencies; add `"test": "node scripts/test-ai-engines.mjs && node scripts/test-pdf-qr.mjs"` |
| `frontend/src/router/index.js` | Existing | Add `/v/:id` route pointing to `PdfLandingPage.vue`, add `pdf-qr` redirect query to `pdf-image-studio` |
| `frontend/src/pages/Projects/PdfImageStudio.vue` | Existing | Add `pdf-to-qr` tab mode to `activeTab` ref and template component switch |
| `frontend/src/pages/Projects/PdfImgPage.vue` | Existing | Add `PDF to QR Code` button in conversion mode sidebar |
| `frontend/src/pages/Projects/ImgPdfPage.vue` | Existing | Add `PDF to QR Code` button in conversion mode sidebar |
| `frontend/src/pages/Projects/PdfQrPage.vue` | **New** | In-studio PDF upload, in-tool PDF preview, QR preview, customization controls, action buttons |
| `frontend/src/pages/PdfLandingPage.vue` | **New** | Dedicated public preview & download landing page at `/v/:id` |
| `frontend/src/utils/qrContrast.js` | **New** | WCAG 2.1 contrast calculation and scannability evaluation utility |
| `frontend/scripts/test-pdf-qr.mjs` | **New** | Automated tests for QR generation, customization, contrast, and decoding |
| `backend/app/main.py` | Existing | Add endpoints `POST /api/pdf/upload`, `GET /api/pdf/{id}`, `GET /api/pdf/{id}/file`, `DELETE /api/pdf/{id}` |
| `backend/app/repositories.py` | Existing | Add `pdf_documents` collection/memory store with metadata, retention, and deletion methods |
| `backend/tests/test_pdf_upload.py` | **New** | Automated pytest suite covering upload, security, traversal, retention, and deletion |
