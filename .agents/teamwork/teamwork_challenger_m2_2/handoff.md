# Handoff Report — Challenger 2 (Milestone 2: Public Landing Page & Viewer)

**Verdict**: **CHALLENGE** (Medium-Risk Concurrency Vulnerability in PDF Viewer Canvas Rendering)

---

## 1. Observation

### 1.1 Direct Source Code Observations (`frontend/src/pages/PdfLandingPage.vue`)

- **Lines 660–732 (`renderPage`)**:
  ```javascript
  const renderPage = async (pageNumber) => {
    if (!pdfDocInstance || !pdfCanvasRef.value) return;

    // Cancellation safety: if activeRenderTask exists, call .cancel()
    if (activeRenderTask) {
      try {
        activeRenderTask.cancel();
      } catch (_e) {
        // Ignore cancellation exception
      }
      activeRenderTask = null;
    }

    isRenderingPage.value = true;
    canvasError.value = false;

    try {
      const page = await pdfDocInstance.getPage(pageNumber); // [OBS-01: Async window before activeRenderTask is defined]
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      ...
      const renderTask = page.render({
        canvasContext: context,
        viewport: renderViewport,
      });
      activeRenderTask = renderTask; // [OBS-02: activeRenderTask only assigned AFTER getPage resolves]

      await renderTask.promise;
      activeRenderTask = null;
    } catch (err) {
      if (err?.name === "RenderingCancelledException") {
        // Rapid navigation or resize cancelation; safely ignore
        return;
      }
      console.error("PDF canvas render failure:", err);
      canvasError.value = true; // [OBS-03: Unexpected canvas errors set canvasError = true]
    } finally {
      isRenderingPage.value = false;
    }
  };
  ```

- **Lines 792–805 (`handleKeydown`)**:
  ```javascript
  const handleKeydown = (e) => {
    if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
    if (e.key === "ArrowLeft" || e.key === "PageUp") {
      if (currentPage.value > 1) {
        e.preventDefault();
        prevPage();
      }
    } else if (e.key === "ArrowRight" || e.key === "PageDown") {
      if (currentPage.value < totalPages.value) {
        e.preventDefault();
        nextPage();
      }
    }
  };
  ```
  `handleKeydown` does not inspect `isRenderingPage.value`. Rapid keyboard strokes or holding down ArrowRight bypass the button `:disabled="isRenderingPage"` protection.

- **Lines 1040–1049 (`<style scoped>`)**:
  ```css
  .pdf-canvas {
    max-width: none !important;
    display: block;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  ```
  `.pdf-canvas` has `max-width: none !important;` directly specified, preventing horizontal compression under global responsive rules.

- **Lines 1024–1033 (`.canvas-viewport`)**:
  ```css
  .canvas-viewport {
    position: relative;
    background: var(--portfolio-surface-soft, #faf3f0);
    border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.12));
    min-height: 420px;
    overflow: auto;
    overflow-x: auto;
    touch-action: pan-y pinch-zoom;
    -webkit-overflow-scrolling: touch;
  }
  ```
  `.canvas-viewport` specifies `overflow-x: auto;`.

### 1.2 Tool Commands and Verbatim Output

1. **Frontend Production Build**:
   - Command: `pnpm --dir frontend run build`
   - Exit Code: `0`
   - Result: `✓ built in 5.17s`, bundled `pdf.worker-B1D2UnXD.mjs` (2,161.14 kB) and `PdfLandingPage-BZKX_MUh.js` (16.08 kB).

2. **Automated QR & WCAG Contrast Test Suite**:
   - Command: `node --test frontend/scripts/test-pdf-qr.mjs`
   - Exit Code: `0`
   - Result: `27 passed, 0 failed, 5 suites`.

3. **End-to-End Test Suite**:
   - Command: `node --test frontend/scripts/test-e2e-suite.mjs`
   - Exit Code: `0`
   - Result: `58 passed, 0 failed, 4 suites`.

4. **Empirical PDF Viewer Stress Test Suite**:
   - Command: `node --test frontend/scripts/test-pdf-viewer-stress.mjs`
   - Exit Code: `0`
   - Result: `18 passed, 0 failed, 4 suites`.

5. **Empirical Reproduction of Concurrency Collision Bug**:
   - Command executed:
     ```bash
     node -e "
     import('./frontend/node_modules/pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjs) => {
       const { synthesizeValidPdf } = await import('./frontend/scripts/test-e2e-suite.mjs');
       const pdfBytes = synthesizeValidPdf(5, { title: 'Async Gap Repro' });
       const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes) }).promise;
       ...
       renderPage(1);
       renderPage(2);
     });
     "
     ```
   - Verbatim Output:
     ```
     REPRODUCED FAILURE on page 2 : Cannot use the same canvas during multiple render() operations. Use different canvas or ensure previous operations were cancelled or completed.
     ```

---

## 2. Logic Chain

1. **Premise 1 (Async Window)**: In `PdfLandingPage.vue`, line 677, `const page = await pdfDocInstance.getPage(pageNumber)` is an asynchronous operation. `activeRenderTask` is only instantiated and assigned on line 718 (`activeRenderTask = renderTask`) after `getPage` resolves.
2. **Premise 2 (Uncancelled Concurrent Execution)**: If a second call to `renderPage(2)` occurs before the `getPage(1)` promise settles (e.g., via keyboard navigation `handleKeydown` which lacks an `isRenderingPage` check, or programmatic page changes):
   - At the start of `renderPage(2)`, `activeRenderTask` is still `null`.
   - `renderPage(2)`'s cancellation block does nothing.
   - Both `renderPage(1)` and `renderPage(2)` proceed to invoke `page.render({ canvasContext, viewport })` on the identical HTML `<canvas>` DOM element concurrently.
3. **Premise 3 (PDF.js Canvas Mutex Invariant)**: PDF.js (`InternalRenderTask.initializeGraphics`) enforces single-owner exclusive access to canvas contexts. When two render tasks overlap on the same canvas, PDF.js throws:
   `Error: Cannot use the same canvas during multiple render() operations.`
4. **Premise 4 (Failure Cascade into Fallback Mode)**: In `renderPage`, lines 722–728:
   The catch block only checks `if (err?.name === "RenderingCancelledException") return;`. The collision error has `err.name === "Error"`, not `"RenderingCancelledException"`.
   Consequently, the catch block logs `PDF canvas render failure` and sets `canvasError.value = true`.
5. **Premise 5 (User Impact)**: Setting `canvasError.value = true` causes `v-show="!canvasError"` to hide the canvas permanently and displays the fallback card ("Unable to display preview. Your browser could not render the canvas preview.") until manual user retry or page reload.
6. **Premise 6 (Empirical Verification of Mitigation)**: In `test-pdf-viewer-stress.mjs` (test `T2-CNC-02B`), implementing a sequence counter (`renderId = ++currentRenderId`) guarantees that any stale `getPage()` resolution whose `renderId !== currentRenderId` immediately returns before calling `page.render()`. Rapid invocations of 5 sequential renders completed cleanly with `canvasError === false` and rendered the final target page without error.

---

## 3. Caveats

1. **Button Disabling**: In the visual GUI toolbar, the Previous Page, Next Page, and Zoom buttons correctly bind `:disabled="isRenderingPage"`, which reduces the likelihood of mouse-triggered collisions. However, keyboard navigation (`handleKeydown`) and rapid input field commits bypass this disable state.
2. **Web Worker Performance**: On high-speed desktop CPUs, `pdfDocInstance.getPage()` resolves in < 5ms for simple synthesized documents. On mobile devices with larger PDFs (e.g. 5–10MB with embedded fonts and images), `getPage()` takes 50–200ms, substantially widening the collision vulnerability window.
3. **No Implementation Code Modified**: In strict compliance with the Challenger role constraints ("Review-only — do NOT modify implementation code"), no changes were made to `PdfLandingPage.vue`. The mitigation was verified using isolated test harnesses.

---

## 4. Conclusion

**Verdict: CHALLENGE**

While the PDF Viewer successfully implements:
1. High-DPI physical-to-CSS scaling (1x, 1.5x, 2x, 3x DPR).
2. Proper CSS layout isolation (`.pdf-canvas { max-width: none !important; }` and `.canvas-viewport { overflow-x: auto; }`).
3. Resilient fallback card presentation on corrupt binaries or canvas context loss.

There is a **Medium-Risk Concurrency Vulnerability** in `renderPage()`:
- **Flaw**: Concurrent asynchronous `renderPage()` calls during the in-flight `getPage()` window bypass cancellation and cause PDF.js to crash with `Cannot use the same canvas during multiple render() operations`, incorrectly tripping `canvasError = true`.
- **Recommendation for Worker**:
  1. Add a generation/sequence counter to `PdfLandingPage.vue`:
     ```javascript
     let currentRenderId = 0;
     const renderPage = async (pageNumber) => {
       const renderId = ++currentRenderId;
       ...
       const page = await pdfDocInstance.getPage(pageNumber);
       if (renderId !== currentRenderId) return; // Stale request superseded
       ...
     ```
  2. Guard `handleKeydown`:
     ```javascript
     if (isRenderingPage.value) return;
     ```
  3. Expand the catch ignore condition in `renderPage`:
     ```javascript
     if (
       err?.name === "RenderingCancelledException" ||
       err?.message?.includes("Cannot use the same canvas during multiple render() operations")
     ) {
       return;
     }
     ```

---

## 5. Verification Method

To independently verify all findings and reproduce the exact behavior:

```bash
# 1. Verify standard build
pnpm --dir frontend run build

# 2. Run existing unit & QR tests
node --test frontend/scripts/test-pdf-qr.mjs

# 3. Run full E2E test suite (58 tests)
node --test frontend/scripts/test-e2e-suite.mjs

# 4. Run PDF viewer empirical stress harness (18 tests verifying High-DPI, Cancellation, CSS, and Fallback)
node --test frontend/scripts/test-pdf-viewer-stress.mjs

# 5. Reproduce the unsequenced canvas collision bug verbatim
node -e "
import('./frontend/node_modules/pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjs) => {
  const { synthesizeValidPdf } = await import('./frontend/scripts/test-e2e-suite.mjs');
  const pdfBytes = synthesizeValidPdf(5, { title: 'Async Gap Repro' });
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes) }).promise;
  const mockCanvas = { getContext: () => mockContext, width: 612, height: 792, style: {} };
  const mockContext = new Proxy({ canvas: mockCanvas }, {
    get: (t, p) => (p === 'canvas' ? mockCanvas : p === 'getTransform' ? () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) : () => {})
  });
  let activeRenderTask = null;
  async function render(p) {
    if (activeRenderTask) { try { activeRenderTask.cancel(); } catch(e){} activeRenderTask = null; }
    try {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1.0 });
      const t = page.render({ canvasContext: mockContext, viewport: vp });
      activeRenderTask = t;
      await t.promise;
    } catch (e) {
      console.error('VERIFIED BUG:', e.message);
    }
  }
  render(1);
  render(2);
});
"
```
