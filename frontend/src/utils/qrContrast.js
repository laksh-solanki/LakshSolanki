/**
 * frontend/src/utils/qrContrast.js
 * WCAG 2.1 Contrast Calculation, QR Scannability Evaluation, and PDF File Utilities.
 */

/**
 * Parses a hex color string (#RGB or #RRGGBB) into RGB components [0..255].
 * Handles whitespace and 3-character shortcuts.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
export function parseHexColor(hex) {
  if (typeof hex !== "string") {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
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
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B (after sRGB gamma expansion).
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
 * (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker.
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
 * Alias for calculateContrastRatio
 * @param {string} color1
 * @param {string} color2
 * @returns {number}
 */
export function getContrastRatio(color1, color2) {
  return calculateContrastRatio(color1, color2);
}

/**
 * Checks if contrast meets a minimum threshold (default 3.0 for QR barcodes).
 * @param {string} fgColor
 * @param {string} bgColor
 * @param {number} [minRatio=3.0]
 * @returns {boolean}
 */
export function isContrastSafe(fgColor, bgColor, minRatio = 3.0) {
  try {
    return calculateContrastRatio(fgColor, bgColor) >= minRatio;
  } catch {
    return false;
  }
}

/**
 * Gets a human-readable rating for QR contrast: "Optimal", "Acceptable", or "Low Contrast".
 * @param {string} fgColor
 * @param {string} bgColor
 * @returns {"Optimal" | "Acceptable" | "Low Contrast" | "Invalid"}
 */
export function getContrastRating(fgColor, bgColor) {
  try {
    const ratio = calculateContrastRatio(fgColor, bgColor);
    if (ratio >= 4.5) return "Optimal";
    if (ratio >= 3.0) return "Acceptable";
    return "Low Contrast";
  } catch {
    return "Invalid";
  }
}

/**
 * Evaluates scannability for QR code foreground and background colors.
 * @param {string} fgHex Foreground color (dark modules)
 * @param {string} bgHex Background color (light surface)
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
          ? "Low contrast may cause QR scanning failures on mobile devices."
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

/**
 * Validates PDF file on the client before upload.
 * Checks file presence, 0-byte size, 10MB ceiling, and PDF extension / MIME type.
 * @param {File | { name: string, type: string, size: number }} file
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateClientPdf(file) {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }
  const isPdfMime = file.type === "application/pdf";
  const hasPdfExt =
    typeof file.name === "string" && file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfMime && !hasPdfExt) {
    return { valid: false, error: "Please upload a valid PDF document." };
  }
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds 10 MB limit." };
  }
  if (file.size === 0) {
    return { valid: false, error: "File is empty (0 bytes)." };
  }
  return { valid: true, error: null };
}

/**
 * Deep async validation including binary %PDF- magic bytes check if available.
 * @param {File | Blob} file
 * @returns {Promise<{ valid: boolean, error: string | null }>}
 */
export async function validatePdfFile(file) {
  const basic = validateClientPdf(file);
  if (!basic.valid) return basic;

  if (file && typeof file.slice === "function") {
    try {
      const slice = file.slice(0, 5);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const header = String.fromCharCode(...bytes);
      if (header !== "%PDF-") {
        return {
          valid: false,
          error: "Corrupted PDF file: Missing '%PDF-' binary header.",
        };
      }
    } catch {
      // If slicing fails, accept basic validation
    }
  }

  return { valid: true, error: null };
}

/**
 * Formats file size in bytes to human-readable string (B, KB, MB, GB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Truncates long filenames while preserving the file extension.
 * @param {string} filename
 * @param {number} [maxLength=30]
 * @returns {string}
 */
export function truncateFilename(filename, maxLength = 30) {
  if (!filename || filename.length <= maxLength) return filename;
  const ext =
    filename.lastIndexOf(".") !== -1
      ? filename.slice(filename.lastIndexOf("."))
      : "";
  const base = filename.slice(0, filename.length - ext.length);
  const keep = maxLength - ext.length - 3;
  if (keep <= 0) return filename.slice(0, maxLength);
  return base.slice(0, keep) + "..." + ext;
}
