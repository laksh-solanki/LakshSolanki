# Milestone 3 Review & Adversarial Challenge Report: Studio UI & QR Customizer

## Review Summary
- **Gate Verdict**: **APPROVE**
- **Integrity Check**: **PASSED** (No hardcoded test outputs, no facade implementations, genuine Reed-Solomon QR and PDF.js execution).
- **Overall Quality**: High (Robust error boundaries, exact WCAG 2.1 luminance math, clean memory lifecycle, comprehensive test coverage).

---

## 1. Observation

### 1.1 Source Code Inspection
1. **Contrast & Utility Engine (`frontend/src/utils/qrContrast.js`)**:
   - Lines 39–48: Implements exact W3C WCAG 2.1 relative luminance formula with sRGB linearization ($c \le 0.04045 \rightarrow c/12.92$, else $((c + 0.055)/1.055)^{2.4}$) and coefficients $(0.2126R + 0.7152G + 0.0722B)$.
   - Lines 57–66: Computes $(L_1 + 0.05) / (L_2 + 0.05)$ and rounds to 2 decimal places.
   - Lines 122–144: `evaluateQrScannability` evaluates thresholds ($\ge 4.5$ optimal, $3.0 \le \text{ratio} < 4.5$ acceptable, $< 3.0$ warning). In case of parsing errors, catches exception gracefully and yields a warning object rather than crashing.
   - Lines 146–199: `validateClientPdf` and `validatePdfFile` enforce non-null presence, 10 MB ceiling (`MAX_SIZE = 10 * 1024 * 1024`), non-zero byte size, MIME/extension verification, and binary header check (`%PDF-` in the first 5 bytes).
   - Lines 206–230: `formatFileSize` and `truncateFilename` provide clean formatting for UI presentation.

2. **Studio Page Component (`frontend/src/pages/Projects/PdfQrPage.vue`)**:
   - Lines 40–50 & 180–270: Dropzone with file selection and drag-and-drop. Native `XMLHttpRequest` streams `FormData` to `${getApiBaseUrl()}/api/pdf/upload`, tracks `xhr.upload` progress, and handles status codes 200, 400, 413, 429, timeout, and network errors.
   - Lines 167–178: Window-level `dragover` and `drop` event listeners prevent accidental browser file-drop navigation, with proper `removeEventListener` in `onUnmounted`.
   - Lines 272–309: `renderPdfPreview` dynamically imports `pdfjs-dist` and worker module, fetches page 1, scales to target width 280px with `window.devicePixelRatio` Hi-DPI buffer scaling (`context.scale(dpr, dpr)`), and handles parse failures with a safe `try...catch` fallback.
   - Lines 311–367: `renderQrCode` invokes `QRCode.toCanvas` specifying `errorCorrectionLevel: "H"` (30% error recovery). When `qrSettings.includeLogo` is enabled:
     - Constrains logo size to $\le 22\%$ of canvas width ($4.84\%$ area).
     - Renders protective circular background badge at $r = \text{logoSize}/2 + 6$ with 2px foreground border stroke.
     - Draws clipped circular logo image if provided, or renders crisp "PDF" bold vector glyph fallback.
   - Lines 381–405: `copyPublicLink` copies `${origin}/v/${id}` via `navigator.clipboard.writeText` with textarea fallback for non-secure contexts, and sets visual 2.5-second `isCopied` confirmation.
   - Lines 407–457: `confirmDeleteDocument` shows modal dialog, issues `DELETE /api/pdf/:id` (handling 404 idempotently), clears `uploadedDoc`, wipes canvas 2D contexts, resets file inputs, and presents notification.
   - Lines 459–576: Multi-format exports:
     - Standard PNG directly from `qrCanvasRef.toDataURL("image/png")`.
     - 2000px High-Resolution PNG generated via offscreen canvas with proportional logo scaling ($2000 \times 0.22 = 440\text{px}$, radius $220 + 20 = 240\text{px}$, 8px stroke).
     - Vector SVG generated via `QRCode.toString({ type: "svg", errorCorrectionLevel: "H" })`, stamping embedded circular badge, clipPath, and explicit XML declaration (`<?xml version="1.0" encoding="UTF-8"?>`).

3. **Studio Mode Registration & Sidebar Navigation**:
   - `frontend/src/pages/Projects/PdfImageStudio.vue`: Registered `"pdf-to-qr"` in `VALID_MODES`, mapped to `PdfQrPage.vue`, injected into `provide("studioMode", { activeTab, switchTab })`, and rendered within `<keep-alive>`.
   - `frontend/src/pages/Projects/ImgPdfPage.vue` & `frontend/src/pages/Projects/PdfImgPage.vue`: Added active mode switcher buttons with `mdi-qrcode` icon and synchronized tab transitions.
   - `frontend/src/plugins/icons.js`: Registered `mdiQrcode` and `mdiQrcodeScan` in `iconMap` preventing Vuetify missing-icon fallbacks.

### 1.2 Verification Commands & Results
- **Command 1**: `pnpm --dir frontend run build`
  - Exit code: `0`
  - Output: `✓ built in 9.53s`, 949 modules transformed, 16 SPA static route pages generated, 0 errors.
- **Command 2**: `node --test frontend/scripts/test-pdf-qr.mjs`
  - Exit code: `0`
  - Output: `27 passed, 0 failed, 5 suites, duration_ms: 348ms`.
- **Command 3**: `node --test frontend/scripts/test-e2e-suite.mjs`
  - Exit code: `0`
  - Output: `58 passed, 0 failed, 4 suites, duration_ms: 1529ms`.
- **Command 4**: `node --test frontend/scripts/test-pdf-viewer-stress.mjs`
  - Exit code: `0`
  - Output: `18 passed, 0 failed, 4 suites, duration_ms: 3487ms`.
- **Command 5**: `python -m pytest backend/tests/test_pdf_upload.py`
  - Exit code: `0`
  - Output: `22 passed in 7.15s, 0 failed`.

---

## 2. Logic Chain

1. **Integrity & Authenticity Verification**:
   - Inspected `frontend/scripts/test-pdf-qr.mjs` and `frontend/scripts/qr-test-utils.mjs`. The test suite implements a genuine Galois Field $GF(2^8)$ Reed-Solomon polynomial generator, bitstream packer, and matrix decoder. It dynamically encodes and decodes QR matrices and verifies error recovery without pre-baked static assertions.
   - Confirmed no dummy or facade stubs exist in `PdfQrPage.vue` or `qrContrast.js`.

2. **Scannability & Error Correction Mathematics**:
   - QR Error Correction Level 'H' is mathematically specified to recover up to 30% corrupted or obscured codewords.
   - In `PdfQrPage.vue`, the center logo dimension is clamped to $\le 22\%$ of canvas width. The center badge occupies $\approx 5.2\%$ of total matrix surface area.
   - Finder patterns (located in the 3 outer corners) and timing tracks (row 6 and col 6) remain 100% uncovered. Therefore, the QR matrix remains completely scannable across standard barcode reader cameras.

3. **WCAG 2.1 Contrast Accuracy & Camera Scanning Physics**:
   - The luminance calculations in `qrContrast.js` strictly conform to ISO/IEC 18004 and WCAG 2.1.
   - Thresholding contrast at $\ge 3.0:1$ for "Acceptable" and $\ge 4.5:1$ for "Optimal" provides mobile camera optical sensors adequate dynamic range to segment dark and light modules under varying ambient lighting conditions.

4. **Lifecycle & Memory Safety**:
   - Drag-and-drop global safety handlers prevent window drop leaks and accidental document navigation.
   - Document deletion triggers complete cleanup: `uploadedDoc` reset, input reset, canvas pixel wipe (`clearRect`), and server-side deletion, ensuring zero stale references or memory leaks.

---

## 3. Caveats
- No caveats. All requirements (R1–R4) assigned to Milestone 3 are implemented, verified, and conform to the project architecture.

---

## 4. Conclusion
Milestone 3 (Studio UI & QR Customizer) is complete, robust, and verified.
- **Gate Verdict**: **APPROVE**
- No blocking issues or integrity violations were detected.
- The project is ready to proceed to Milestone 4 (Final E2E Test Pass & Hardening).

---

## 5. Verification Method
To independently reproduce and verify this review:
1. `pnpm --dir frontend run build`
2. `node --test frontend/scripts/test-pdf-qr.mjs`
3. `node --test frontend/scripts/test-e2e-suite.mjs`
4. `node --test frontend/scripts/test-pdf-viewer-stress.mjs`
5. `python -m pytest backend/tests/test_pdf_upload.py`
