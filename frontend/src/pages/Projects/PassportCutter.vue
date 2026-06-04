<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowReactive, watch } from "vue";
import Alerts from "@/components/Alerts.vue";

const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";
const IMAGE_API_KEY = (import.meta.env.VITE_IMAGE_API_KEY || "").trim();
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const PASSPORT_WIDTH_MM = 35;
const PASSPORT_HEIGHT_MM = 45;
const PASSPORT_PRINT_DPI = 600;
const MM_PER_INCH = 25.4;
const PASSPORT_WIDTH_PX = Math.round((PASSPORT_WIDTH_MM / MM_PER_INCH) * PASSPORT_PRINT_DPI);
const PASSPORT_HEIGHT_PX = Math.round((PASSPORT_HEIGHT_MM / MM_PER_INCH) * PASSPORT_PRINT_DPI);
const PASSPORT_BORDER_MIN = 0;
const PASSPORT_BORDER_MAX = 36;
const PASSPORT_BORDER_DEFAULT = 2;
const PASSPORT_BORDER_COLOR = "#000000";
const PASSPORT_BORDER_INSET_PX = 0;
const PASSPORT_OUTER_AREA_COLOR = "#ffffff";
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const TEXT_ENCODER = new TextEncoder();

const inputMode = ref("file");
const fileUploadModel = ref([]);
const uploads = shallowReactive(new Map());
const selectedFile = ref(null);
const selectedFileName = ref("");
const imageUrl = ref("");
const resultPreviewUrl = ref("");
const resultBlob = ref(null);
const transparentResultBlob = ref(null);
const resultFilename = ref("image-no-bg.png");
const useSolidBackground = true;
const autoApplyColor = true;
const solidBackgroundColor = ref("#ffffff");
const borderThickness = ref(PASSPORT_BORDER_DEFAULT);
const isProcessing = ref(false);
const isApplyingColor = ref(false);
const isDragging = ref(false);
const resultMeta = ref({
  width: 0,
  height: 0,
  sizeBytes: 0,
  format: "PNG",
  background: "transparent",
});

let autoApplyTimer = null;
const solidColorPresets = [
  { name: "White", hex: "#ffffff" },
  { name: "Cloud Gray", hex: "#f5f5f5" },
  { name: "Black", hex: "#000000" },
  { name: "Teal", hex: "#0f8f7c" },
  { name: "Royal Blue", hex: "#2f6fed" },
  { name: "Sun Yellow", hex: "#f8d24a" },
  { name: "Rose Pink", hex: "#f08ca0" },
];

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const hasApiKey = computed(() => Boolean(IMAGE_API_KEY));
const hasSource = computed(() =>
  inputMode.value === "file" ? Boolean(selectedFile.value) : Boolean(imageUrl.value.trim()),
);
const isBusy = computed(() => isProcessing.value || isApplyingColor.value);
const canProcess = computed(() => hasApiKey.value && hasSource.value && !isBusy.value);
const hasGeneratedOutput = computed(() => Boolean(resultPreviewUrl.value));
const showBackgroundTools = computed(() => hasGeneratedOutput.value);
const selectedFileDetails = computed(() => {
  const file = selectedFile.value;
  if (!file) return "";
  const typeLabel = String(file.type || "image").split("/").pop() || "image";
  return `${formatFileSize(file.size)} | ${typeLabel.toUpperCase()}`;
});
const solidBackgroundHex = computed({
  get: () => solidBackgroundColor.value.toUpperCase(),
  set: (value) => {
    const raw = String(value || "").trim();
    if (!raw) return;
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#([0-9a-fA-F]{6})$/.test(normalized)) {
      solidBackgroundColor.value = normalized.toLowerCase();
    }
  },
});
const borderThicknessInput = computed({
  get: () => borderThickness.value,
  set: (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    borderThickness.value = clampBorderThickness(Math.round(parsed));
  },
});
const borderThicknessLabel = computed(() => `${borderThickness.value}px`);
const resultMetaLabel = computed(() => {
  if (!resultPreviewUrl.value || !resultMeta.value.width || !resultMeta.value.height) return "";
  const kb = Math.max(1, Math.round(resultMeta.value.sizeBytes / 1024));
  return `${resultMeta.value.width}x${resultMeta.value.height} | ${resultMeta.value.format} | ${PASSPORT_PRINT_DPI} DPI | ${kb} KB`;
});
const canClipboardWrite = computed(
  () =>
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.write === "function" &&
    typeof ClipboardItem !== "undefined",
);

const goBack = () => window.history.back();

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const revokeResultPreview = () => {
  if (resultPreviewUrl.value) {
    URL.revokeObjectURL(resultPreviewUrl.value);
    resultPreviewUrl.value = "";
  }
};

const resetResult = () => {
  revokeResultPreview();
  resultBlob.value = null;
  transparentResultBlob.value = null;
  resultFilename.value = "image-no-bg.png";
  resultMeta.value = {
    width: 0,
    height: 0,
    sizeBytes: 0,
    format: "PNG",
    background: "transparent",
  };
};

const clearSource = () => {
  selectedFile.value = null;
  selectedFileName.value = "";
  imageUrl.value = "";
  if (fileUploadModel.value.length) {
    fileUploadModel.value = [];
  }
  uploads.clear();
};

watch(fileUploadModel, (files) => {
  const currentFiles = Array.isArray(files) ? files : [];
  for (const existingFile of Array.from(uploads.keys())) {
    if (!currentFiles.includes(existingFile)) {
      uploads.delete(existingFile);
    }
  }

  const file = currentFiles.length ? currentFiles[0] : null;
  if (file) {
    uploads.set(file, {
      progress: 100,
      buffer: 100,
    });
  }

  if (!file) {
    clearSource();
    return;
  }

  if (selectedFile.value === file) return;
  setSelectedFile(file);
});

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const clampBorderThickness = (value) => {
  return Math.min(PASSPORT_BORDER_MAX, Math.max(PASSPORT_BORDER_MIN, Number(value) || 0));
};

const toUint32 = (bytes, offset) => {
  return (
    ((bytes[offset] << 24) >>> 0) +
    ((bytes[offset + 1] << 16) >>> 0) +
    ((bytes[offset + 2] << 8) >>> 0) +
    (bytes[offset + 3] >>> 0)
  );
};

const writeUint32 = (bytes, offset, value) => {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
};

let crcTable = null;
const getCrcTable = () => {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  crcTable = table;
  return table;
};

const crc32 = (bytes) => {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const createPngChunk = (chunkType, data) => {
  const typeBytes = TEXT_ENCODER.encode(chunkType);
  const output = new Uint8Array(12 + data.length);
  writeUint32(output, 0, data.length);
  output.set(typeBytes, 4);
  output.set(data, 8);
  const crcSource = new Uint8Array(typeBytes.length + data.length);
  crcSource.set(typeBytes, 0);
  crcSource.set(data, typeBytes.length);
  writeUint32(output, 8 + data.length, crc32(crcSource));
  return output;
};

const writePngDpiMetadata = async (blob, dpi = PASSPORT_PRINT_DPI) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 8) return blob;
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return blob;
  }

  const safeDpi = Math.max(1, Math.round(Number(dpi) || PASSPORT_PRINT_DPI));
  const ppm = Math.max(1, Math.round((safeDpi / MM_PER_INCH) * 1000));
  const physData = new Uint8Array(9);
  writeUint32(physData, 0, ppm);
  writeUint32(physData, 4, ppm);
  physData[8] = 1;
  const physChunk = createPngChunk("pHYs", physData);

  const chunks = [];
  let offset = 8;
  let insertedPhys = false;

  while (offset + 12 <= bytes.length) {
    const chunkLength = toUint32(bytes, offset);
    const chunkTotalLength = 12 + chunkLength;
    if (offset + chunkTotalLength > bytes.length) {
      return blob;
    }

    const typeOffset = offset + 4;
    const chunkType = String.fromCharCode(
      bytes[typeOffset],
      bytes[typeOffset + 1],
      bytes[typeOffset + 2],
      bytes[typeOffset + 3],
    );

    if (chunkType !== "pHYs") {
      chunks.push(bytes.slice(offset, offset + chunkTotalLength));
      if (!insertedPhys && chunkType === "IHDR") {
        chunks.push(physChunk);
        insertedPhys = true;
      }
    }

    offset += chunkTotalLength;
    if (chunkType === "IEND") break;
  }

  if (!insertedPhys) return blob;

  const totalLength = 8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  output.set(PNG_SIGNATURE, 0);
  let outputOffset = 8;
  for (const chunk of chunks) {
    output.set(chunk, outputOffset);
    outputOffset += chunk.length;
  }

  return new Blob([output], { type: "image/png" });
};

const writeJpegDpiMetadata = async (blob, dpi = PASSPORT_PRINT_DPI) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return blob;
  }

  const density = Math.max(1, Math.min(65535, Math.round(Number(dpi) || PASSPORT_PRINT_DPI)));
  let offset = 2;

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) {
      return blob;
    }

    if (marker === 0xe0 && segmentLength >= 16) {
      const dataOffset = offset + 4;
      const isJfif =
        bytes[dataOffset] === 0x4a &&
        bytes[dataOffset + 1] === 0x46 &&
        bytes[dataOffset + 2] === 0x49 &&
        bytes[dataOffset + 3] === 0x46 &&
        bytes[dataOffset + 4] === 0x00;

      if (isJfif) {
        bytes[dataOffset + 7] = 0x01;
        bytes[dataOffset + 8] = (density >> 8) & 0xff;
        bytes[dataOffset + 9] = density & 0xff;
        bytes[dataOffset + 10] = (density >> 8) & 0xff;
        bytes[dataOffset + 11] = density & 0xff;
        return new Blob([bytes], { type: "image/jpeg" });
      }
    }

    offset += 2 + segmentLength;
  }

  return blob;
};

const enforcePrintDpi = async (blob, format = "") => {
  const marker = String(format || blob?.type || "").toLowerCase();
  try {
    if (marker.includes("png")) return await writePngDpiMetadata(blob, PASSPORT_PRINT_DPI);
    if (marker.includes("jpeg") || marker.includes("jpg")) {
      return await writeJpegDpiMetadata(blob, PASSPORT_PRINT_DPI);
    }
  } catch {
    return blob;
  }
  return blob;
};

const setSelectedFile = (file) => {
  if (!file) return;
  if (!String(file.type || "").startsWith("image/")) {
    showAlert("Please choose a valid image file.", "error");
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    showAlert("File is too large. Use an image under 12 MB.", "error");
    return;
  }

  resetResult();
  selectedFile.value = file;
  selectedFileName.value = file.name;
  showAlert(`Selected ${file.name} (${formatFileSize(file.size)}).`);
};

const deriveSourceName = () => {
  if (selectedFileName.value) {
    return selectedFileName.value.replace(/\.[^/.]+$/, "") || "image";
  }

  if (inputMode.value === "url" && imageUrl.value.trim()) {
    try {
      const url = new URL(imageUrl.value.trim());
      const nameFromPath = decodeURIComponent(url.pathname.split("/").pop() || "").replace(/\.[^/.]+$/, "").trim();
      if (nameFromPath) return nameFromPath;
    } catch {
      // Keep fallback.
    }
  }

  return "image";
};

const setOutputBlob = async (blob, filename, options = {}) => {
  const normalizedBlob = await enforcePrintDpi(blob, options.format || blob?.type);
  revokeResultPreview();
  resultBlob.value = normalizedBlob;
  resultPreviewUrl.value = URL.createObjectURL(normalizedBlob);
  resultFilename.value = filename;

  try {
    const image = await createImageFromBlob(normalizedBlob);
    resultMeta.value = {
      width: image.naturalWidth || image.width || 0,
      height: image.naturalHeight || image.height || 0,
      sizeBytes: normalizedBlob.size || 0,
      format: String(options.format || "PNG"),
      background: String(options.background || "transparent"),
    };
  } catch {
    resultMeta.value = {
      width: 0,
      height: 0,
      sizeBytes: normalizedBlob.size || 0,
      format: String(options.format || "PNG"),
      background: String(options.background || "transparent"),
    };
  }
};

const handleFileInput = (event) => {
  const file = event?.target?.files?.[0];
  setSelectedFile(file);
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;
  const file = event?.dataTransfer?.files?.[0];
  setSelectedFile(file);
};

const parseRemoveBgError = async (response) => {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    const firstError = payload?.errors?.[0];
    const message =
      firstError?.title ||
      firstError?.detail ||
      payload?.error?.title ||
      payload?.error ||
      payload?.message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  const text = await response.text().catch(() => "");
  if (text.trim()) {
    return text.trim().slice(0, 220);
  }
  return `Request failed with status ${response.status}.`;
};

const createImageFromBlob = async (blob) => {
  const blobUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to read output image."));
      img.src = blobUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};

const createBlobWithSolidBackground = async (blob, color, borderPx = PASSPORT_BORDER_DEFAULT) => {
  const image = await createImageFromBlob(blob);
  const canvas = document.createElement("canvas");
  canvas.width = PASSPORT_WIDTH_PX;
  canvas.height = PASSPORT_HEIGHT_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  const normalizedBorder = clampBorderThickness(borderPx);
  const frameInset = Math.max(0, Math.round(PASSPORT_BORDER_INSET_PX));
  const frameWidth = Math.max(1, canvas.width - frameInset * 2);
  const frameHeight = Math.max(1, canvas.height - frameInset * 2);
  const innerWidth = Math.max(1, frameWidth - normalizedBorder * 2);
  const innerHeight = Math.max(1, frameHeight - normalizedBorder * 2);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fill full canvas, then optionally draw border and inner background.
  ctx.fillStyle = PASSPORT_OUTER_AREA_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (normalizedBorder > 0) {
    ctx.fillStyle = PASSPORT_BORDER_COLOR;
    ctx.fillRect(frameInset, frameInset, frameWidth, frameHeight);
  }

  ctx.fillStyle = color;
  ctx.fillRect(
    frameInset + normalizedBorder,
    frameInset + normalizedBorder,
    innerWidth,
    innerHeight,
  );

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale = Math.max(innerWidth / imageWidth, innerHeight / imageHeight);
  const drawWidth = Math.max(1, Math.round(imageWidth * scale));
  const drawHeight = Math.max(1, Math.round(imageHeight * scale));
  const drawX = frameInset + normalizedBorder + Math.round((innerWidth - drawWidth) / 2);
  const drawY = frameInset + normalizedBorder + Math.round((innerHeight - drawHeight) / 2);

  // Keep the photo constrained inside the inner area so it stays behind the border.
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    frameInset + normalizedBorder,
    frameInset + normalizedBorder,
    innerWidth,
    innerHeight,
  );
  ctx.clip();
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();

  const output = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png", 1);
  });

  if (!output) {
    throw new Error("Unable to generate passport photo output.");
  }

  return output;
};

const useTransparentOutput = async ({ silent = false } = {}) => {
  if (!transparentResultBlob.value) {
    showAlert("Create a background-removed image first.", "error");
    return;
  }

  const sourceName = deriveSourceName();
  await setOutputBlob(transparentResultBlob.value, `${sourceName}-no-bg.png`, {
    format: "PNG",
    background: "transparent",
  });
  if (!silent) {
    showAlert("Transparent output restored.");
  }
};

const applySolidBackground = async ({ silent = false } = {}) => {
  if (!transparentResultBlob.value) {
    showAlert("Create a background-removed image first.", "error");
    return;
  }

  isApplyingColor.value = true;
  try {
    const sourceName = deriveSourceName();
    const colorizedBlob = await createBlobWithSolidBackground(
      transparentResultBlob.value,
      solidBackgroundColor.value,
      borderThickness.value,
    );
    await setOutputBlob(colorizedBlob, `${sourceName}-passport.png`, {
      format: "PNG",
      background: solidBackgroundColor.value,
    });
    if (!silent) {
      showAlert("Passport photo updated.");
    }
  } catch (error) {
    showAlert(error?.message || "Failed to apply passport frame.", "error");
  } finally {
    isApplyingColor.value = false;
  }
};

const queueAutoApplyColor = () => {
  if (!autoApplyColor || !useSolidBackground || !transparentResultBlob.value || isProcessing.value) {
    return;
  }

  if (autoApplyTimer) {
    clearTimeout(autoApplyTimer);
  }
  autoApplyTimer = setTimeout(() => {
    applySolidBackground({ silent: true });
  }, 220);
};

const removeBackground = async () => {
  if (!canProcess.value) return;

  if (!hasApiKey.value) {
    showAlert("Missing VITE_IMAGE_API_KEY in frontend .env.", "error");
    return;
  }

  isProcessing.value = true;
  resetResult();

  try {
    const formData = new FormData();
    formData.append("size", "full");

    if (inputMode.value === "file") {
      formData.append("image_file", selectedFile.value, selectedFileName.value || "image");
    } else {
      formData.append("image_url", imageUrl.value.trim());
    }

    const response = await fetch(REMOVE_BG_ENDPOINT, {
      method: "POST",
      headers: {
        "X-Api-Key": IMAGE_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await parseRemoveBgError(response);
      throw new Error(errorMessage);
    }

    const outputBlob = await response.blob();
    if (!outputBlob || outputBlob.size === 0) {
      throw new Error("The API returned an empty image.");
    }

    const sourceName = deriveSourceName();
    transparentResultBlob.value = outputBlob;
    await setOutputBlob(outputBlob, `${sourceName}-no-bg.png`, {
      format: "PNG",
      background: "transparent",
    });

    if (useSolidBackground) {
      await applySolidBackground({ silent: true });
    }

    showAlert("Passport photo generated successfully.");
  } catch (error) {
    showAlert(error?.message || "Failed to create passport photo.", "error");
  } finally {
    isProcessing.value = false;
  }
};

const downloadResult = () => {
  if (!resultBlob.value) return;
  const link = document.createElement("a");
  link.href = resultPreviewUrl.value;
  link.download = resultFilename.value;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const createJpegFromBlob = async (blob, fillColor = "#ffffff") => {
  const image = await createImageFromBlob(blob);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable in this browser.");
  }
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const output = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 1.0);
  });
  if (!output) {
    throw new Error("Unable to generate JPG output.");
  }
  return await enforcePrintDpi(output, "JPEG");
};

const downloadJpgResult = async () => {
  if (!resultBlob.value) return;
  try {
    const sourceName = deriveSourceName();
    const backgroundForJpg =
      resultMeta.value.background && resultMeta.value.background !== "transparent"
        ? resultMeta.value.background
        : "#ffffff";
    const jpgBlob = await createJpegFromBlob(resultBlob.value, backgroundForJpg);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(jpgBlob);
    link.download = `${sourceName}-passport.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
    showAlert("JPG downloaded successfully.");
  } catch (error) {
    showAlert(error?.message || "Failed to export JPG.", "error");
  }
};

const copyResultToClipboard = async () => {
  if (!resultBlob.value) return;
  if (!canClipboardWrite.value) {
    showAlert("Clipboard image copy is not supported in this browser.", "error");
    return;
  }

  try {
    const item = new ClipboardItem({
      [resultBlob.value.type || "image/png"]: resultBlob.value,
    });
    await navigator.clipboard.write([item]);
    showAlert("Output image copied to clipboard.");
  } catch (error) {
    showAlert(error?.message || "Unable to copy image to clipboard.", "error");
  }
};

const applyPresetColor = (color) => {
  solidBackgroundColor.value = color.toLowerCase();
  queueAutoApplyColor();
};

const handleWindowPaste = (event) => {
  if (inputMode.value !== "file") return;
  const items = Array.from(event?.clipboardData?.items || []);
  const imageItem = items.find((item) => String(item.type || "").startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (!file) return;
  setSelectedFile(file);
  showAlert("Image pasted from clipboard.");
};

watch(
  () => solidBackgroundColor.value,
  () => {
    queueAutoApplyColor();
  },
);

watch(
  () => borderThickness.value,
  () => {
    queueAutoApplyColor();
  },
);

onMounted(() => {
  window.addEventListener("paste", handleWindowPaste);
});

onBeforeUnmount(() => {
  if (autoApplyTimer) {
    clearTimeout(autoApplyTimer);
  }
  window.removeEventListener("paste", handleWindowPaste);
  revokeResultPreview();
});

watch(
  () => inputMode.value,
  () => {
    clearSource();
    resetResult();
  },
);
</script>

<template>
  <div class="tool-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />
    <v-container class="py-8 py-md-12">
      <v-row density="comfortable" class="tool-grid">
        <v-col cols="12" lg="5">
          <v-card class="tool-shell p-5 p-md-7 h-100" rounded="xl" elevation="0">
            <p class="panel-kicker mb-1">Input</p>
            <h2 class="text-h5 font-weight-bold mb-1">Select source photo</h2>
            <p class="text-body-2 text-medium-emphasis mb-5">
              Upload one image file or provide a direct image URL to build a passport-size output.
            </p>

            <v-alert v-if="!hasApiKey" type="warning" variant="tonal" class="mb-4">
              Add <strong>VITE_IMAGE_API_KEY</strong> in <strong>frontend/.env</strong> to use this tool.
            </v-alert>

            <v-btn-toggle v-model="inputMode" mandatory divided class="mb-5 mode-toggle">
              <v-btn value="file" class="text-none">Upload File</v-btn>
              <v-btn value="url" class="text-none">Image URL</v-btn>
            </v-btn-toggle>

            <div v-if="inputMode === 'file'">
              <v-file-upload v-model="fileUploadModel" accept="image/*" clearable show-size :max-files="1">
                <template #default>
                  <v-file-upload-dropzone density="comfortable" rounded="xl" />
                  <v-file-upload-list class="upload-list">
                    <template v-slot:default="{ files, onClickRemove }">
                      <v-file-upload-item v-for="(file, index) in files"
                        :key="`${file.name}-${file.size}-${file.lastModified}`" :file="file" clearable show-size>
                        <template #prepend>
                          <VAvatar rounded="lg"></VAvatar>
                          <v-progress-linear v-if="uploads.has(file)" :buffer-value="uploads.get(file).buffer"
                            :color="uploads.get(file).progress >= 100 ? 'success' : 'primary'"
                            :model-value="uploads.get(file).progress" location="bottom" absolute></v-progress-linear>
                        </template>
                        <template #clear>
                          <v-btn color="error" icon variant="text" aria-label="Remove file"
                            @click.stop.prevent="onClickRemove(index)">
                            <v-icon>mdi-trash-can</v-icon>
                          </v-btn>
                        </template>
                      </v-file-upload-item>
                    </template>
                  </v-file-upload-list>
                </template>
              </v-file-upload>
            </div>

            <div v-else>
              <v-text-field v-model="imageUrl" label="Image URL" placeholder="https://example.com/photo.jpg"
                variant="outlined" density="comfortable" hide-details="auto" />
            </div>

            <v-progress-linear v-if="isBusy" indeterminate color="primary" height="5" rounded class="my-5" />

            <div class="d-flex flex-wrap ga-2 action-group mt-5">
              <v-btn color="primary" class="text-none" rounded="xl" :loading="isProcessing" :disabled="!canProcess"
                @click="removeBackground">
                Create Passport Photo
              </v-btn>
            </div>

          </v-card>
        </v-col>

        <v-col cols="12" lg="7">
          <v-card class="tool-shell p-5 p-md-7 h-100" rounded="xl" elevation="0">
            <p class="panel-kicker mb-1">Preview</p>
            <h2 class="text-h5 font-weight-bold mb-1">Passport output</h2>
            <p class="text-body-2 text-medium-emphasis mb-5">
              Output is generated at {{ PASSPORT_WIDTH_MM }} mm x {{ PASSPORT_HEIGHT_MM }} mm
              ({{ PASSPORT_WIDTH_PX }}x{{ PASSPORT_HEIGHT_PX }} px @ {{ PASSPORT_PRINT_DPI }} DPI) with an automatic
              border.
            </p>

            <div v-if="!showBackgroundTools" class="tools-unlock-note mb-5">
              <v-icon size="18" class="tools-unlock-icon">mdi-tune-vertical</v-icon>
              <span>Generate a passport photo to unlock border, background, and export tools.</span>
            </div>

            <v-expand-transition>
              <div v-if="showBackgroundTools" class="output-controls mb-5">
                <div class="border-tools">
                  <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-2">
                    <span class="text-caption text-medium-emphasis">Border thickness</span>
                    <span class="border-thickness-pill">{{ borderThicknessLabel }}</span>
                  </div>
                  <div class="d-flex align-center ga-3 border-tools-row">
                    <v-slider v-model="borderThickness" :min="PASSPORT_BORDER_MIN" :max="PASSPORT_BORDER_MAX" :step="1"
                      hide-details density="compact" class="border-slider d-none d-md-block"
                      :disabled="isBusy || !transparentResultBlob" />
                    <v-text-field v-model="borderThicknessInput" type="number" label="px" variant="outlined"
                      density="compact" hide-details class="border-input" :min="PASSPORT_BORDER_MIN"
                      :max="PASSPORT_BORDER_MAX" :disabled="isBusy || !transparentResultBlob" />
                  </div>
                </div>

                <div class="d-flex align-center flex-wrap ga-3 output-controls-row">
                  <label class="color-control">
                    <span class="text-caption text-medium-emphasis">Photo Bg</span>
                    <input v-model="solidBackgroundColor" type="color" :disabled="isBusy || !transparentResultBlob" />
                  </label>

                  <v-text-field v-model="solidBackgroundHex" label="Hex" variant="outlined" density="compact"
                    hide-details class="hex-input" :disabled="isBusy || !transparentResultBlob" />

                  <v-btn color="primary" variant="tonal" class="text-none" rounded="xl" :loading="isApplyingColor"
                    :disabled="isBusy || !transparentResultBlob" @click="applySolidBackground">
                    Apply Passport Frame
                  </v-btn>

                  <v-btn variant="tonal" rounded="xl" class="text-none" :disabled="isBusy || !transparentResultBlob"
                    @click="useTransparentOutput">
                    Use Transparent
                  </v-btn>
                </div>

                <div class="preset-colors mt-3">
                  <span class="text-caption text-medium-emphasis">Quick colors:</span>
                  <v-tooltip v-for="preset in solidColorPresets" :key="preset.hex" location="bottom"
                    content-class="quick-color-tooltip">
                    <template #activator="{ props }">
                      <button v-bind="props" type="button" class="preset-chip" :style="{ backgroundColor: preset.hex }"
                        :title="preset.name" :aria-label="`Use ${preset.name} background color`"
                        :disabled="isBusy || !transparentResultBlob" @click="applyPresetColor(preset.hex)"></button>
                    </template>
                    <span class="quick-color-tooltip-text">{{ preset.name }} ({{ preset.hex.toUpperCase() }})</span>
                  </v-tooltip>
                </div>
              </div>
            </v-expand-transition>

            <v-row density="comfortable">
              <v-col cols="12">
                <div class="preview-card">
                  <p class="preview-title">Output</p>
                  <div class="preview-frame checker">
                    <v-img v-if="resultPreviewUrl" :src="resultPreviewUrl" contain class="preview-image" />
                    <div v-else class="preview-empty">
                      Passport-size image preview will appear here.
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>

            <div class="d-flex flex-wrap ga-3 mt-6 action-group">
              <v-btn color="primary" variant="outlined" class="text-none" rounded="xl"
                :disabled="!resultPreviewUrl || isBusy" @click="downloadResult">
                Download PNG
              </v-btn>
              <v-btn color="primary" variant="tonal" class="text-none" rounded="xl"
                :disabled="!resultPreviewUrl || isBusy" @click="downloadJpgResult">
                Download JPG
              </v-btn>
              <v-btn variant="outlined" class="text-none" rounded="xl"
                :disabled="!resultPreviewUrl || isBusy || !canClipboardWrite" @click="copyResultToClipboard">
                Copy Image
              </v-btn>
              <v-btn variant="tonal" rounded="xl" color="red" class="text-none" :disabled="!resultPreviewUrl || isBusy"
                @click="resetResult">
                Clear Output
              </v-btn>
            </div>

            <p v-if="resultMetaLabel" class="result-meta mt-3 mb-0">
              {{ resultMetaLabel }}
            </p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.hero-shell {
  border-bottom: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(15, 143, 124, 0.3);
  color: #0f8f7c;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(2rem, 3.2vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  color: var(--portfolio-ink-soft);
  max-width: 58ch;
  line-height: 1.72;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.panel-kicker {
  color: #0f8f7c !important;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.89rem;
  font-weight: 600;
  opacity: 0.85;
}

.stat-item {
  border: 1px solid var(--portfolio-border-color);
  border-radius: 12px;
  background: var(--portfolio-panel-highlight);
  padding: 12px 10px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--portfolio-ink);
}

.stat-label {
  display: block;
  font-size: 0.73rem;
  color: var(--portfolio-muted);
}

.tool-grid {
  row-gap: 18px;
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
}

.mode-toggle {
  border: 1px solid rgba(15, 143, 124, 0.3);
  border-radius: 14px;
  overflow: hidden;
  width: 100%;
}

.mode-toggle :deep(.v-btn) {
  flex: 1 1 0;
}

.drop-zone {
  border: 1.5px dashed rgba(15, 143, 124, 0.35);
  border-radius: 18px;
  padding: 26px 18px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.drop-zone:hover {
  border-color: rgba(15, 143, 124, 0.6);
  background: rgba(15, 143, 124, 0.08);
  transform: translateY(-2px);
}

.drop-zone-active {
  border-color: var(--portfolio-primary);
  background: rgba(15, 143, 124, 0.12);
}

.tools-unlock-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 143, 124, 0.15);
  border: 1px solid rgba(15, 143, 124, 0.3);
  color: #0f8f7c !important;
  line-height: 1.4;
}

.tools-unlock-icon {
  color: #0f8f7c;
}

.output-controls {
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  padding: 12px;
}

.border-tools {
  border: 1px solid var(--portfolio-border-color);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  padding: 10px 12px;
  margin-bottom: 12px;
}

.border-tools-row {
  row-gap: 10px;
}

.border-slider {
  flex: 1 1 auto;
}

.border-input {
  width: 90px;
  min-width: 90px;
}

.border-thickness-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 143, 124, 0.3);
  background: rgba(15, 143, 124, 0.08);
  font-size: 0.76rem;
  font-weight: 700;
  color: #0f8f7c;
}

.output-controls-row {
  row-gap: 10px;
}

.hex-input {
  max-width: 130px;
}

.color-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid rgba(15, 143, 124, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.color-control input[type="color"] {
  width: 42px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.preset-colors {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-chip {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.preset-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.35);
}

.preset-chip:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

:global(.quick-color-tooltip) {
  background: #0f2320 !important;
  color: #f5fffd !important;
  border: 1px solid rgba(120, 208, 192, 0.35);
  border-radius: 10px;
  padding: 6px 10px !important;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  box-shadow: 0 10px 24px rgba(4, 18, 16, 0.24);
}

.quick-color-tooltip-text {
  color: inherit;
}

.preview-card {
  border: 1px solid var(--portfolio-border-color);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px;
}

.preview-title {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--portfolio-ink-soft);
}

.preview-frame {
  width: min(100%, 360px);
  aspect-ratio: 35 / 45;
  min-height: 0;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--portfolio-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline: auto;
}

.checker {
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%);
  background-size: 24px 24px;
  background-position:
    0 0,
    0 12px,
    12px -12px,
    -12px 0;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.preview-empty {
  padding: 18px;
  color: var(--portfolio-muted);
  font-size: 0.92rem;
  text-align: center;
}

.action-group :deep(.v-btn) {
  min-width: 150px;
}

.result-meta {
  font-size: 0.82rem;
  color: var(--portfolio-muted);
}

@media (max-width: 960px) {
  .hero-title {
    font-size: clamp(1.6rem, 6.2vw, 2.2rem);
  }

  .hero-subtitle {
    max-width: none;
    line-height: 1.6;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .hero-stats-col {
    margin-top: 16px !important;
  }

  .stat-item {
    text-align: left;
    padding: 10px 12px;
  }

  .preview-frame {
    width: min(100%, 320px);
  }

  .tool-shell {
    padding-inline: 20px !important;
    padding-block: 20px !important;
  }
}

@media (max-width: 600px) {
  .hero-chip {
    font-size: 0.67rem;
    padding: 5px 10px;
  }

  .drop-zone {
    padding: 20px 14px;
  }

  .output-controls {
    padding: 10px;
  }

  .output-controls-row {
    align-items: stretch !important;
  }

  .border-tools-row {
    align-items: stretch !important;
  }

  .border-input {
    width: 100%;
    min-width: 0;
  }

  .color-control {
    width: 100%;
    justify-content: space-between;
  }

  .hex-input {
    max-width: none;
    width: 100%;
  }

  .action-group {
    width: 100%;
  }

  .action-group :deep(.v-btn) {
    flex: 1 1 100%;
    min-width: 0;
  }

  .tools-unlock-note {
    align-items: flex-start;
    font-size: 0.92rem;
  }

  .preview-frame {
    width: min(100%, 280px);
  }

  .border-tools {
    padding: 10px;
  }
}

@media (max-width: 380px) {
  .hero-title {
    font-size: 1.45rem;
    line-height: 1.2;
  }

  .hero-subtitle {
    font-size: 0.94rem;
  }
}
</style>
