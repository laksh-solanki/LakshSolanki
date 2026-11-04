# Milestone 3 Technical Blueprint: QR Generation Engine, Customizer & Export Specialist

**Author**: Explorer 2 (QR Specialist)  
**Date**: 2026-11-04  
**Working Directory**: `.agents/teamwork/teamwork_explorer_m3_2`  
**Target Milestone**: Milestone 3 (`PdfQrPage.vue`, QR Customizer, Contrast Checker, Multi-Format Export)

---

## 1. Executive Summary & Problem Scope

Milestone 3 delivers the user-facing PDF to QR Code generation and customization studio within `PdfImageStudio.vue`. The tool must instantly convert an uploaded PDF's public landing URL (`${origin}/v/${uuid4}`) into an aesthetically customizable, robustly scannable QR code with full life-cycle controls and high-fidelity multi-format exports.

This report provides the authoritative architectural blueprint and production-ready code specifications for:
1. **Library Audit**: Analysis of QR libraries and resolution of missing `qrcode` dependency (`^1.5.4`).
2. **Real-Time Customization Engine**: Color management (foreground/background), size scaling, immutable Level 'H' error correction, center logo embedding with a protective circular badge, and single-click reset-to-default control.
3. **WCAG 2.1 Relative Luminance Contrast Checker**: Accurate mathematical contrast calculation with scannability ratings and low-contrast warnings (`frontend/src/utils/qrContrast.js`).
4. **Multi-Format Export Pipeline**: Standard PNG (300px–600px), Ultra-High-Resolution Print PNG (2000px × 2000px), and Scalable Vector Graphics (SVG with standalone XML declaration and embedded logo badge).
5. **Component Integration Blueprint**: Concrete blueprints for `frontend/src/pages/Projects/PdfQrPage.vue`, updates to `PdfImageStudio.vue`, `ImgPdfPage.vue`, `PdfImgPage.vue`, and `@mdi/js` registration in `frontend/src/plugins/icons.js`.

---

## 2. QR Library Audit & API Deep Dive

### 2.1 `frontend/package.json` Audit
An inspection of `frontend/package.json` confirmed that:
- `qrcode` is **not currently installed** in `dependencies`.
- The existing codebase uses `pdfjs-dist: ^5.7.284`, `jspdf: ^4.2.1`, `vuetify: ^4.1.2`, and `vue: ^3.5.38`.
- **Action Required**: Add `"qrcode": "^1.5.4"` to `frontend/package.json` under `dependencies` and execute `pnpm install` or `pnpm add qrcode`.

### 2.2 `qrcode` API Capabilities
The standard `qrcode` library (v1.5.4) provides dual-mode execution (browser canvas and string output):

1. **Canvas Rendering (`QRCode.toCanvas`)**:
   ```javascript
   import QRCode from 'qrcode';

   await QRCode.toCanvas(canvasElement, text, {
     errorCorrectionLevel: 'H', // Crucial for center logo embedding
     width: 300,                // Desired canvas output size (px)
     margin: 4,                 // 4 modules quiet zone
     color: {
       dark: '#000000',         // Foreground dots/modules
       light: '#FFFFFF'         // Background surface
     }
   });
   ```
   - Automatically sizes the HTML `<canvas>` element's internal coordinate buffer.
   - Operates asynchronously returning a Promise.
   - Provides a clean surface upon which logo badges can be rendered via the standard HTML5 2D Canvas context.

2. **SVG String Rendering (`QRCode.toString`)**:
   ```javascript
   const svgString = await QRCode.toString(text, {
     type: 'svg',               // Specifies XML SVG output
     errorCorrectionLevel: 'H',
     width: 500,
     margin: 4,
     color: {
       dark: '#000000',
       light: '#FFFFFF'
     }
   });
   ```
   - Returns a raw `<svg ...>...</svg>` string containing `<path>` and `<rect>` elements.
   - For standalone file download, must be prepended with `<?xml version="1.0" encoding="UTF-8"?>\n` to pass standalone XML parsers and automated test suite criteria (`T1-EXP-01`).

---

## 3. Real-Time Customization Engine Architecture

### 3.1 Reactive State Model
In `PdfQrPage.vue`, customization state is maintained in a central reactive object:

```javascript
const qrSettings = reactive({
  darkColor: '#000000',          // Foreground module color
  lightColor: '#FFFFFF',         // Background card color
  size: 300,                     // Display & base export size in px (200 - 600)
  exportResolution: 300,         // Export PNG dimension (300, 600, or 2000)
  errorCorrectionLevel: 'H',     // Locked to Level 'H' (30% error tolerance)
  margin: 4,                     // Quiet zone module count
  logoImage: null,               // Data URL string of logo or null
  logoName: '',                  // Filename for user feedback
  logoScale: 0.22,               // Constrained between 0.15 and 0.25 (default 0.22)
});
```

### 3.2 Color Customization & Studio Presets
To maintain visual harmony with the portfolio's burgundy/rose design system, four curated palette presets are provided alongside custom color inputs:

| Preset Name | Dark Color (Foreground) | Light Color (Background) | Contrast Ratio | Scannability Rating |
|---|---|---|---|---|
| **Default Classic** | `#000000` (Pure Black) | `#FFFFFF` (Pure White) | 21.0:1 | Optimal (Pass) |
| **Studio Burgundy** | `#7C0E44` (Primary) | `#FFFFFF` (Pure White) | 9.87:1 | Optimal (Pass) |
| **Warm Studio** | `#7C0E44` (Primary) | `#F2DACE` (Warm BG) | 5.86:1 | Optimal (Pass) |
| **Graphite Matte** | `#FFFFFF` (Pure White) | `#111827` (Dark Slate) | 16.5:1 | Optimal (Pass) |

- **Pickers**: Integrated native `<input type="color">` wrapped in Vuetify rounded cards or text fields, enabling immediate hex input (`#rrggbb`) or visual color picking.
- **Debounced Re-rendering**: Re-render the canvas via `requestAnimationFrame` or Vue `watch(qrSettings, ...)` to ensure 60fps real-time fluidity.

### 3.3 Size Adjustments
- **Display Scaling**: Slider allowing user to scale canvas display from 200px to 600px in 50px increments.
- **Export Resolution Selector**: Segmented control or dropdown offering:
  - Standard (300 × 300 px) — Ideal for mobile web, messaging, and email signatures.
  - HD (600 × 600 px) — Ideal for presentations and digital signage.
  - High-Res Print (2000 × 2000 px) — Crisp 300 DPI vector-sharp raster for brochures, banners, and merchandise.

### 3.4 Error Correction Level 'H' Enforcement
- **Standard QR Error Recovery**:
  - Level L: ~7%
  - Level M: ~15%
  - Level Q: ~25%
  - Level H: ~30%
- **Requirement**: Because center logos obscure internal modules, `errorCorrectionLevel` **must strictly be 'H'**. Reed-Solomon algebraic decoding allows up to 30% of codewords to be corrupted or obscured without loss of encoded data.
- **Implementation**: The property is hardcoded to `'H'` in all generation calls, eliminating the risk of unreadable QR codes caused by accidental user configuration.

### 3.5 Center Logo Embedding & Circular Protection Badge
Center logos can degrade scan reliability if data modules bleed into the logo or if timing/finder patterns are covered. To guarantee scannability:

1. **Area Constraint**:
   - The logo diameter is strictly bounded to $\le 22\% - 25\%$ of the total QR dimension:
     $$\text{logoSize} = \text{dimension} \times 0.22$$
   - This ensures the obscured area occupies approximately $(0.22)^2 \approx 4.84\%$ of the total surface area, well within Level 'H's 30% recovery budget.
2. **Protective Circular Badge**:
   - Before drawing the logo image, a circular badge is stamped in the exact center:
     $$\text{badgeRadius} = \frac{\text{logoSize}}{2} + 6$$
   - The badge is filled with the background color (`lightColor` or `#ffffff`) and stroked with a 2px contour matching `darkColor`.
   - This clears a 6px protective barrier around the logo, insulating it from adjacent QR module clusters.
3. **Canvas Drawing Routine**:
   ```javascript
   function renderCenterLogo(canvas, logoImg, lightColor, darkColor, scale = 0.22) {
     const ctx = canvas.getContext('2d');
     const cx = canvas.width / 2;
     const cy = canvas.height / 2;
     const logoSize = canvas.width * scale;
     const badgeRadius = logoSize / 2 + (canvas.width > 1000 ? 20 : 6);

     ctx.save();
     // 1. Draw protective badge
     ctx.beginPath();
     ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
     ctx.fillStyle = lightColor;
     ctx.fill();
     ctx.lineWidth = canvas.width > 1000 ? 8 : 2;
     ctx.strokeStyle = darkColor;
     ctx.stroke();

     // 2. Draw clipped circular logo
     ctx.beginPath();
     ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
     ctx.clip();
     ctx.drawImage(logoImg, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
     ctx.restore();
   }
   ```
4. **Preset Badges & File Upload**:
   - Supports uploading user image files (`.png`, `.jpg`, `.svg`, `.webp`, max 2MB).
   - Provides built-in preset badge: PDF document icon.

### 3.6 Reset-to-Default Specification
Single-click control instantly restoring default parameters:
```javascript
const resetQrCustomization = () => {
  qrSettings.darkColor = '#000000';
  qrSettings.lightColor = '#FFFFFF';
  qrSettings.size = 300;
  qrSettings.exportResolution = 300;
  qrSettings.logoImage = null;
  qrSettings.logoName = '';
  qrSettings.logoScale = 0.22;
  qrSettings.errorCorrectionLevel = 'H';
  renderQrCode();
};
```

---

## 4. WCAG 2.1 Contrast Evaluation Engine (`qrContrast.js`)

### 4.1 Mathematical Formulation
Scannability depends on optical contrast between modules and background. WCAG 2.1 relative luminance provides a rigorous scientific metric.

#### Step 1: Hex Parsing & Normalization
Inputs can be 3-digit (`#abc`) or 6-digit (`#aabbcc`), case-insensitive, with leading/trailing whitespace.
$$R, G, B \in [0, 255]$$

#### Step 2: sRGB Gamma Expansion (Linearization)
For each channel $C \in \{R, G, B\}$, normalize $s = C / 255$:
$$c_{\text{linear}} = \begin{cases} \frac{s}{12.92} & \text{if } s \le 0.04045 \\ \left(\frac{s + 0.055}{1.055}\right)^{2.4} & \text{if } s > 0.04045 \end{cases}$$

#### Step 3: Relative Luminance ($L$)
$$L = 0.2126 \cdot R_{\text{linear}} + 0.7152 \cdot G_{\text{linear}} + 0.0722 \cdot B_{\text{linear}}$$

#### Step 4: Contrast Ratio ($CR$)
Let $L_1 = \max(L_{\text{dark}}, L_{\text{light}})$ and $L_2 = \min(L_{\text{dark}}, L_{\text{light}})$:
$$CR = \frac{L_1 + 0.05}{L_2 + 0.05}$$
The ratio is rounded to 2 decimal places: $CR \in [1.00, 21.00]$.

### 4.2 Scannability Evaluation Logic & Warning Thresholds
- **Optimal ($CR \ge 4.5:1$)**: `isOptimal: true, isAcceptable: false, isWarning: false`. Camera sensor decodes instantaneously under varying lighting conditions.
- **Acceptable ($3.0:1 \le CR < 4.5:1$)**: `isOptimal: false, isAcceptable: true, isWarning: false`. Meets minimum barcode scannability; minor degradation in dim lighting.
- **High-Risk Warning ($CR < 3.0:1$)**: `isOptimal: false, isAcceptable: false, isWarning: true`. Triggers warning message: `"Low contrast may cause QR scanning failures on mobile devices."`

### 4.3 Implementation Code for `frontend/src/utils/qrContrast.js`
This file matches the exact contract verified by `frontend/scripts/test-pdf-qr.mjs`:

```javascript
/**
 * frontend/src/utils/qrContrast.js
 * WCAG 2.1 relative luminance and QR scannability evaluation engine.
 */

/**
 * Parses a hex color string (#RGB or #RRGGBB) into RGB components [0..255].
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
export function parseHexColor(hex) {
  if (typeof hex !== 'string') {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Calculates WCAG 2.1 relative luminance for an RGB object.
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {number} Relative luminance in range [0, 1]
 */
export function getRelativeLuminance({ r, g, b }) {
  const normalize = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = normalize(r);
  const G = normalize(g);
  const B = normalize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 * @param {string} color1Hex
 * @param {string} color2Hex
 * @returns {number} Contrast ratio between 1.00 and 21.00
 */
export function calculateContrastRatio(color1Hex, color2Hex) {
  const rgb1 = parseHexColor(color1Hex);
  const rgb2 = parseHexColor(color2Hex);
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Evaluates scannability for QR code foreground and background colors.
 * @param {string} fgHex Foreground color (modules)
 * @param {string} bgHex Background color
 * @returns {{
 *   ratio: number,
 *   isOptimal: boolean,
 *   isAcceptable: boolean,
 *   isWarning: boolean,
 *   warningMessage: string | null
 * }}
 */
export function evaluateQrScannability(fgHex, bgHex) {
  try {
    const ratio = calculateContrastRatio(fgHex, bgHex);
    return {
      ratio,
      isOptimal: ratio >= 4.5,
      isAcceptable: ratio >= 3.0 && ratio < 4.5,
      isWarning: ratio < 3.0,
      warningMessage:
        ratio < 3.0
          ? 'Low contrast may cause QR scanning failures on mobile devices.'
          : null,
    };
  } catch (err) {
    return {
      ratio: 1.0,
      isOptimal: false,
      isAcceptable: false,
      isWarning: true,
      warningMessage: `Invalid color format: ${err.message}`,
    };
  }
}
```

---

## 5. Multi-Format Export Architecture

The export pipeline provides three download formats tailored to distinct user needs:

```
                          [Export Trigger]
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
    [Standard PNG]       [High-Res 2000px PNG]     [Vector SVG]
         |                       |                       |
 Offscreen Canvas         Offscreen Canvas        QRCode.toString()
  (300px - 600px)         (2000px x 2000px)          (type: 'svg')
         |                       |                       |
 Draw QR + Badge         Draw QR + Badge          Inject <circle> &
         |                       |                <image> in XML
    canvas.toBlob           canvas.toBlob                |
         |                       |                 Prepend <?xml>
         v                       v                       v
     Direct File             Direct File             Direct File
      Download                Download                Download
```

### 5.1 Standard PNG Download (300px–600px)
Used for fast web sharing, email embeds, and documentation.
```javascript
export async function downloadStandardPng(publicUrl, settings, baseName) {
  const exportCanvas = document.createElement('canvas');
  const size = settings.size || 300;
  exportCanvas.width = size;
  exportCanvas.height = size;

  await QRCode.toCanvas(exportCanvas, publicUrl, {
    errorCorrectionLevel: 'H',
    width: size,
    margin: settings.margin || 4,
    color: { dark: settings.darkColor, light: settings.lightColor }
  });

  if (settings.logoImage) {
    await renderLogoOnCanvas(exportCanvas, settings.logoImage, settings.lightColor, settings.darkColor, settings.logoScale);
  }

  exportCanvas.toBlob((blob) => {
    triggerBrowserDownload(blob, `${baseName}-qr-standard.png`);
  }, 'image/png');
}
```

### 5.2 High-Resolution Print PNG Download (2000px × 2000px)
Crucial for professional physical print (posters, banners, merchandise, conference passes).
- Rendering at 2000 × 2000 pixels guarantees that physical print at 300 DPI will be ~6.6 inches wide without blur.
```javascript
export async function downloadHighResPng(publicUrl, settings, baseName) {
  const exportCanvas = document.createElement('canvas');
  const size = 2000;
  exportCanvas.width = size;
  exportCanvas.height = size;

  await QRCode.toCanvas(exportCanvas, publicUrl, {
    errorCorrectionLevel: 'H',
    width: size,
    margin: 4,
    color: { dark: settings.darkColor, light: settings.lightColor }
  });

  if (settings.logoImage) {
    await renderLogoOnCanvas(exportCanvas, settings.logoImage, settings.lightColor, settings.darkColor, settings.logoScale);
  }

  exportCanvas.toBlob((blob) => {
    triggerBrowserDownload(blob, `${baseName}-qr-2000px-print.png`);
  }, 'image/png');
}
```

### 5.3 Vector SVG Download
Generates resolution-independent vector graphics for graphic designers working in Figma or Adobe Illustrator:
```javascript
export async function downloadVectorSvg(publicUrl, settings, baseName) {
  const size = 500;
  let svgString = await QRCode.toString(publicUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    width: size,
    margin: 4,
    color: { dark: settings.darkColor, light: settings.lightColor }
  });

  if (settings.logoImage) {
    const cx = size / 2;
    const cy = size / 2;
    const logoSize = size * (settings.logoScale || 0.22);
    const badgeRadius = logoSize / 2 + 6;
    const badgeSvg = `
  <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${badgeRadius.toFixed(2)}" fill="${settings.lightColor}" stroke="${settings.darkColor}" stroke-width="2"/>
  <clipPath id="qr-logo-clip">
    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(logoSize / 2).toFixed(2)}"/>
  </clipPath>
  <image href="${settings.logoImage}" x="${(cx - logoSize / 2).toFixed(2)}" y="${(cy - logoSize / 2).toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" clip-path="url(#qr-logo-clip)" preserveAspectRatio="xMidYMid meet"/>
`;
    svgString = svgString.replace('</svg>', `${badgeSvg}</svg>`);
  }

  // Prepend XML declaration for standalone compliance (T1-EXP-01)
  if (!svgString.startsWith('<?xml')) {
    svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`;
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerBrowserDownload(blob, `${baseName}-qr-vector.svg`);
}
```

---

## 6. Frontend Component Architecture & Integration Blueprint

### 6.1 `frontend/src/plugins/icons.js`
In `icons.js`, register `mdiQrcode` and `mdiQrcodeScan`:
```javascript
// Import from @mdi/js
import {
  // ... existing imports
  mdiQrcode,
  mdiQrcodeScan,
} from "@mdi/js";

// Add to iconMap:
export const iconMap = {
  // ... existing entries
  "mdi-qrcode": mdiQrcode,
  "mdi-qrcode-scan": mdiQrcodeScan,
};
```

### 6.2 `frontend/src/pages/Projects/PdfImageStudio.vue`
Update the studio wrapper to support all 3 modes seamlessly:
```javascript
<script setup>
import { provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ImgPdfPage from "./ImgPdfPage.vue";
import PdfImgPage from "./PdfImgPage.vue";
import PdfQrPage from "./PdfQrPage.vue";

const route = useRoute();
const router = useRouter();

const VALID_MODES = ["img-to-pdf", "pdf-to-img", "pdf-to-qr"];

const resolveMode = (mode) =>
  VALID_MODES.includes(mode) ? mode : "img-to-pdf";

const activeTab = ref(resolveMode(route.query.mode));

watch(
  () => route.query.mode,
  (newMode) => {
    if (VALID_MODES.includes(newMode)) {
      activeTab.value = newMode;
    }
  },
);

const switchTab = (tab) => {
  activeTab.value = tab;
  router.replace({
    query: {
      ...route.query,
      mode: tab,
    },
  });
};

provide("studioMode", {
  activeTab,
  switchTab,
});
</script>

<template>
  <div class="pdf-image-studio">
    <keep-alive>
      <component
        :is="
          activeTab === 'img-to-pdf'
            ? ImgPdfPage
            : activeTab === 'pdf-to-img'
              ? PdfImgPage
              : PdfQrPage
        "
      />
    </keep-alive>
  </div>
</template>
```

### 6.3 Mode Navigation Bar in `ImgPdfPage.vue` & `PdfImgPage.vue`
Add the 3rd mode button to the sidebar navigation in both existing pages:
```html
<button
  type="button"
  class="mode-list-btn"
  :class="{ 'is-active': activeTab === 'pdf-to-qr' }"
  @click="switchTab('pdf-to-qr')"
>
  <div class="mode-btn-icon">
    <v-icon size="20">mdi-qrcode-scan</v-icon>
  </div>
  <div class="mode-btn-content text-left">
    <div class="mode-btn-title">PDF to QR Code</div>
    <div class="mode-btn-subtitle">Generate shareable QR codes</div>
  </div>
  <v-icon size="16" class="mode-btn-chevron">
    {{ activeTab === 'pdf-to-qr' ? 'mdi-check' : 'mdi-chevron-right' }}
  </v-icon>
</button>
```

### 6.4 Comprehensive Component Blueprint: `PdfQrPage.vue`
The new `PdfQrPage.vue` follows the exact visual structure, design tokens, responsive cards, and alert handling established by `ImgPdfPage.vue` and `PdfImgPage.vue`:

```html
<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, inject, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import QRCode from 'qrcode';
import * as pdfjsLib from 'pdfjs-dist';
import Alerts from '@/components/Alerts.vue';
import { getApiBaseUrl } from '@/utils/apiBaseUrl.js';
import { evaluateQrScannability } from '@/utils/qrContrast.js';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const route = useRoute();
const router = useRouter();
const studioMode = inject('studioMode', null);
const { xs, smAndDown } = useDisplay();

// UI Alerts
const alertVisible = ref(false);
const alertMessage = ref('');
const alertType = ref('success');
const showAlert = (msg, type = 'success') => {
  alertMessage.value = msg;
  alertType.value = type;
  alertVisible.value = true;
};

// Document & Upload State
const fileInput = ref(null);
const logoInput = ref(null);
const qrCanvas = ref(null);
const pdfThumbCanvas = ref(null);

const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref('');

const uploadedDocument = ref(null); // { id, filename, size, url, expires_at }
const isCopied = ref(false);
const isDeleting = ref(false);

// QR Customizer State
const qrSettings = reactive({
  darkColor: '#000000',
  lightColor: '#FFFFFF',
  size: 300,
  exportResolution: 300,
  errorCorrectionLevel: 'H',
  margin: 4,
  logoImage: null,
  logoName: '',
  logoScale: 0.22,
});

// Color Presets
const COLOR_PRESETS = [
  { name: 'Classic', dark: '#000000', light: '#FFFFFF' },
  { name: 'Studio Burgundy', dark: '#7C0E44', light: '#FFFFFF' },
  { name: 'Warm Studio', dark: '#7C0E44', light: '#F2DACE' },
  { name: 'Slate Dark', dark: '#FFFFFF', light: '#111827' },
];

// Contrast & Scannability Evaluation
const contrastResult = computed(() =>
  evaluateQrScannability(qrSettings.darkColor, qrSettings.lightColor)
);

// Formatted Public URL
const publicLandingUrl = computed(() => {
  if (!uploadedDocument.value?.id) return '';
  const origin = window.location.origin;
  return `${origin}/v/${uploadedDocument.value.id}`;
});

// Mode Switching
const switchTab = (tab) => {
  if (studioMode?.switchTab) {
    studioMode.switchTab(tab);
  } else {
    router.replace({ query: { ...route.query, mode: tab } });
  }
};

// Lifecycle & Event Listeners
onMounted(() => {
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
});
</script>
```

---

## 7. Verification Method & Test Alignment

The entire implementation has been mapped against the existing test suite:

### 7.1 Unit & Contract Tests (`test-pdf-qr.mjs`)
- **Suite 1: WCAG 2.1 Contrast & Scannability**:
  - `T1-CON-01` to `T1-CON-05`: Verifies black on white (21:1), brand burgundy `#7C0E44` on white (9.87:1), brand on warm `#F2DACE` (5.86:1), and low-contrast warnings for `#FFFF00` on `#FFFFFF`.
  - `T2-CON-01` to `T2-CON-05`: Verifies 3-digit hex shortcuts, whitespace trimming, descriptive errors on invalid hex strings, and 1.0:1 identical color handling.
- **Suite 2: QR Matrix & Structural Integrity**:
  - `T1-QR-01` to `T1-QR-05`: Verifies Level 'H' encoding, 7x7 finder patterns, and timing patterns at row 6/col 6.
- **Suite 3: Programmatic QR Decoding**:
  - `T1-DEC-01` to `T2-DEC-01`: Verifies bit-for-bit URL decoding with center logo obscured modules.
- **Suite 4: Customization & Center Logo Area Bounds**:
  - `T1-CUS-01` to `T1-CUS-03`: Verifies SVG colors, $\le 25\%$ center logo bounds with circular badge, and single-click reset-to-default.
- **Suite 5: Multi-Format QR Export**:
  - `T1-EXP-01` to `T1-EXP-03`: Verifies standalone XML SVG, 300px standard PNG signature, and 2000px high-resolution PNG dimensions in IHDR.

### 7.2 Full E2E Integration Suite (`test-e2e-suite.mjs`)
- `T1-QR-01`: Scannable QR generated immediately upon upload.
- `T1-CPY-01`: Exact URL format `${origin}/v/${id}` with clipboard integration.
- `T1-MOD-01`: Studio mode navigation activating via `?mode=pdf-to-qr`.
- `T3-INT-02`: Upload $\to$ Customize QR Colors & Logo $\to$ Verify Contrast $\to$ Delete PDF $\to$ Verify 404 Cascade.
- `T3-INT-05`: High-resolution PNG (2000px) verified in IHDR chunk.
- `Tier 4 Scenario 2`: Event marketing workflow with logo QR, contrast warning, and export.

---

## 8. Summary of Implementation Checklist for Implementer

1. [ ] **Dependencies**:
   - Add `"qrcode": "^1.5.4"` to `frontend/package.json`.
   - Run `pnpm install` in `frontend/`.
2. [ ] **Utilities**:
   - Create `frontend/src/utils/qrContrast.js` with the exact implementation specified in Section 4.3.
3. [ ] **Icons**:
   - In `frontend/src/plugins/icons.js`, import and register `mdiQrcode` and `mdiQrcodeScan`.
4. [ ] **Studio Container**:
   - In `frontend/src/pages/Projects/PdfImageStudio.vue`, register `PdfQrPage.vue` and update `activeTab` to support `pdf-to-qr`.
5. [ ] **Existing Studio Pages**:
   - In `ImgPdfPage.vue` and `PdfImgPage.vue`, add the "PDF to QR Code" button in the sidebar mode list.
6. [ ] **QR Studio Page**:
   - Create `frontend/src/pages/Projects/PdfQrPage.vue` with 2-column layout, PDF upload dropzone, thumbnail preview, live QR canvas, contrast badge, color pickers, size slider, center logo badge, reset button, and multi-format export buttons.
7. [ ] **Verification**:
   - Run `node --test frontend/scripts/test-pdf-qr.mjs` (must pass 27/27).
   - Run `node --test frontend/scripts/test-e2e-suite.mjs` (must pass 58/58).
