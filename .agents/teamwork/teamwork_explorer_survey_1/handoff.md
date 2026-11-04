# Frontend Survey Handoff Report

**Agent**: Explorer 1 (Frontend Survey Explorer)  
**Target Workspace**: `c:\Users\laksh\Documents\GitHub\LakshSolanki\frontend`  
**Working Directory**: `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_survey_1`  
**Handoff Type**: Hard (Investigation Complete)  
**Detailed Analysis**: [analysis.md](./analysis.md)

---

## 1. Observation

1. **Framework & Workspace Structure**:
   - Monorepo contains `frontend` and `backend` directories at `c:\Users\laksh\Documents\GitHub\LakshSolanki\`.
   - `frontend/package.json` specifies:
     - Framework: `"vue": "^3.5.38"`, `"vite": "^8.0.16"`, `"vuetify": "^4.1.2"`, `"vue-router": "^5.1.0"`.
     - PDF tools: `"pdfjs-dist": "^5.7.284"`, `"jspdf": "^4.2.1"`.
     - Icons: `"@mdi/js": "^7.4.47"`.
     - File utilities: `"file-saver": "^2.0.5"`, `"jszip": "^3.10.1"`.
     - Build scripts: `"build": "vite build && node scripts/create-spa-route-pages.mjs"`.
   - Node version is `v24.19.0` and package manager is `pnpm@12.16.1`. Current build executes cleanly in 7.17s creating 15 static SPA entry routes.

2. **`PdfImageStudio.vue` Structure**:
   - Located at `frontend/src/pages/Projects/PdfImageStudio.vue` (54 lines).
   - Lines 10–21 initialize and watch `route.query.mode` for `"pdf-to-img"` vs `"img-to-pdf"`.
   - Lines 33–36 provide `studioMode` via Vue `provide('studioMode', { activeTab, switchTab })`.
   - Lines 42–44 render tools inside `<keep-alive><component :is="activeTab === 'img-to-pdf' ? ImgPdfPage : PdfImgPage" /></keep-alive>`.

3. **Tool Navigation & Sidebars**:
   - In `frontend/src/pages/Projects/ImgPdfPage.vue` (lines 705–735) and `frontend/src/pages/Projects/PdfImgPage.vue` (lines 585–615), the sidebar navigation (`.studio-mode-nav`) is duplicated.
   - Mode buttons have class `.mode-list-btn` (with `.is-active` state) and invoke `switchTab('img-to-pdf')` or `switchTab('pdf-to-img')`.

4. **UI Design System & Styling**:
   - No Tailwind CSS is installed or used.
   - Theme defined in `frontend/src/plugins/vuetify.js` (lines 55–77) with palette:
     - Primary: `#7C0E44`
     - Secondary: `#AA5E7A`
     - Background: `#F2DACE`
     - Surface: `#FFFFFF`
     - Surface Soft: `#FAF3F0`
     - Ink: `#231219`
     - Muted: `#7E636E`
   - Global typography and tokens in `frontend/src/assets/main.css`: Space Grotesk (headings), Manrope (body text), JetBrains Mono (monospace/stats).
   - Card shells: `.tool-shell` (with border `var(--portfolio-border-color)`, backdrop-filter blur, box-shadow).
   - Upload dropzone: `.upload-zone` (dashed border `3px dashed rgba(124, 14, 68, 0.35)`, hover and `.drag-over` states).
   - Swatches: `.swatch-row` and `.swatch-btn` (`ImgPdfPage.vue` lines 1441–1469).

5. **Icon Tree-Shaking Registry**:
   - `frontend/src/plugins/icons.js` provides an explicit dictionary `iconMap` mapping icon strings to `@mdi/js` SVG paths.
   - If an icon is not in `icons.js`, `frontend/src/plugins/vuetify.js` lines 21–25 falls back to `mdi-help-circle-outline` (question mark).
   - `@mdi/js` contains `mdiQrcode` and `mdiQrcodeScan`, but they are **not yet registered** in `icons.js`.

6. **Routing & Static Deployment**:
   - `frontend/src/router/index.js` routes `/projects/pdf-image-studio` and redirects `/projects/img-pdf` and `/projects/pdf-img`.
   - `frontend/scripts/create-spa-route-pages.mjs` has an explicit `spaRoutes` list of 15 paths that generates static `index.html` copies upon `pnpm run build`.
   - `render.yaml` sets up static web hosting with a rewrite rule `source: /* destination: /index.html`.

7. **Backend API Baseline**:
   - Backend is a Python FastAPI service located at `backend/` running on port 5001 locally (`http://localhost:5001`) and configured in `frontend/.env` via `VITE_API_URL_1`.
   - `frontend/src/utils/apiBaseUrl.js` dynamically exports `getApiBaseUrl()`.

---

## 2. Logic Chain

1. **Architecture Alignment**:
   - Since `PdfImageStudio.vue` dynamically renders sub-pages using `keep-alive` based on `activeTab` / `route.query.mode` (Observation 2), adding the PDF to QR Code generator requires introducing a third mode component `PdfQrPage.vue` alongside `ImgPdfPage.vue` and `PdfImgPage.vue`.
   - By following the exact component contract (injecting `studioMode`, receiving query mode), existing tools will remain unaffected and state will be preserved during tab switches.

2. **Navigation Parity**:
   - Because `ImgPdfPage.vue` and `PdfImgPage.vue` each contain a sidebar mode switcher (Observation 3), a third button for "PDF to QR Code" must be added to both existing components as well as the new `PdfQrPage.vue`.
   - Clicking the button calls `switchTab('pdf-to-qr')`, updating the URL to `/projects/pdf-image-studio?mode=pdf-to-qr`.

3. **Visual & UI Consistency**:
   - Reusing `.tool-shell`, `.upload-zone`, `.swatch-btn`, `.progress-shell`, `<Alerts>`, and `<v-btn>` with primary color `#7C0E44` (Observation 4) guarantees full visual consistency with the existing design system without new styling frameworks.
   - The responsive 2-column grid (`cols="12" md="4" lg="3"` for sidebar, `cols="12" md="8" lg="9"` for workspace) ensures mobile, tablet, and desktop viewports are handled cleanly.

4. **Public Preview Landing Page**:
   - Requirements R1 & R2 mandate a public URL pointing to a dedicated landing page on the website that previews the PDF and provides a download action.
   - Creating `frontend/src/pages/Projects/PdfSharePreview.vue` mapped to route `/share/pdf/:id` fulfills this requirement cleanly.
   - Updating `frontend/scripts/create-spa-route-pages.mjs` ensures direct visits to the landing page do not cause static 404s (Observation 6).

5. **Icon Reliability**:
   - Because Vuetify uses a custom resolver mapping to `icons.js` (Observation 5), `mdiQrcode` and `mdiQrcodeScan` must be explicitly added to `frontend/src/plugins/icons.js` so the QR icon renders properly rather than displaying a fallback question mark.

6. **QR Code Generation**:
   - Generating scannable QR codes with center logo, foreground/background customization, and PNG/SVG export requires a lightweight client library.
   - The `qrcode` package is pure JavaScript, browser-compatible, supports canvas and SVG rendering, and handles high error correction (`'H'`) required for center logo insertion.

---

## 3. Caveats

1. **Backend Integration**: This survey investigated the frontend architecture. Backend API endpoints (`POST /api/pdf/upload`, `GET /api/pdf/:id`, `DELETE /api/pdf/:id`) must be implemented or verified by the backend agent to ensure matching JSON schemas and CORS headers.
2. **Center Logo Dimensions**: When placing an optional center logo on the QR code, the logo must occupy no more than 20–25% of the QR code area with a white protective margin to guarantee scanning reliability across standard mobile QR scanners.
3. **No Caveats Regarding Existing Tools**: Existing tools (`ImgPdfPage.vue`, `PdfImgPage.vue`) do not require invasive rewrites; only adding the 3rd navigation button to their mode switcher is needed.

---

## 4. Conclusion

The existing `PdfImageStudio` frontend architecture is cleanly modularized, making the integration of the PDF to QR Code Generator straightforward:
1. Create `frontend/src/pages/Projects/PdfQrPage.vue` implementing the 2-column studio layout, upload dropzone, PDF.js thumbnail preview, QR code customizer (colors, size, center logo, PNG/SVG download), public link management (copy, open, delete), and error banners.
2. Update `frontend/src/pages/Projects/PdfImageStudio.vue` to import and switch to `PdfQrPage.vue` when `mode === 'pdf-to-qr'`.
3. Update sidebar mode buttons in `ImgPdfPage.vue` and `PdfImgPage.vue` to include `PDF to QR Code`.
4. Create dedicated public landing page `frontend/src/pages/Projects/PdfSharePreview.vue` and register route `/share/pdf/:id` in `frontend/src/router/index.js` and `frontend/scripts/create-spa-route-pages.mjs`.
5. Register `mdiQrcode` and `mdiQrcodeScan` in `frontend/src/plugins/icons.js`.
6. Add `qrcode` package to `frontend/package.json`.

---

## 5. Verification Method

1. **Static Build Verification**:
   Execute the project build command:
   ```powershell
   cd frontend
   pnpm run build
   ```
   *Expected outcome*: Vite compiles without errors, generates chunks (including `PdfImageStudio` and `pdf-tools`), and `create-spa-route-pages.mjs` completes with exit code 0.

2. **Route Resolution Check**:
   Inspect `dist/` after build to verify that:
   - `dist/projects/pdf-image-studio/index.html` exists
   - `dist/share/pdf/index.html` exists

3. **Icon Verification**:
   Inspect `frontend/src/plugins/icons.js` to ensure `mdiQrcode` is exported and mapped to `"mdi-qrcode"`.

4. **Integration Inspection**:
   View `frontend/src/pages/Projects/PdfImageStudio.vue` to confirm `PdfQrPage` is registered and reactive to query mode `pdf-to-qr`.

5. **Invalidation Conditions**:
   - If `pnpm run build` throws bundling or syntax errors.
   - If switching to `?mode=pdf-to-qr` does not render `PdfQrPage`.
   - If the QR icon renders as `mdi-help-circle-outline`.
