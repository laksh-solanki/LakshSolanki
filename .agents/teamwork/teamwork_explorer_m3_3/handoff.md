# Handoff Report: File Lifecycle, Upload UX & Thumbnail Preview Specialist

**Agent**: Explorer 3 (`teamwork_explorer_m3_3`)  
**Mission**: Investigate and produce the comprehensive architectural blueprint for PDF Upload UX, Client-Side Validation, Backend Integration, In-Tool Page 1 Thumbnail Preview, and File & Link Management Controls in `PdfQrPage.vue`.  
**Working Directory**: `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m3_3`  
**Caller / Orchestrator**: `f95d3a59-3a8c-4581-9f3a-23cc3972df45`  

---

## 1. Observation

1. **Existing Dropzone UX & Styling**:
   - `frontend/src/pages/Projects/PdfImgPage.vue` lines 819–851 defines the studio dropzone using `<v-sheet :class="['upload-zone', 'upload-zone-lg', { 'drag-over': isDragging }]">` containing `mdi-cloud-upload-outline` (size 80), `.feature-chip` badges, and a primary flat button `Choose PDF File`.
   - `frontend/src/assets/main.css` lines 428–440 defines the global `.upload-zone` tokens:
     ```css
     .upload-zone {
       border: 1.5px dashed var(--portfolio-border-strong) !important;
       background: var(--portfolio-surface-soft) !important;
       color: var(--portfolio-ink-soft) !important;
       border-radius: 16px;
       transition: all 0.2s ease;
     }
     .upload-zone:hover,
     .upload-zone.drag-over {
       border-color: var(--portfolio-primary) !important;
       background: rgba(124, 14, 68, 0.04) !important;
     }
     ```
2. **Backend Upload & Deletion Contracts**:
   - `backend/app/main.py` lines 595–661:
     - Endpoint `POST /api/pdf/upload` accepts multipart `file: UploadFile`.
     - Validates rate limit (10/min, returning 429 with `Retry-After`), MIME type (400 if invalid), size ceiling 10 MB (413 if exceeded), and binary magic header `b"%PDF-"` + trailer `b"%%EOF"` (400 if corrupted).
     - Returns HTTP 200 with JSON:
       ```json
       {
         "status": "success",
         "id": "<uuid4>",
         "filename": "<name>",
         "size": 12345,
         "url": "/v/<uuid4>",
         "expires_at": "ISO8601"
       }
       ```
   - `backend/app/main.py` lines 729–740:
     - Endpoint `DELETE /api/pdf/{id}` validates UUID4 format, removes file via repository, and returns 200 `{"status": "deleted", "id": id}` or 404 `{"detail": "Document not found or already deleted."}`.
3. **PDF.js Thumbnail Rendering Reference**:
   - `frontend/src/pages/PdfLandingPage.vue` lines 570–582 and `PdfImgPage.vue` lines 109–120 demonstrate dynamic loading of `pdfjs-dist`:
     ```js
     pdfLibPromise = Promise.all([
       import("pdfjs-dist/build/pdf"),
       import("pdfjs-dist/build/pdf.worker.mjs?url"),
     ]).then(([pdfjsLib, workerModule]) => {
       pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
       return pdfjsLib;
     });
     ```
   - Page 1 thumbnail can be rendered by calling `pdf.getPage(1)` and executing `page.render({ canvasContext, viewport })` onto an HTML5 canvas element with high-DPI device pixel ratio scaling.
4. **Automated Test Suite Status**:
   - Executed `node --test frontend/scripts/test-pdf-qr.mjs`: 27 passing tests (100%).
   - Executed `node --test frontend/scripts/test-e2e-suite.mjs`: 58 passing tests (100%), including:
     - `T1-VAL-01..05`: Client-side MIME validation, uppercase extensions, size formatting, filename truncation.
     - `T2-VAL-01..04`: Null files, non-PDF rejection, 10 MB ceiling, 0-byte rejection.
     - `T1-UPL-01..05`: Multipart upload, UUID format, 24h expiration timestamp.
     - `T1-DEL-01`: Document deletion returning `status: deleted`.
     - `T1-CPY-01`: Public URL clipboard construction `${origin}/v/${id}`.

---

## 2. Logic Chain

1. From **Observation 1**, `PdfImgPage.vue` establishes the gold standard UX pattern for file ingestion in the studio workspace. Adopting the identical `<v-sheet class="upload-zone upload-zone-lg">` structure ensures seamless visual consistency across studio tabs.
2. From **Observation 2**, the backend strictly enforces 10 MB size limits, MIME types, and `%PDF-` binary magic bytes. Performing synchronous MIME/size checks and a fast 5-byte asynchronous slice (`file.slice(0, 5)`) on the client provides instant user feedback before incurring network latency or hitting server rate limits.
3. From **Observation 2**, `POST /api/pdf/upload` returns specific HTTP status codes (200, 400, 413, 429). Using an `XMLHttpRequest` wrapper allows tracking upload progress percentage in real time (`xhr.upload.onprogress`) and parsing headers like `Retry-After` for friendly rate-limit warnings.
4. From **Observation 3**, `pdfjs-dist` is already installed and bundled with a Web Worker URL resolver. Reusing this loader enables in-tool Page 1 canvas preview rendering directly from the local `File` or `ArrayBuffer` without round-tripping to the server.
5. From **Observation 2 and 4**, document deletion via `DELETE /api/pdf/:id` invalidates server storage. To ensure UX integrity, deleting a document must trigger complete local state teardown (resetting `uploadedDoc`, clearing the thumbnail canvas, resetting the file input, and clearing the generated QR code).

---

## 3. Caveats

- **Network Mode**: The investigation was conducted in local development mode against the contract specification and test harnesses. In live production environments, Vercel serverless function payload limits (4.5 MB on Hobby) may apply unless configured with Fluid Compute / Vercel Blob or large function settings, though the dual-mode repository handles standard deployments.
- **Clipboard API Permissions**: `navigator.clipboard.writeText` requires a secure context (`https://` or `localhost`). A fallback using hidden textarea `document.execCommand('copy')` is provided in the blueprint to guarantee clipboard support in all browser contexts.

---

## 4. Conclusion

The architectural blueprint for Domain 3 is complete and documented in `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m3_3\analysis.md`. The design provides:
1. **Upload UX**: Full drag-and-drop dropzone matching `PdfImgPage.vue` with window-level drag event suppression.
2. **Client Validation**: Comprehensive pre-upload validation covering MIME types, extensions, 10 MB limit, empty files, and 5-byte `%PDF-` magic header checks.
3. **Backend Integration**: Robust XHR-based upload with progress percentage tracking and status code handlers (200, 400, 413, 429).
4. **Page 1 Thumbnail**: High-DPI canvas rendering using `pdfjs-dist` with page count badge.
5. **Lifecycle Controls**: Metadata display card, working Copy Link action with 2.5s feedback state, and working Delete action with modal confirmation dialog and full state reset.

All required icons are confirmed present in `frontend/src/plugins/icons.js`. The M3 implementer can drop these components directly into `frontend/src/pages/Projects/PdfQrPage.vue`.

---

## 5. Verification Method

To independently verify the investigation and ensure the specifications hold:
1. **Run QR & Scannability Test Suite**:
   ```powershell
   node --test frontend/scripts/test-pdf-qr.mjs
   ```
   *Expected*: All 27 tests pass.
2. **Run Full 4-Tier E2E Test Suite**:
   ```powershell
   node --test frontend/scripts/test-e2e-suite.mjs
   ```
   *Expected*: All 58 tests pass, confirming contract compliance for upload, validation, deletion, and public URL resolution.
3. **Inspect Specification Blueprint**:
   Examine `c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m3_3\analysis.md` for the complete Vue 3 Composition API implementation code.
