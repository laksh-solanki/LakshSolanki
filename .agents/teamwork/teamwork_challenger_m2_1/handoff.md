# Milestone 2 Adversarial Challenge Report: Public Landing Page & Viewer

**Date:** 2026-11-04  
**Agent:** `teamwork_challenger_m2_1` (Challenger 1, Empirical Challenger)  
**Milestone:** Milestone 2 (Public Landing Page & Viewer)  
**Parent Agent:** `f95d3a59-3a8c-4581-9f3a-23cc3972df45`  
**Handoff Type:** Hard (Task Complete)  
**Verdict:** **APPROVE** (0 blocking defects, high empirical resilience)

---

## Challenge Summary

**Overall risk assessment**: **LOW**

The Milestone 2 implementation (`frontend/src/pages/PdfLandingPage.vue`, `frontend/src/router/index.js`, and `frontend/scripts/create-spa-route-pages.mjs`) was empirically stress-tested using custom-crafted adversarial test generators, path traversal payloads, SQL injection strings, command injections, XSS payloads, malformed UUIDs, network disconnection/500 harnesses, and Vue Router navigation simulations. The client-side defense in depth completely prevents invalid network traffic, gracefully renders thematic error/not-found states, cleanly redirects `/v` and `/v/`, and supports static host SPA fallback via `dist/404.html`.

---

## 1. Observation

### 1.1 Files Directly Inspected
1. **`frontend/src/pages/PdfLandingPage.vue`**:
   - Line 477: Client-side validation regex:
     ```javascript
     const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
     ```
   - Lines 584–593: Early rejection before network fetch:
     ```javascript
     const initDocument = async () => {
       const id = documentId.value;
       if (!id || !UUID_REGEX.test(id)) {
         viewState.value = "not_found";
         document.title = "LakshSolanki | Document Not Found";
         return;
       }
     ```
   - Lines 603–606 & 619–623: Handling of 404/410 status codes to transition to `not_found`.
   - Lines 649–657: Robust `catch (err)` block converting 500, network disconnects, timeouts, or corrupted byte errors into `viewState = "error"` with `canRetry = true`.
   - Lines 664–671 & 722–726: `activeRenderTask.cancel()` and `RenderingCancelledException` handling for smooth, non-crashing rapid pagination and window resizing.
   - Lines 694–712: High-DPI canvas density multiplier using `window.devicePixelRatio`.
   - Line 1042: CSS rule `.pdf-canvas { max-width: none !important; }` inside `overflow-x: auto` viewport container to eliminate aspect ratio distortion during zoom.

2. **`frontend/src/router/index.js`**:
   - Lines 94–105:
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
   - Registered directly before `/notfound` (line 106) and `/:pathMatch(.*)*` (line 112).

3. **`frontend/scripts/create-spa-route-pages.mjs`**:
   - Line 24: Added `"/v"` to `spaRoutes`.
   - Line 42: Writes static `dist/404.html` containing root `indexHtml`.

4. **`frontend/dist/404.html` & `frontend/dist/v/index.html`**:
   - Both files exist in build output.
   - Script and stylesheet tags use absolute root paths (e.g. `src="/assets/index-CSafB1OL.js"`), ensuring static hosts load bundle assets correctly even from nested subpaths like `/v/:id`.

---

### 1.2 Tool Commands & Verbatim Execution Outputs

#### Command 1: Adversarial Challenger Suite (`node --test frontend/scripts/test-challenger-m2.mjs`)
```text
▶ Adversarial Challenge Suite 1: Malformed UUIDs, Traversal & Injections
  ✔ ADV-ID: safely rejects Unix Path Traversal without network call (2.1975ms)
  ✔ ADV-ID: safely rejects Deep Path Traversal without network call (0.6558ms)
  ✔ ADV-ID: safely rejects Windows Path Traversal without network call (0.292ms)
  ✔ ADV-ID: safely rejects URL-Encoded Traversal without network call (0.2543ms)
  ✔ ADV-ID: safely rejects Double URL-Encoded Traversal without network call (0.2079ms)
  ✔ ADV-ID: safely rejects SQL Injection Simple Quote without network call (0.2631ms)
  ✔ ADV-ID: safely rejects SQL Injection Comment without network call (0.2591ms)
  ✔ ADV-ID: safely rejects SQL Injection Batched Query without network call (0.239ms)
  ✔ ADV-ID: safely rejects SQL Injection UNION SELECT without network call (0.4007ms)
  ✔ ADV-ID: safely rejects XSS Script Tag without network call (0.4177ms)
  ✔ ADV-ID: safely rejects XSS Image Tag without network call (0.3676ms)
  ✔ ADV-ID: safely rejects XSS SVG Tag without network call (0.5205ms)
  ✔ ADV-ID: safely rejects Null Byte Injection without network call (0.1435ms)
  ✔ ADV-ID: safely rejects URL Encoded Null Byte without network call (0.1041ms)
  ✔ ADV-ID: safely rejects CRLF Injection without network call (0.135ms)
  ✔ ADV-ID: safely rejects Command Injection Semicolon without network call (0.1337ms)
  ✔ ADV-ID: safely rejects Command Injection Pipe without network call (0.0928ms)
  ✔ ADV-ID: safely rejects Empty String without network call (0.2006ms)
  ✔ ADV-ID: safely rejects Single Space without network call (0.1444ms)
  ✔ ADV-ID: safely rejects Multiple Whitespaces without network call (0.178ms)
  ✔ ADV-ID: safely rejects Undefined (null) without network call (0.1169ms)
  ✔ ADV-ID: safely rejects Undefined value without network call (0.1074ms)
  ✔ ADV-ID: safely rejects Pure Numeric ID without network call (0.138ms)
  ✔ ADV-ID: safely rejects Arbitrary Text without network call (0.0966ms)
  ✔ ADV-ID: safely rejects Nil UUID (version 0, variant 0) without network call (0.0744ms)
  ✔ ADV-ID: safely rejects Max Hex UUID (version f, variant f) without network call (0.0746ms)
  ✔ ADV-ID: safely rejects Invalid Hex Character (g) without network call (0.0949ms)
  ✔ ADV-ID: safely rejects Invalid Hex Character (z) without network call (0.071ms)
  ✔ ADV-ID: safely rejects Missing Hyphens without network call (0.0946ms)
  ✔ ADV-ID: safely rejects Too Short (35 chars) without network call (0.0986ms)
  ✔ ADV-ID: safely rejects Too Long (37 chars) without network call (0.1468ms)
  ✔ ADV-ID: safely rejects Invalid Variant Nibble (7) without network call (0.0773ms)
  ✔ ADV-ID: safely rejects Invalid Variant Nibble (c) without network call (1.4521ms)
  ✔ ADV-ID: safely rejects Invalid Version Nibble (0) without network call (0.097ms)
  ✔ ADV-ID: safely rejects Invalid Version Nibble (6) without network call (0.1188ms)
  ✔ ADV-ID: accepts valid UUIDv4 lowercase (1.515ms)
  ✔ ADV-ID: accepts valid UUIDv4 uppercase (0.1855ms)
  ✔ ADV-ID: accepts valid UUIDv4 mixed-case with leading/trailing spaces (auto-trimmed) (0.1314ms)
✔ Adversarial Challenge Suite 1: Malformed UUIDs, Traversal & Injections (16.2646ms)
▶ Adversarial Challenge Suite 2: Router Paths, Redirects & SPA Fallback
  ✔ ADV-ROU-01: verifies router file has /v/:id and /v defined before notfound fallback (31.1709ms)
  ✔ ADV-ROU-02: verifies /v route redirects to /projects/pdf-image-studio?mode=pdf-to-qr (2.8309ms)
  ✔ ADV-ROU-03: verifies static SPA route generator script includes /v and creates 404.html (8.5044ms)
  ✔ ADV-SPA-01: verifies dist/404.html exists in build artifact (1.5815ms)
  ✔ ADV-SPA-02: verifies dist/v/index.html exists in build artifact (0.7852ms)
  ✔ ADV-SPA-03: verifies dist/404.html uses root-absolute asset URLs (/assets/...) for deep routes (1.3379ms)
  ✔ ADV-SPA-04: verifies dist/404.html is bit-for-bit identical to dist/index.html (2.3991ms)
  ✔ ADV-ROU-04: resolves /v by redirecting to /projects/pdf-image-studio?mode=pdf-to-qr (8.8203ms)
  ✔ ADV-ROU-05: resolves /v/ by redirecting to /projects/pdf-image-studio?mode=pdf-to-qr (2.2647ms)
  ✔ ADV-ROU-06: resolves valid /v/:id to PdfLanding route with param id (0.6492ms)
  ✔ ADV-ROU-07: resolves arbitrary string /v/malicious-payload to PdfLanding route with param id (0.3697ms)
  ✔ ADV-ROU-08: multi-segment traversal /v/test/extra resolves to /notfound via catch-all (0.7017ms)
  ✔ ADV-ROU-09: random unknown route /random-nonexistent-url redirects to /notfound (0.4248ms)
✔ Adversarial Challenge Suite 2: Router Paths, Redirects & SPA Fallback (63.3985ms)
▶ Adversarial Challenge Suite 3: Network Failures, 500s & Disconnects
  ✔ ADV-NET-01: gracefully enters not_found state when metadata API returns 404 Not Found (0.202ms)
  ✔ ADV-NET-02: gracefully enters not_found state when metadata API returns 410 Gone (expired) (0.0832ms)
  ✔ ADV-NET-03: gracefully enters error state when metadata API returns 500 Internal Server Error (0.127ms)
  ✔ ADV-NET-04: gracefully enters error state when metadata API returns 502 Bad Gateway (0.1007ms)
  ✔ ADV-NET-05: gracefully enters error state when metadata API returns 503 Service Unavailable (0.0848ms)
  ✔ ADV-NET-06: gracefully handles complete network disconnection (ECONNREFUSED / Failed to fetch) (0.0952ms)
  ✔ ADV-NET-07: gracefully handles network timeout exception (0.0848ms)
  ✔ ADV-NET-08: handles race condition where metadata returns 200 but binary returns 404 (deleted mid-load) (0.1008ms)
  ✔ ADV-NET-09: handles binary stream returning 500 error after metadata succeeded (0.0992ms)
  ✔ ADV-NET-10: handles corrupted/damaged binary stream returning invalid PDF bytes (0.1739ms)
✔ Adversarial Challenge Suite 3: Network Failures, 500s & Disconnects (1.4786ms)
▶ Adversarial Challenge Suite 4: Real HTTP Mock Server Integration
  ✔ ADV-SRV-01: live HTTP GET receives 500 and throws descriptive error (44.6151ms)
  ✔ ADV-SRV-02: live HTTP GET receives 404 for missing/expired document (8.7907ms)
  ✔ ADV-SRV-03: live HTTP GET receives valid metadata and PDF stream (14.943ms)
✔ Adversarial Challenge Suite 4: Real HTTP Mock Server Integration (96.5458ms)
▶ Adversarial Challenge Suite 5: Utility & Boundary Stress Testing
  ✔ ADV-UTL-01: formatFileSize stress test across edge boundaries (1.4664ms)
  ✔ ADV-UTL-02: formatDate stress test with edge inputs (33.1244ms)
  ✔ ADV-UTL-03: getExpiryTimeFormatted stress test (0.5586ms)
  ✔ ADV-UTL-04: calculateTargetPage pagination clamping (0.1786ms)
  ✔ ADV-UTL-05: calculateZoomScale zoom step clamping (0.1949ms)
✔ Adversarial Challenge Suite 5: Utility & Boundary Stress Testing (36.028ms)
ℹ tests 69
ℹ suites 5
ℹ pass 69
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 710.3359
Exit code: 0
```

#### Command 2: Production Build (`pnpm --dir frontend run build`)
```text
$ vite build && node scripts/create-spa-route-pages.mjs
vite v8.0.16 building client environment for production...
transforming...✓ 918 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                 2.47 kB │ gzip:   0.84 kB
dist/assets/pdf.worker-B1D2UnXD.mjs                         2,161.14 kB
dist/assets/PdfLandingPage-UFt7QB2k.css                         4.83 kB │ gzip:   1.40 kB
dist/assets/PdfLandingPage-BZKX_MUh.js                         16.08 kB │ gzip:   5.49 kB
dist/assets/pdf-tools-CTWITlYH.js                             828.85 kB │ gzip: 260.27 kB
dist/assets/vendor-B9VK_CZx.js                              1,228.31 kB │ gzip: 381.59 kB
✓ built in 5.26s
Created static entry pages for 16 SPA routes.
Created static 404.html fallback for dynamic routes.
Exit code: 0
```

#### Command 3: QR Unit Tests (`node --test frontend/scripts/test-pdf-qr.mjs`)
```text
ℹ tests 27
ℹ suites 5
ℹ pass 27
ℹ fail 0
ℹ duration_ms 191.9792
Exit code: 0
```

#### Command 4: Full E2E Test Suite (`node --test frontend/scripts/test-e2e-suite.mjs`)
```text
ℹ tests 58
ℹ suites 4
ℹ pass 58
ℹ fail 0
ℹ duration_ms 1481.71
Exit code: 0
```

#### Command 5: Backend Test Suite (`python -m pytest backend/tests/test_pdf_upload.py`)
```text
collected 22 items
backend\tests\test_pdf_upload.py ......................                  [100%]
======================== 22 passed, 1 warning in 5.81s ========================
Exit code: 0
```

---

## 2. Logic Chain

1. **Defense-in-Depth Against Malformed & Malicious IDs (Obs 1.1, Obs 1.2 Command 1 Suite 1)**:
   - When any request navigates to `/v/:id`, `PdfLandingPage.vue` validates `documentId` against `UUID_REGEX` prior to dispatching any network request.
   - Tested 35 distinct adversarial variations (Unix directory traversal, Windows directory traversal, URL-encoded traversal, SQLi quotes, comments, union select, script tags, image onerror, SVG execution, null bytes, command injection, non-hex characters, incorrect versions/variants, and nil UUIDs).
   - In 100% of cases, the component intercepts the malformed input on the client side, sets `viewState = "not_found"`, and terminates early without triggering `fetch()`. The network remains protected against client-side exploitation.

2. **Routing and Static Fallback Cohesion (Obs 1.1, Obs 1.2 Command 1 Suite 2)**:
   - Vue router rules evaluate in strict order. Placed prior to `/:pathMatch(.*)*`, `/v/:id` and `/v` capture all intended requests.
   - Empirical router testing verified `/v` and `/v/` redirect to `/projects/pdf-image-studio?mode=pdf-to-qr`.
   - On static hosting (e.g., GitHub Pages), direct navigation to `/v/<uuid>` yields HTTP 404 from the web server. The host delivers `dist/404.html`. Because `dist/404.html` contains the exact SPA loader with root-absolute asset URLs (`/assets/...`), the bundle loads and Vue Router handles the deep URL smoothly.

3. **Resilience Under Network Degradation and Server Crashes (Obs 1.1, Obs 1.2 Command 1 Suites 3 & 4)**:
   - If the backend returns HTTP 404 or 410, the UI renders the styled `not_found` view with radar animation and navigation chips.
   - If the backend returns HTTP 500, 502, 503, fails to connect (`ECONNREFUSED`), times out, or streams corrupted binary bytes, the component transitions to `viewState = "error"`.
   - The error state presents an informative message and a functional "Retry" button that re-triggers `initDocument()`.

4. **Viewer Stability and Rendering Safety (Obs 1.1, Obs 1.2 Command 1 Suite 5)**:
   - High-DPI canvas buffer dimensioning prevents blurry rendering on Retina/mobile screens.
   - Render task cancellation safety prevents concurrent render conflicts in PDF.js when users rapidly click next/previous or resize their browser.
   - Explicit CSS constraint `.pdf-canvas { max-width: none !important; }` prevents canvas distortion under zoom.
   - Boundary tests confirm `formatFileSize`, `formatDate`, `calculateTargetPage`, and `calculateZoomScale` handle null, negative, NaN, and extreme values safely.

---

## 3. Caveats

- **UUID Version Scope**: The client regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` accepts UUID versions 1 through 5. The backend specifically generates standard RFC 4122 UUIDv4 (version 4). This compatibility was verified as safe and intentional.
- **Extreme File Size Formatting**: For theoretical file sizes exceeding 1 TB (well beyond the 10 MB upload ceiling), `formatFileSize` clamps to the maximum GB tier without crashing.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 2 fulfills all requirements from `ORIGINAL_REQUEST.md` (R1, R4, R5) and satisfies all security, routing, and stability criteria:
- Malformed inputs are rejected before network transmission.
- Route redirections and static SPA fallback work reliably.
- Network and server failures degrade gracefully with clear error recovery.
- All test suites (69 adversarial tests, 27 QR tests, 58 E2E tests, 22 backend tests) pass 100%.

---

## 5. Verification Method

To independently verify all findings and stress tests:

1. **Run Adversarial Challenger Test Suite**:
   ```powershell
   node --test frontend/scripts/test-challenger-m2.mjs
   ```
   *Expected output*: 69 passed tests across 5 suites (0 failures).

2. **Run QR Scannability & Contrast Test Suite**:
   ```powershell
   node --test frontend/scripts/test-pdf-qr.mjs
   ```
   *Expected output*: 27 passed tests (0 failures).

3. **Run Full 4-Tier E2E Test Suite**:
   ```powershell
   node --test frontend/scripts/test-e2e-suite.mjs
   ```
   *Expected output*: 58 passed tests (0 failures).

4. **Run Backend Test Suite**:
   ```powershell
   python -m pytest backend/tests/test_pdf_upload.py
   ```
   *Expected output*: 22 passed tests.

5. **Run Production Build Verification**:
   ```powershell
   pnpm --dir frontend run build
   ```
   *Expected output*: `✓ built in ~5s`, `Created static entry pages for 16 SPA routes`, `Created static 404.html fallback for dynamic routes`.
