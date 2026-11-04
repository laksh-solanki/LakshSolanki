## 2026-11-04T13:29:39Z
You are the Milestone 3 Implementation Worker: Studio UI & QR Customizer.

Working directory: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_worker_m3
Your caller / orchestrator: f95d3a59-3a8c-4581-9f3a-23cc3972df45

MANDATORY FIRST STEP:
Read c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\ORIGINAL_REQUEST.md. It contains the authoritative user requirements.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context Files & Blueprints:
Read all 3 M3 Explorer blueprints before coding:
1. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\PROJECT.md
2. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m3_1\analysis.md and handoff.md (Studio layout, mode registration in PdfImageStudio.vue, navigation in ImgPdfPage.vue/PdfImgPage.vue, icons.js)
3. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m3_2\analysis.md and handoff.md (QR generation engine, customizer, Level 'H' error correction, center logo with white circular badge, qrContrast.js WCAG 2.1 math, export downloads for PNG, 2000px high-res PNG, vector SVG)
4. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m3_3\analysis.md and handoff.md (Upload dropzone UX, client validation, POST /api/pdf/upload integration with progress, page 1 canvas thumbnail preview via pdfjs-dist, metadata card, copy link, and DELETE /api/pdf/:id with confirmation)

Scope Boundaries & Exclusive File Ownership:
You own and may ONLY edit or create these files:
- frontend/package.json (run `pnpm --dir frontend add qrcode` or edit directly and run install)
- frontend/src/plugins/icons.js
- frontend/src/utils/qrContrast.js
- frontend/src/pages/Projects/PdfQrPage.vue
- frontend/src/pages/Projects/PdfImageStudio.vue
- frontend/src/pages/Projects/ImgPdfPage.vue
- frontend/src/pages/Projects/PdfImgPage.vue

Implementation Details:
1. `frontend/package.json`: Add dependency `"qrcode": "^1.5.4"` and run `pnpm --dir frontend install`.
2. `frontend/src/plugins/icons.js`:
   - Import `mdiQrcode` and `mdiQrcodeScan` from `@mdi/js`.
   - Register `"mdi-qrcode": mdiQrcode` and `"mdi-qrcode-scan": mdiQrcodeScan` in `iconMap`.
3. `frontend/src/utils/qrContrast.js`:
   - Implement WCAG 2.1 relative luminance calculation ($L = 0.2126R + 0.7152G + 0.0722B$).
   - Implement `getContrastRatio(color1, color2)`.
   - Implement `isContrastSafe(fgColor, bgColor, minRatio = 3.0)`.
   - Implement `getContrastRating(fgColor, bgColor)`.
4. `frontend/src/pages/Projects/PdfQrPage.vue`:
   - 2-column studio layout matching `PdfImgPage.vue`.
   - Dropzone with drag-and-drop & browse button. Client validation (MIME, 10MB limit, `%PDF-` magic bytes).
   - Real-time progress bar during `POST /api/pdf/upload` to `${getApiBaseUrl()}/api/pdf/upload`.
   - After upload success:
     - Document metadata card: filename, formatted size, Active status, Expiration badge, QR status, in-tool Page 1 thumbnail preview rendered with `pdfjs-dist` on a small preview canvas.
     - Scannable QR code live preview encoding `${window.location.origin}/v/${id}` with error correction level 'H'.
     - Customization panel: foreground color, background color, display size slider, optional center logo upload with white circular protective badge (`r = logoSize/2 + 6`), contrast warning alert chip when contrast < 3.0 / 4.5, and single-click "Reset to Default" button.
     - Export downloads: Standard PNG, 2000px High-Resolution PNG for print, and Vector SVG (via `qrcode.toString(url, { type: 'svg', ... })`).
     - Copy Public Link button with clipboard copy and visual snackbar feedback.
     - Delete Document button with confirmation dialog, calling `DELETE /api/pdf/:id`, immediately tearing down state and clearing QR code on success.
5. Studio Mode Integration:
   - In `PdfImageStudio.vue`: register mode `'pdf-to-qr'` mapping to `PdfQrPage.vue`.
   - In `ImgPdfPage.vue`: add the "PDF to QR" mode button in the sidebar mode list.
   - In `PdfImgPage.vue`: add the "PDF to QR" mode button in the sidebar mode list.
6. Build and Verification:
   - Run `pnpm --dir frontend run build` (must compile cleanly with 0 errors).
   - Run `node --test frontend/scripts/test-pdf-qr.mjs`
   - Run `node --test frontend/scripts/test-e2e-suite.mjs`
   - Run `node --test frontend/scripts/test-pdf-viewer-stress.mjs`
   - Run `python -m pytest backend/tests/test_pdf_upload.py`
   - Write handoff report to `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_worker_m3\handoff.md`.
   - Send completion message when done.
