# Challenger 1 Report: Milestone 3 (Studio UI & QR Customizer)

## Gate Verdict: APPROVE

---

## 1. Observation
An empirical adversarial test suite `frontend/scripts/test-challenger-m3-validation.mjs` was authored and executed, targeting client-side upload validation, filename/filesize boundary formatting, binary header integrity checking, and backend deletion lifecycle invalidation.

Direct command executions and results:

1. **Challenger Automated Adversarial Test Suite**:
   - Command: `node --test frontend/scripts/test-challenger-m3-validation.mjs`
   - Output:
     ```text
     ▶ Suite 1: Client-Side Upload Validation (validateClientPdf)
       ✔ T1-VAL-01: Rejects null, undefined, or missing file object (1.3508ms)
       ✔ T1-VAL-02: Accepts valid PDF file with standard MIME and .pdf extension (0.2125ms)
       ✔ T1-VAL-03: Accepts valid PDF with uppercase or mixed-case extension (.PDF) (0.2121ms)
       ✔ T1-VAL-04: Rejects non-PDF MIME types (image/png, application/zip, text/plain) (0.2381ms)
       ✔ T1-VAL-05: Rejects empty MIME type without .pdf extension (0.1485ms)
       ✔ T1-VAL-06: Accepts file with missing MIME type but valid .pdf extension (browser fallback) (0.147ms)
       ✔ T1-VAL-07: Accepts exact 10 MB boundary file (10 * 1024 * 1024 bytes) (0.1231ms)
       ✔ T1-VAL-08: Rejects file exceeding 10 MB by just 1 byte (10 * 1024 * 1024 + 1) (0.2039ms)
       ✔ T1-VAL-09: Rejects massively oversized file (50 MB) (1.8671ms)
       ✔ T1-VAL-10: Rejects zero-byte empty file (0 bytes) (0.468ms)
     ✔ Suite 1: Client-Side Upload Validation (validateClientPdf) (7.0997ms)
     ▶ Suite 2: Deep Binary Magic Byte Validation (validatePdfFile)
       ✔ T2-BIN-01: Accepts valid PDF buffer with %PDF- header and %%EOF trailer (1.4138ms)
       ✔ T2-BIN-02: Rejects corrupted buffer missing %PDF- header (0.6475ms)
       ✔ T2-BIN-03: Rejects truncated buffer of fewer than 5 bytes (0.6035ms)
       ✔ T2-BIN-04: Rejects binary image masquerading as PDF with image magic bytes (0.343ms)
       ✔ T2-BIN-05: Propagates basic validation failures without attempting slice (0.4173ms)
       ✔ T2-BIN-06: Gracefully accepts mock object without slice function if basic check passes (0.1783ms)
     ✔ Suite 2: Deep Binary Magic Byte Validation (validatePdfFile) (4.1755ms)
     ▶ Suite 3: Filename Formatting & Truncation (truncateFilename)
       ✔ T3-NAM-01: Handles empty, null, or undefined filenames without crashing (0.7289ms)
       ✔ T3-NAM-02: Returns filenames shorter than or equal to maxLength untouched (0.3282ms)
       ✔ T3-NAM-03: Truncates 50-character filename while preserving .pdf extension (0.2956ms)
       ✔ T3-NAM-04: Truncates 100+ character filename to specified maxLength with extension intact (0.1769ms)
       ✔ T3-NAM-05: Handles Unicode emojis and multi-byte characters in filenames (0.118ms)
       ✔ T3-NAM-06: Handles long filenames without extensions (0.0866ms)
       ✔ T3-NAM-07: Gracefully handles extremely small maxLength where keep <= 0 (0.2814ms)
     ✔ Suite 3: Filename Formatting & Truncation (truncateFilename) (2.4469ms)
     ▶ Suite 4: File Size Formatting Across Boundaries (formatFileSize)
       ✔ T4-SIZ-01: Formats 0 bytes, null, and falsy values as "0 B" (0.2486ms)
       ✔ T4-SIZ-02: Formats byte values below 1 KB as "X B" (0.1252ms)
       ✔ T4-SIZ-03: Formats 1 KB and fractional KB values (0.0922ms)
       ✔ T4-SIZ-04: Formats 1 MB and multi-MB values (0.0829ms)
       ✔ T4-SIZ-05: Formats 9.9 MB boundary value accurately (0.0927ms)
       ✔ T4-SIZ-06: Formats 10 MB upload ceiling limit accurately (0.0668ms)
       ✔ T4-SIZ-07: Formats 10.1 MB (exceeds limit) accurately (0.1026ms)
     ✔ Suite 4: File Size Formatting Across Boundaries (formatFileSize) (1.0405ms)
     ▶ Suite 5: Backend Deletion & Document Lifecycle Invalidation
       ✔ T5-SETUP: Runs backend lifecycle test harness (7696.6915ms)
       ✔ T5-LIF-01: Verifies initial upload succeeds and active endpoints return 200 OK (0.2947ms)
       ✔ T5-LIF-02: Verifies DELETE /api/pdf/{id} returns 200 OK with status="deleted" (0.1809ms)
       ✔ T5-LIF-03: Verifies complete lifecycle invalidation (404 across all retrieval routes) (0.146ms)
       ✔ T5-LIF-04: Verifies repeated DELETE on already deleted ID returns 404 Not Found (0.126ms)
       ✔ T5-LIF-05: Verifies deletion of non-existent UUID returns 404 Not Found (0.1562ms)
       ✔ T5-LIF-06: Verifies malformed non-UUID IDs return 400 Bad Request and traversal attempts return 404 (0.1344ms)
     ✔ Suite 5: Backend Deletion & Document Lifecycle Invalidation (7698.0582ms)
     ℹ tests 37
     ℹ suites 5
     ℹ pass 37
     ℹ fail 0
     ℹ duration_ms 7936.584
     ```

2. **QR Code Engine & Customization Unit Tests**:
   - Command: `node --test frontend/scripts/test-pdf-qr.mjs`
   - Output: `27 passed, 0 failed` (duration: 2093ms).

3. **Milestone End-to-End Test Suite**:
   - Command: `node --test frontend/scripts/test-e2e-suite.mjs`
   - Output: `58 passed, 0 failed` (duration: 1693ms).

4. **Viewer Stress Test Suite**:
   - Command: `node --test frontend/scripts/test-pdf-viewer-stress.mjs`
   - Output: `18 passed, 0 failed` (duration: 2508ms).

5. **Backend Pytest Suite**:
   - Command: `python -m pytest backend/tests/test_pdf_upload.py`
   - Output: `22 passed, 1 warning in 9.78s`.

6. **Frontend Production Build**:
   - Command: `pnpm --dir frontend run build`
   - Output: `built in 10.54s`, 0 errors, static entry pages and 404.html generated.

---

## 2. Logic Chain
1. **Client-Side Upload Boundaries & MIME Robustness**:
   - `validateClientPdf` in `frontend/src/utils/qrContrast.js:152-170` checks `file.type === "application/pdf"` and fallback `file.name.toLowerCase().endsWith(".pdf")`.
   - Empirically tested with non-PDF MIME types (`image/png`, `application/zip`, `text/plain`, empty string): correctly returns `{ valid: false, error: "Please upload a valid PDF document." }`.
   - Tested boundary condition: Exactly `10 * 1024 * 1024` bytes (10 MB) passes validation; `10 * 1024 * 1024 + 1` bytes immediately fails with `"File size exceeds 10 MB limit."`.
   - Zero-byte files (`file.size === 0`) are caught and rejected with `"File is empty (0 bytes)."`. Missing/null/undefined inputs return `"No file provided."`.

2. **Binary Header Integrity Verification**:
   - `validatePdfFile` in `frontend/src/utils/qrContrast.js:177-199` slices the first 5 bytes and converts to string.
   - Tested against corrupted buffers (`NOT_A_PDF`, PNG header `0x89PNG`, truncated 3-byte `%PD`): all rejected with `"Corrupted PDF file: Missing '%PDF-' binary header."`.
   - Verified that valid PDF buffer starting with `%PDF-` passes validation.

3. **String & Number Formatting Stability**:
   - `truncateFilename` in `frontend/src/utils/qrContrast.js:220-230` preserves file extensions (`.pdf`) while truncating base names. Tested across empty, 20-character, 50-character, 120-character, and Unicode emoji (`📄_quarterly...pdf`) inputs: correctly constrains length to `maxLength` without throwing or truncating the `.pdf` extension.
   - `formatFileSize` in `frontend/src/utils/qrContrast.js:206-212` accurately formats boundaries: `0 -> "0 B"`, `500 -> "500 B"`, `1024 -> "1 KB"`, `1024*1024 -> "1 MB"`, `9.9 MB -> "9.9 MB"`, `10 MB -> "10 MB"`, `10.1 MB -> "10.1 MB"`.

4. **Document Deletion & Lifecycle Invalidation**:
   - Tested through FastAPI backend test client in `T5-LIF-01`: Uploaded valid document receives 200 OK with UUID4 `id`. Active retrieval via `/api/pdf/{id}`, `/api/pdf/{id}/download`, and `/api/pdf/{id}/metadata` returns 200 OK.
   - Calling `DELETE /api/pdf/{id}` removes the document via `repositories.remove_pdf_upload(id)` and returns `{"status": "deleted", "id": id}` with HTTP 200.
   - Verified lifecycle invalidation: Subsequent `GET /api/pdf/{id}`, `GET /api/pdf/{id}/file`, `GET /api/pdf/{id}/download`, and `GET /api/pdf/{id}/metadata` all return 404 Not Found.
   - Repeated `DELETE /api/pdf/{id}` on an already-deleted document returns 404 Not Found.
   - Path traversal attempts (`/api/pdf/../../../etc/passwd`) and malformed IDs (`not-a-uuid`, `12345`, SQL injections) are rejected with HTTP 400 or 404 and never leak files or trigger 500 errors.
   - Frontend state teardown in `frontend/src/pages/Projects/PdfQrPage.vue:408-450` clears `uploadedDoc`, canvases, progress, and inputs upon deletion.

---

## 3. Caveats
- Browser-specific DragEvent and Clipboard APIs were verified via Node mock structures and unit contracts rather than automated real-device mobile browser touches.
- Rate limiting window relies on client IP headers (`X-Forwarded-For`), which is standard behind reverse proxies.

---

## 4. Conclusion
Milestone 3 passes all empirical challenger tests with zero failures. Upload validation strictly enforces 10 MB ceiling limits, non-empty files, PDF MIME/extension, and `%PDF-` binary magic bytes. Deletion completely purges the document and invalidates all associated retrieval routes with HTTP 404.

Gate Verdict: **APPROVE**.

---

## 5. Verification Method
To independently execute and verify the test results:
```bash
# 1. Challenger automated validation and lifecycle test suite (37 tests)
node --test frontend/scripts/test-challenger-m3-validation.mjs

# 2. QR unit test suite (27 tests)
node --test frontend/scripts/test-pdf-qr.mjs

# 3. E2E test suite (58 tests)
node --test frontend/scripts/test-e2e-suite.mjs

# 4. Viewer stress test suite (18 tests)
node --test frontend/scripts/test-pdf-viewer-stress.mjs

# 5. Backend upload & deletion pytest suite (22 tests)
python -m pytest backend/tests/test_pdf_upload.py

# 6. Frontend production build
pnpm --dir frontend run build
```
All commands must exit with status code 0.
