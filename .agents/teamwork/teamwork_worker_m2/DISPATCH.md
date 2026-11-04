## 2026-11-04T12:29:01Z
You are the Milestone 2 Implementation Worker for the PDF to QR Code Generator project.

Working directory: c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_worker_m2
Your caller / orchestrator: f95d3a59-3a8c-4581-9f3a-23cc3972df45

MANDATORY FIRST STEP:
Read c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\ORIGINAL_REQUEST.md. It contains the authoritative user requirements.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context and Blueprints:
You have detailed architectural blueprints and complete production templates prepared by the M2 Explorers. Read them before writing code:
1. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\PROJECT.md (Interface contracts and code layout)
2. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m2_1\analysis.md and handoff.md (Landing page architecture, state management, and complete Vue 3 template)
3. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m2_2\analysis.md and handoff.md (High-DPI PDF canvas viewer, pdfjs-dist worker pattern, render cancellation, responsive zoom)
4. c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_explorer_m2_3\analysis.md and handoff.md (Router configuration, /v redirect, 404 status card styling, and create-spa-route-pages.mjs)

Scope Boundaries & Exclusive File Ownership:
You own and may ONLY edit or create these files:
- frontend/src/pages/PdfLandingPage.vue
- frontend/src/router/index.js
- frontend/scripts/create-spa-route-pages.mjs

Do NOT edit any other frontend or backend files.

Implementation Tasks:
1. Create frontend/src/pages/PdfLandingPage.vue:
   - Handle 4 reactive states: loading, ready, not_found, error.
   - Initial check: Validate UUIDv4 format on client. Fetch metadata from GET ${getApiBaseUrl()}/api/pdf/${route.params.id}/metadata.
   - If 404 or invalid UUID: render a styled 404 card matching NotFoundPage.vue (white card, border var(--portfolio-border-color), Space Grotesk gradient 404, pulsing radar circles with mdi-file-pdf-box icon, explanation that file is missing or expired, and buttons: "Generate Your Own QR" linking to /projects/pdf-image-studio?mode=pdf-to-qr and "Return Home" linking to /).
   - If ready:
     - Document header with filename, human-readable size, expiration chip.
     - High-visibility primary Download button: href="${getApiBaseUrl()}/api/pdf/${route.params.id}/download" download attribute, mdi-download icon.
     - Secondary actions: Copy Public Link (with tooltip / snackbar feedback) and Open in New Tab (${getApiBaseUrl()}/api/pdf/${route.params.id}).
     - PDF Canvas viewer:
       - Load pdfjs-dist dynamically with Web Worker:
         Promise.all([import("pdfjs-dist/build/pdf"), import("pdfjs-dist/build/pdf.worker.mjs?url")]).then(([pdfjsLib, workerModule]) => { pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default; return pdfjsLib; })
       - Fetch binary arrayBuffer from GET ${getApiBaseUrl()}/api/pdf/${route.params.id} and load document with Uint8Array.
       - High-DPI crisp rendering: calculate scale, multiply viewport scale by window.devicePixelRatio, set canvas.width/height to physical pixels, set canvas.style.width/height to CSS logical pixels.
       - Cancellation safety: if activeRenderTask exists, call .cancel() and catch RenderingCancelledException before rendering the next page or zoom level.
       - Zoom levels: "Fit Width", "100%", "150%". Add .pdf-canvas { max-width: none !important; } in an overflow-x: auto container.
       - Pagination: Previous, Next, page indicator, page number input or buttons.
       - ResizeObserver on viewer container to auto-resize when in "Fit Width" mode.
       - Fallback card if PDF.js fails to render: show friendly message with direct download link.
2. Update frontend/src/router/index.js:
   - Add route /v/:id pointing to () => import("@/pages/PdfLandingPage.vue"), props: true, meta: { title: "LakshSolanki | View PDF" }.
   - Add route /v redirecting to /projects/pdf-image-studio?mode=pdf-to-qr.
   - Ensure these are added before /notfound and the /:pathMatch(.*)* catch-all route.
3. Update frontend/scripts/create-spa-route-pages.mjs:
   - Add "/v" to the spaRoutes array.
   - Add creation of dist/404.html (writing indexHtml to dist/404.html) to support static SPA hosting fallback.
4. Build and Verify:
   - Run `pnpm run build` in frontend directory. Ensure Vite builds cleanly with 0 errors and chunks are emitted.
   - Run `node --test frontend/scripts/test-pdf-qr.mjs` and `node --test frontend/scripts/test-e2e-suite.mjs`.
   - Update your progress.md throughout your work.
   - Write your handoff report to c:\Users\laksh\Documents\GitHub\LakshSolanki\.agents\teamwork\teamwork_worker_m2\handoff.md with all build and test outputs.
   - Notify me via send_message when complete.
