# Reviewer 2 Handoff Report: Milestone 3 (Studio UI & QR Customizer)

## Gate Verdict: APPROVE

---

## 1. Observation

Direct code and execution observations:
- **`frontend/src/pages/Projects/PdfImageStudio.vue`**:
  - `VALID_MODES` array registered at line 11: `["img-to-pdf", "pdf-to-img", "pdf-to-qr"]`.
  - Mode resolution helper `resolveValidMode(mode)` (line 12-13) safely sanitizes arbitrary or malformed query values, falling back to `"img-to-pdf"`.
  - Route watcher at line 17-24 listens for URL query parameter updates and keeps `activeTab` synchronized.
  - Component mapping table `MODE_COMPONENTS` at lines 41-45 maps `"pdf-to-qr"` to `PdfQrPage.vue`.
  - Lines 55-57 wrap the dynamic component in `<keep-alive><component :is="currentComponent" /></keep-alive>`, successfully preserving in-memory state, canvases, and upload forms across mode switches.
- **`frontend/src/pages/Projects/ImgPdfPage.vue` & `frontend/src/pages/Projects/PdfImgPage.vue`**:
  - Both components feature a consistent 3-button mode switcher in the sidebar navigation container.
  - Button for `"pdf-to-qr"` utilizes icon `mdi-qrcode`, title "PDF to QR", and subtitle "Shareable QR link & preview" (lines 736-749 in `ImgPdfPage.vue`, lines 616-629 in `PdfImgPage.vue`).
  - Active button states (`is-active` class) and click handlers correctly route through `switchTab('pdf-to-qr')` with injected `studioMode` coordination.
  - No broken state, regressions, or unintended regressions in existing Image-to-PDF or PDF-to-Image tools.
- **`frontend/src/plugins/icons.js`**:
  - Lines 102-103 import `mdiQrcode` and `mdiQrcodeScan` from `@mdi/js`.
  - Lines 237-238 register `"mdi-qrcode": mdiQrcode` and `"mdi-qrcode-scan": mdiQrcodeScan` into the exported `iconMap`.
  - This eliminates any risk of Vuetify falling back to `mdi-help-circle-outline`.
- **`frontend/package.json`**:
  - Line 32 specifies `"qrcode": "^1.5.4"` under `dependencies`.
  - Dependency is properly locked and resolves cleanly in the production build bundle (`pdf-tools-DrVi2E_K.js`).
- **Integrity Violation Checks**:
  - Examined `frontend/src/pages/Projects/PdfQrPage.vue` and `frontend/src/utils/qrContrast.js`.
  - No hardcoded test responses, fake UUIDs, facade implementations, or bypassed verification routines were detected.
  - Real XHR multipart uploads, actual `pdfjs-dist` canvas rendering, real `qrcode` canvas/SVG generation, and genuine server-side deletion requests are implemented.
- **Independent Verification Run Results**:
  1. `pnpm --dir frontend run build`: Exited 0 (Completed in 14.70s; bundled 949 modules, created 16 SPA routes and `404.html`).
  2. `node --test frontend/scripts/test-e2e-suite.mjs`: Exited 0 (58 passed, 0 failed, 4 suites).
  3. `node --test frontend/scripts/test-pdf-qr.mjs`: Exited 0 (27 passed, 0 failed, 5 suites).
  4. `node --test frontend/scripts/test-pdf-viewer-stress.mjs`: Exited 0 (18 passed, 0 failed, 4 suites).
  5. `python -m pytest backend/tests/test_pdf_upload.py`: Exited 0 (22 passed, 0 failed in 11.89s).

---

## 2. Logic Chain

1. **Studio Integration & Mode Switching**:
   - `PdfImageStudio.vue` functions as the master orchestrator for the three PDF/image tools. By defining `VALID_MODES = ["img-to-pdf", "pdf-to-img", "pdf-to-qr"]` and mapping each to its respective SFC, mode transitions are strictly typed and deterministic.
   - Using Vue's `<keep-alive>` ensures that when a user uploads a PDF in `pdf-to-qr`, switches to `img-to-pdf` to check existing files, and returns to `pdf-to-qr`, the component state (uploaded file metadata, rendered canvas buffers, QR customizer state) is preserved without re-uploading or re-rendering.
2. **Icon Mapping & Tree-Shaking**:
   - In Vuetify 3/4 with custom SVG icon sets, referencing `<v-icon>mdi-qrcode</v-icon>` searches `iconMap`. Because `@mdi/js` icons are tree-shaken, registering both `mdi-qrcode` and `mdi-qrcode-scan` in `icons.js` guarantees crisp SVG path rendering across all devices.
3. **QR Customization & Scannability Assurance**:
   - The QR engine is locked to Error Correction Level 'H' (30% error recovery).
   - Customizer center logo bounding limits logo diameter to $\le 22\%$ of total QR dimension ($<5\%$ total area).
   - Protective circular background badge ($r = \text{logoSize}/2 + 6$) shields adjacent QR modules from overlapping artifacts.
   - Contrast rating uses WCAG 2.1 relative luminance math ($L = 0.2126R + 0.7152G + 0.0722B$) with a dynamic warning threshold at $< 3.0:1$.
4. **Lifecycle & Clean Teardown**:
   - Calling `DELETE /api/pdf/:id` invalidates the server storage binary and resets local canvas contexts, uploaded document refs, and URL states, preventing stale or orphan links.

---

## 3. Caveats

- **Minor UX Resilience Consideration**: In `PdfQrPage.vue`, `renderQrCode()` is triggered via a watcher on `[qrSettings.fgColor, qrSettings.bgColor, ...]`. When typing hex codes into the manual text field (as opposed to picking from `<input type="color">`), typing incomplete hex characters (e.g., `#12`) causes `QRCode.toCanvas` to reject. While `evaluateQrScannability` catches this cleanly without breaking UI rendering, adding a defensive `.catch(() => {})` inside `renderQrCode()` would suppress console warnings during fast manual typing. This does not block approval.

---

## 4. Conclusion

Milestone 3 meets all functional requirements, security specifications, and design system criteria defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`. The studio integration is seamless, mode switching preserves state, icons resolve accurately, dependencies are sound, and all automated verification suites pass with zero regressions.

**Final Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce this verification:

```bash
# 1. Build frontend bundle and SPA routes
pnpm --dir frontend run build

# 2. Run comprehensive E2E test suite
node --test frontend/scripts/test-e2e-suite.mjs

# 3. Run QR customization & contrast unit test suite
node --test frontend/scripts/test-pdf-qr.mjs

# 4. Run PDF viewer stress tests
node --test frontend/scripts/test-pdf-viewer-stress.mjs

# 5. Run backend pytest suite
python -m pytest backend/tests/test_pdf_upload.py
```

---

## Quality Review Findings

### Review Summary
- **Verdict**: **APPROVE**
- **Integrity Violations**: None found.

### Findings

#### [Minor] Finding 1: Uncaught Promise Rejection during Manual Text Hex Input
- **What**: Manual keystrokes in `<v-text-field v-model="qrSettings.fgColor" />` trigger `renderQrCode()` immediately on each character.
- **Where**: `frontend/src/pages/Projects/PdfQrPage.vue`, lines 312–325 & 370–378.
- **Why**: If a user deletes a hex digit to type a new one, `QRCode.toCanvas` temporarily receives an invalid 5-character string and throws an error to the console.
- **Suggestion**: Wrap `await QRCode.toCanvas(...)` in a `try...catch` block or debounce/validate hex format prior to rendering.

### Verified Claims
- Claim: `PdfImageStudio.vue` registers `pdf-to-qr` in `VALID_MODES` and preserves state via `<keep-alive>`.
  - Method: Inspected source lines 11 & 55–57; tested mode switching. Result: PASS.
- Claim: `ImgPdfPage.vue` and `PdfImgPage.vue` contain `mdi-qrcode` buttons without breaking existing functionality.
  - Method: Inspected source; checked git diff; built bundle. Result: PASS.
- Claim: `mdi-qrcode` and `mdi-qrcode-scan` are registered in `icons.js`.
  - Method: Inspected `icons.js` lines 102-103 & 237-238. Result: PASS.
- Claim: Package `"qrcode": "^1.5.4"` installed and bundles cleanly.
  - Method: Verified `package.json` line 32; verified `pnpm run build` exits 0. Result: PASS.
- Claim: Automated test suites pass 100%.
  - Method: Ran `test-e2e-suite.mjs` (58/58), `test-pdf-qr.mjs` (27/27), `test-pdf-viewer-stress.mjs` (18/18), `test_pdf_upload.py` (22/22). Result: PASS.

---

## Adversarial Challenge Report

### Challenge Summary
- **Overall Risk Assessment**: LOW

### Challenges

#### [Low] Challenge 1: Invalid Route Query Mode Tampering
- **Assumption**: Users navigate only via the UI mode buttons.
- **Attack Scenario**: Attacker or external link targets `/studio/pdf-image?mode=invalid_payload_injection`.
- **Blast Radius**: Potential broken dynamic component rendering or blank page.
- **Mitigation Checked**: `resolveValidMode` explicitly checks `VALID_MODES.includes(mode) ? mode : "img-to-pdf"`, and fallback is enforced. Mitigation verified effective.

#### [Low] Challenge 2: Rapid Mode Switching Memory Leaks under `<keep-alive>`
- **Assumption**: Heavy PDF canvas memory in `PdfQrPage` might exhaust browser RAM when toggling repeatedly between studio tools.
- **Attack Scenario**: User loads multiple heavy files across tools and rapidly switches modes.
- **Blast Radius**: Browser memory pressure.
- **Mitigation Checked**: In `PdfQrPage.vue`, the preview canvas is constrained to 280px width, rendered once per upload, and cleared on deletion. DevicePixelRatio memory scaling remains bounded.
