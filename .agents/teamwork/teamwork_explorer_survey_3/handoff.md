# Handoff Report — Explorer 3: QR & Landing Survey Explorer

**Date:** 2026-11-04  
**Author:** Explorer 3 (`teamwork_explorer_survey_3`)  
**Recipient:** Orchestrator (`f95d3a59-3a8c-4581-9f3a-23cc3972df45`)  
**Status:** Hard Handoff (Investigation Complete)

---

## 1. Observation

### 1.1 QR Code Libraries
- In `frontend/package.json` lines 17–44, dependencies include:
  ```json
  "dependencies": {
    "@fontsource/jetbrains-mono": "^5.2.8",
    "@fontsource/manrope": "^5.2.8",
    "@fontsource/roboto": "5.2.10",
    "@fontsource/space-grotesk": "^5.2.10",
    "@mdi/js": "^7.4.47",
    "dompurify": "^3.4.11",
    "file-saver": "^2.0.5",
    "firebase": "12.11.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "jszip": "^3.10.1",
    "marked": "^18.0.5",
    "pdfjs-dist": "^5.7.284",
    "pinia": "^3.0.4",
    "vue": "^3.5.38",
    "vue-router": "^5.1.0",
    "vuetify": "^4.1.2"
  }
  ```
  Neither `qrcode` nor `qr-code-styling` is installed.
- In `backend/requirements.txt` and `pyproject.toml`, no QR code library is installed.
- Running `pnpm info qrcode version` returned `1.5.4`.
- Running `pnpm info jsqr version` returned `1.4.0`.
- Running `pnpm info qr-code-styling version` returned `1.9.2`.

### 1.2 Routing and Public Landing Page Architecture
- In `frontend/src/router/index.js` lines 5–23 and 94–104:
  Routes are configured with `createWebHistory(import.meta.env.BASE_URL)`. Top-level paths include `/`, `/about`, `/projects` (with subroutes `certificate-gen`, `pdf-image-studio`, etc.), `/notfound`, and `/:pathMatch(.*)* -> redirect: /notfound`.
- In `render.yaml` lines 8–11:
  ```yaml
  routes:
    - type: rewrite
      source: /*
      destination: /index.html
  ```
  All deep paths on Render are rewritten to `/index.html`, allowing dynamic SPA client routes.
- In `frontend/scripts/create-spa-route-pages.mjs` lines 9–25:
  Defines `spaRoutes` which are cloned from `dist/index.html` during `pnpm build` to support static hosts without server rewrite support.
- In `frontend/src/pages/NotFoundPage.vue` lines 19–59:
  Implements 404 UI using portfolio tokens: `var(--portfolio-border-color, rgba(124, 14, 68, 0.12))`, `var(--portfolio-shadow)`, `var(--portfolio-primary)`, `Space Grotesk` typography, and action buttons (`Go Back`, `Go Home`).
- In `frontend/src/pages/Projects/PdfImageStudio.vue` lines 10–36:
  Manages studio tabs via `activeTab` ref (`pdf-to-img` vs `img-to-pdf`), synchronized to `route.query.mode` and provided to child components via `provide("studioMode", { activeTab, switchTab })`.

### 1.3 PDF Viewing Capabilities
- In `frontend/package.json` line 30, `pdfjs-dist` version `^5.7.284` is already installed.
- In `frontend/src/pages/Projects/PdfImgPage.vue` lines 109–120:
  ```javascript
  let pdfLibPromise;
  const loadPdfLib = async () => {
    if (!pdfLibPromise) {
      pdfLibPromise = Promise.all([import("pdfjs-dist/build/pdf"), import("pdfjs-dist/build/pdf.worker.mjs?url")]).then(
        ([pdfjsLib, workerModule]) => {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
          return pdfjsLib;
        },
      );
    }
    return pdfLibPromise;
  };
  ```
  and lines 244–258 render PDF pages to an HTML5 `<canvas>` via `await page.render({ canvasContext: context, viewport }).promise`.
- `vue-pdf` is not installed and is not needed because `pdfjs-dist` is already installed and preconfigured with the Vite web worker loader.

### 1.4 Testing Setup and Infrastructure
- In `frontend/scripts/test-ai-engines.mjs` lines 1–15:
  Node.js tests are written in pure ESM using `import assert from "node:assert/strict"`. Running `node frontend/scripts/test-ai-engines.mjs` exited with code 0: `ALL VERIFICATION SUITES PASSED CLEANLY!`.
- Node.js version in environment: `v24.19.0`. Executing `node --input-type=module -e "import { test } from 'node:test'; import assert from 'node:assert'; test('example', () => { assert.strictEqual(1, 1); });"` exited with code 0 (`pass 1, fail 0`).
- Python version in environment: `Python 3.14.6`.
- Running `python -m pytest --version` returned `pytest 9.1.1`.
- Running `python -c "from fastapi.testclient import TestClient; print('TestClient OK')"` returned `TestClient OK`.
- Running `python -c "import pypdfium2 as pdfium; pdf = pdfium.PdfDocument(b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n'); print('Page count:', len(pdf))"` exited with code 0 (`Page count: 1`).

---

## 2. Logic Chain

1. **QR Code Engine Selection:**
   - Observations 1.1 and 1.4 establish that no QR code package is currently installed, but `qrcode` (v1.5.4) and `jsqr` (v1.4.0) are available on the npm registry.
   - `qrcode` has zero dependencies, weighs ~25KB, outputs directly to HTML5 Canvas and raw SVG strings (`QRCode.toString`), and runs identically in browser and Node.js testing environments without requiring DOM/Canvas mocks.
   - To satisfy Requirement R2 (colors, sizing, center logo, PNG/SVG exports, contrast checking):
     * Colors are handled by `options.color.dark` and `options.color.light`.
     * Center logo is handled by rendering at error correction level `H` (30% recovery) and overlaying the logo with a protective background badge onto Canvas and SVG.
     * High-resolution PNG is produced by generating onto an offscreen canvas at 2000x2000px.
     * Real-time contrast checking is implemented using WCAG 2.1 relative luminance ($CR \ge 4.5:1$ optimal, $<3.0:1$ warning).
     * `jsqr` allows automated programmatic decoding of the generated QR codes in automated unit tests.

2. **Public Landing Page URL & Route Design:**
   - Observations 1.2 show that `vue-router` in history mode and `render.yaml` rewrite rules (`/*` -> `/index.html`) support arbitrary deep routes.
   - Requirement R2 mandates scannable QR codes that encode the public PDF URL. QR code data density increases with URL length; longer URLs produce higher QR versions with smaller modules that degrade scan reliability on mobile cameras.
   - Therefore, a short, clean top-level path `/v/:id` (e.g. `https://domain.com/v/k7R2p9Xm1L4q`) is strictly superior to a verbose path like `/projects/pdf-image-studio/preview/:id`.
   - Observation 1.2 shows `NotFoundPage.vue` provides existing design tokens (`var(--portfolio-primary)`, `var(--portfolio-border-color)`, `Space Grotesk`) to render missing/expired/deleted states seamlessly when backend returns 404.

3. **PDF Viewing Implementation:**
   - Observation 1.3 shows `pdfjs-dist` (v5.7.284) is already installed and bundled in Vite's `pdf-tools` chunk with an active worker loader in `PdfImgPage.vue`.
   - Browser `<iframe src="file.pdf">` and `<object>` fail on mobile devices (especially iOS Safari, where iframes freeze, cannot scroll multi-page PDFs, and cannot pinch-to-zoom).
   - Canvas-based rendering with `pdfjs-dist` works universally across desktop and mobile, supports pinch/zoom, pagination controls, and full styling harmony.

4. **Automated Testing Strategy:**
   - Observation 1.4 confirms that `pytest` 9.1.1 and `fastapi.testclient.TestClient` are functional in Python, and `node --test` is built into Node 24.
   - Backend tests can run with `python -m pytest backend/tests/test_pdf_upload.py`, synthesizing valid, corrupt, and oversized PDF bytes in memory using Python byte streams.
   - Frontend tests can run with `node --test frontend/scripts/test-pdf-qr.mjs`, verifying QR code generation, contrast checking, error correction, and decoding via `jsqr`.

---

## 3. Caveats

1. **Storage Backend Selection:**
   - The workspace currently uses an in-memory repository fallback if `MONGODB_URI` is absent (`backend/app/database.py:40-46`). The implementer must ensure uploaded PDF binaries and metadata are stored consistently whether running with MongoDB GridFS or local directory storage (`backend/uploads/` with gitignore).
2. **Body Size Limits:**
   - In `backend/app/config.py:108`, `max_request_body_bytes` defaults to 262,144 bytes (256 KB). For PDF uploads up to 10MB or 25MB, the upload endpoint must allow multipart form streams exceeding this 256KB default.
3. **No Caveats in Survey Scope:** All assigned areas (QR libraries, landing page architecture, PDF viewing, testing setup) were comprehensively investigated.

---

## 4. Conclusion

1. **QR Code Stack:** Recommend installing `qrcode` (v1.5.4) for canvas and SVG generation with error correction level `H`, and `jsqr` (v1.4.0) for automated test verification.
2. **Public Landing Route:** Recommend route path `/v/:id` pointing to `frontend/src/pages/PdfLandingPage.vue`, backed by cryptographically random 16-byte base64url or UUID identifiers.
3. **PDF Viewing Stack:** Recommend canvas-based rendering via existing `pdfjs-dist` (v5.7.284), reusing the Vite worker loader pattern from `PdfImgPage.vue`.
4. **Testing Stack:**
   - Frontend: Node.js 24 native test runner (`node --test frontend/scripts/test-pdf-qr.mjs`).
   - Backend: `pytest` with `TestClient` (`python -m pytest backend/tests/test_pdf_upload.py`).

---

## 5. Verification Method

To independently verify all observations and conclusions:

1. **Verify QR library availability on npm:**
   ```powershell
   pnpm info qrcode version
   pnpm info jsqr version
   ```
   *Expected result:* Outputs `1.5.4` and `1.4.0`.

2. **Verify Node.js built-in test runner:**
   ```powershell
   node --input-type=module -e "import { test } from 'node:test'; import assert from 'node:assert'; test('example', () => { assert.strictEqual(1, 1); });"
   ```
   *Expected result:* Outputs `✔ example ... pass 1, fail 0`.

3. **Verify Python test runner and FastAPI TestClient:**
   ```powershell
   python -m pytest --version
   python -c "from fastapi.testclient import TestClient; print('TestClient OK')"
   ```
   *Expected result:* Outputs `pytest 9.1.1` and `TestClient OK`.

4. **Verify in-memory PDF synthesis with pypdfium2:**
   ```powershell
   python -c "import pypdfium2 as pdfium; pdf = pdfium.PdfDocument(b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n'); print('Page count:', len(pdf))"
   ```
   *Expected result:* Outputs `Page count: 1`.

5. **Inspect key architecture files:**
   - `frontend/src/pages/Projects/PdfImgPage.vue` (lines 109–120 and 223–258 for `pdfjs-dist` pattern)
   - `frontend/src/router/index.js` (lines 5–23 and 94–104 for route hierarchy)
   - `frontend/src/pages/Projects/PdfImageStudio.vue` (lines 10–36 for studio mode switching)
   - `backend/app/main.py` and `backend/app/repositories.py` (for endpoint and repository structure)
