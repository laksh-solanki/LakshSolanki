# Milestone 3 Analysis: File Lifecycle, Upload UX & Thumbnail Preview Specialist

**Agent**: Explorer 3 (`teamwork_explorer_m3_3`)  
**Mission**: Architectural blueprint and implementation specifications for PDF Upload UX, Client-Side Validation, Backend Integration, In-Tool Thumbnail Preview, and File & Link Management Controls in `PdfQrPage.vue`.  
**Date**: 2026-11-04  

---

## 1. Executive Summary & Problem Boundary

The PDF to QR Code Generator studio tool (`PdfQrPage.vue`) allows users to upload PDF documents, preview their first page as a thumbnail, customize and download scannable QR codes linking to `/v/:id`, and manage document lifecycle (metadata display, link copying, document deletion).

This investigation establishes the complete technical blueprint for **Domain 3: File Lifecycle, Upload UX & Thumbnail Preview**, fulfilling:
- **R1 (PDF Upload, Client-Side Validation & Security)**: Drag-and-drop dropzone matching `PdfImgPage.vue`, 3-tier client validation (MIME, size $\le 10$ MB, magic bytes `%PDF-`), and clear user alerts.
- **R3 (File & Link Management with Retention)**: Metadata display (filename, size, status, expiration badge), working "Copy Public Link" button with visual feedback, and "Delete Document" action with confirmation dialog calling `DELETE /api/pdf/:id` with complete local state teardown.
- **R4 (UI/UX Integration within PdfImageStudio)**: In-tool Page 1 PDF thumbnail canvas rendered using `pdfjs-dist`, responsive progress states, and styling matching the existing portfolio design system (`main.css`).

---

## 2. Upload UX & Dropzone Architecture

### 2.1 Visual Design & Component Hierarchy
The upload dropzone matches the layout and styling conventions of `PdfImgPage.vue` (`.upload-zone`, `.upload-zone-lg`, `.feature-chip`).

```
+-------------------------------------------------------------------------+
| v-card.tool-shell.p-6.p-md-8                                            |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | v-sheet.upload-zone.upload-zone-lg (:class="{ 'drag-over': isDragging }")
|  |                                                                   |  |
|  |   [mdi-cloud-upload-outline (size=80, color=primary)]             |  |
|  |                                                                   |  |
|  |   "Drag and drop PDF file here" (text-h5 font-weight-bold)        |  |
|  |   "or click anywhere in this container to browse"                 |  |
|  |                                                                   |  |
|  |   [ Chip: Instant QR ] [ Chip: 24h Retention ] [ Chip: Max 10 MB ]|  |
|  |                                                                   |  |
|  |   [ v-btn: Choose PDF File (mdi-file-pdf-box, color=primary) ]   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | (When Uploading) progress-shell:                                   |  |
|  |   "Uploading document... 65%"                       65%           |  |
|  |   [==============================>..............]                  |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

### 2.2 Event Handling & Drag-Drop State
To prevent browser default behavior (opening the PDF directly in the browser when dropped outside the dropzone), window-level drag/drop events are suppressed on mount:

```js
// Window-level safety listeners
const onDragOver = (e) => e.preventDefault();
const onDrop = (e) => e.preventDefault();

onMounted(() => {
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("drop", onDrop);
});

onUnmounted(() => {
  window.removeEventListener("dragover", onDragOver);
  window.removeEventListener("drop", onDrop);
});
```

### 2.3 Dropzone Interaction Logic
```js
const isDragging = ref(false);
const fileInput = ref(null);

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleDragEnter = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  e.preventDefault();
  isDragging.value = false;
};

const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    handleIncomingFile(file);
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    handleIncomingFile(file);
  }
};
```

---

## 3. Client-Side Validation Engine

Client validation executes prior to any network request to save bandwidth, provide instantaneous user feedback, and prevent server load.

### 3.1 Three-Tier Validation Specification

| Tier | Check | Condition | Failure Action / Error Message |
|------|-------|-----------|--------------------------------|
| **1. File Presence & Size** | Empty file / No file | `!file` or `file.size === 0` | "The selected file is empty (0 bytes)." |
| **2. Size Boundary** | 10 MB ceiling | `file.size > 10 * 1024 * 1024` (10,485,760 B) | "File size exceeds 10 MB limit (${formatFileSize(file.size)}). Please choose a smaller PDF." |
| **3. MIME & Extension** | Type verification | `file.type !== "application/pdf"` AND not `.pdf` | "Please upload a valid PDF document (.pdf)." |
| **4. Binary Magic Header** | First 5 bytes | Header does not start with `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`) | "The file is corrupted or not a valid PDF document (missing %PDF- header)." |

### 3.2 High-Performance Header Sniffing
Rather than reading the entire 10 MB file into RAM on the client, we use `Blob.prototype.slice(0, 5)` to extract only the first 5 bytes. This completes in $< 1$ ms:

```js
/**
 * Fast client-side PDF verification including binary magic bytes
 * @param {File} file 
 * @returns {Promise<{ valid: boolean, error: string | null }>}
 */
export async function validatePdfFile(file) {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  // 1. Empty file
  if (file.size === 0) {
    return { valid: false, error: "The selected file is empty (0 bytes)." };
  }

  // 2. 10 MB limit check (10,485,760 bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10 MB limit (${formatFileSize(file.size)}).`,
    };
  }

  // 3. MIME and Extension check (supports Windows registry quirks)
  const isPdfMime = file.type === "application/pdf";
  const hasPdfExt = typeof file.name === "string" && file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfMime && !hasPdfExt) {
    return { valid: false, error: "Please upload a valid PDF document (.pdf)." };
  }

  // 4. Binary Magic Bytes Check: First 5 bytes must equal "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
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
  } catch (err) {
    return {
      valid: false,
      error: "Unable to inspect file binary header.",
    };
  }

  return { valid: true, error: null };
}
```

---

## 4. Backend Upload Integration

### 4.1 Interface Contract Mapping
- **Endpoint**: `POST ${getApiBaseUrl()}/api/pdf/upload`
- **Headers**: `multipart/form-data`
- **Payload**: `FormData` containing field `file: File`

### 4.2 XHR-Based Upload with Real-Time Progress Tracking
`fetch()` does not provide cross-browser progress events for upload streams. An `XMLHttpRequest` wrapper guarantees real-time percentage progress updates:

```js
/**
 * Uploads PDF to backend with XHR upload progress monitoring
 * @param {File} file
 * @param {Function} onProgress (percent: number) => void
 * @returns {Promise<UploadResult>}
 */
export function uploadPdfToBackend(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const baseUrl = getApiBaseUrl();
    xhr.open("POST", `${baseUrl}/api/pdf/upload`, true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (_e) {
        data = { detail: xhr.responseText };
      }

      if (xhr.status === 200 && data?.status === "success") {
        onProgress(100);
        resolve({
          id: data.id,
          filename: data.filename || file.name,
          size: data.size || file.size,
          url: data.url,
          expires_at: data.expires_at || data.expiresAt,
        });
      } else if (xhr.status === 413) {
        reject(new Error(data.detail || "File size exceeds 10 MB limit."));
      } else if (xhr.status === 429) {
        const retryAfter = xhr.getResponseHeader("Retry-After") || "60";
        reject(
          new Error(
            `Upload rate limit exceeded (10 uploads/min). Please wait ${retryAfter} seconds.`,
          ),
        );
      } else if (xhr.status === 400) {
        reject(new Error(data.detail || "Invalid PDF format or corrupted file."));
      } else {
        reject(new Error(data.detail || `Server error (${xhr.status}).`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error while uploading file."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload request timed out. Please try again."));
    };
    xhr.timeout = 60000; // 60s timeout

    const formData = new FormData();
    formData.append("file", file, file.name);
    xhr.send(formData);
  });
}
```

---

## 5. In-Tool PDF Page 1 Preview (Thumbnail Engine)

### 5.1 Architecture & Integration with `pdfjs-dist`
To show users immediate confirmation of their uploaded document, the studio renders Page 1 onto an HTML5 canvas inside the studio card.

```
+-------------------------------------------------------------+
| Thumbnail Preview Card                                       |
|                                                             |
|  +-------------------------------------------------------+  |
|  | [Page 1 of 5]                                         |  |
|  |                                                       |  |
|  |                +--------------------+                 |  |
|  |                |                    |                 |  |
|  |                |  Page 1 Rendering  |                 |  |
|  |                |  (Crisp Hi-DPI)    |                 |  |
|  |                |                    |                 |  |
|  |                +--------------------+                 |  |
|  +-------------------------------------------------------+  |
|  annual-report-2026.pdf | 2.4 MB                            |
+-------------------------------------------------------------+
```

### 5.2 Dynamic PDF.js Loader & Web Worker Configuration
Reuses the exact pattern established in `PdfLandingPage.vue` and `PdfImgPage.vue`:

```js
let pdfLibPromise = null;
const loadPdfLib = async () => {
  if (!pdfLibPromise) {
    pdfLibPromise = Promise.all([
      import("pdfjs-dist/build/pdf"),
      import("pdfjs-dist/build/pdf.worker.mjs?url"),
    ]).then(([pdfjsLib, workerModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      return pdfjsLib;
    });
  }
  return pdfLibPromise;
};
```

### 5.3 Page 1 Thumbnail Renderer
```js
/**
 * Renders page 1 of a PDF file onto a target canvas element with Hi-DPI scaling
 * @param {File | ArrayBuffer} source
 * @param {HTMLCanvasElement} canvas
 * @param {number} targetWidthPx - Target display width (e.g. 260px)
 * @returns {Promise<{ numPages: number, width: number, height: number }>}
 */
export async function renderPdfThumbnail(source, canvas, targetWidthPx = 260) {
  if (!canvas) throw new Error("Canvas element is null.");

  const pdfjsLib = await loadPdfLib();
  let data;
  if (source instanceof ArrayBuffer) {
    data = new Uint8Array(source);
  } else if (source instanceof File || source instanceof Blob) {
    const ab = await source.arrayBuffer();
    data = new Uint8Array(ab);
  } else {
    throw new Error("Invalid source for PDF rendering.");
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  const page1 = await pdfDoc.getPage(1);

  // Compute scale based on desired thumbnail width
  const unscaledViewport = page1.getViewport({ scale: 1.0 });
  const scale = targetWidthPx / unscaledViewport.width;
  const viewport = page1.getViewport({ scale });

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);

  // Clear canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page1.render(renderContext).promise;
  ctx.restore();

  return {
    numPages: pdfDoc.numPages,
    width: viewport.width,
    height: viewport.height,
  };
}
```

---

## 6. File & Link Management Controls

### 6.1 Metadata Display Card Specification
When a PDF is uploaded, a metadata block displays key document attributes:

```vue
<div class="metadata-grid d-flex flex-column ga-3">
  <!-- File Name with Truncation -->
  <div class="d-flex align-center justify-space-between">
    <span class="text-caption text-medium-emphasis">Document Name</span>
    <span class="text-body-2 font-weight-bold text-truncate ml-2" :title="uploadedDoc.filename">
      {{ truncateFilename(uploadedDoc.filename, 28) }}
    </span>
  </div>

  <!-- Formatted File Size -->
  <div class="d-flex align-center justify-space-between">
    <span class="text-caption text-medium-emphasis">File Size</span>
    <span class="text-body-2 font-mono font-weight-medium">
      {{ formatFileSize(uploadedDoc.size) }}
    </span>
  </div>

  <!-- Document Status -->
  <div class="d-flex align-center justify-space-between">
    <span class="text-caption text-medium-emphasis">Upload Status</span>
    <v-chip color="success" size="x-small" variant="tonal" class="font-weight-bold">
      <v-icon start size="14">mdi-check-circle</v-icon> Active
    </v-chip>
  </div>

  <!-- QR Scannability Status -->
  <div class="d-flex align-center justify-space-between">
    <span class="text-caption text-medium-emphasis">QR Status</span>
    <v-chip color="primary" size="x-small" variant="tonal" class="font-weight-bold">
      <v-icon start size="14">mdi-check</v-icon> Ready &amp; Scannable
    </v-chip>
  </div>

  <!-- 24-Hour Expiration -->
  <div class="d-flex align-center justify-space-between">
    <span class="text-caption text-medium-emphasis">Retention</span>
    <v-chip color="secondary" size="x-small" variant="outlined" class="font-weight-medium">
      <v-icon start size="14">mdi-timer-outline</v-icon>
      Expires in 24 hours
    </v-chip>
  </div>
</div>
```

### 6.2 Working "Copy Public Link" Button with Visual Feedback
The public link points to `${window.location.origin}/v/${uploadedDoc.id}`.

```js
const isCopied = ref(false);

const publicUrl = computed(() => {
  if (!uploadedDoc.value?.id) return "";
  return `${window.location.origin}/v/${uploadedDoc.value.id}`;
});

const copyPublicLink = async () => {
  if (!publicUrl.value) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(publicUrl.value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = publicUrl.value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    isCopied.value = true;
    showAlert("Public link copied to clipboard!", "success");
    setTimeout(() => {
      isCopied.value = false;
    }, 2500);
  } catch (err) {
    showAlert("Could not copy link to clipboard.", "error");
  }
};
```

**Visual button state**:
```vue
<v-btn
  variant="tonal"
  color="primary"
  rounded="lg"
  :prepend-icon="isCopied ? 'mdi-check' : 'mdi-content-copy'"
  class="text-none font-weight-bold"
  @click="copyPublicLink"
>
  {{ isCopied ? 'Link Copied!' : 'Copy Public Link' }}
</v-btn>
```

### 6.3 Working "Delete Document" Button & Invalidation Flow
Deleting a document immediately calls `DELETE /api/pdf/:id` on the backend and performs complete local state teardown.

#### Step 1: Confirmation Dialog
```vue
<v-dialog v-model="deleteDialogVisible" max-width="480">
  <v-card class="tool-shell p-5" rounded="xl">
    <div class="d-flex align-center ga-3 mb-3">
      <v-avatar color="error" variant="tonal" size="44">
        <v-icon icon="mdi-trash-can-outline" size="24" color="error" />
      </v-avatar>
      <div>
        <h3 class="text-h6 font-weight-bold mb-0">Delete Document?</h3>
        <p class="text-caption text-medium-emphasis mb-0">Permanent action</p>
      </div>
    </div>

    <p class="text-body-2 muted-copy mb-4">
      This will permanently remove <strong>{{ uploadedDoc?.filename }}</strong> from secure storage.
      The public link and any printed QR codes will immediately stop working (returning 404).
    </p>

    <div class="d-flex justify-end ga-2">
      <v-btn
        variant="outlined"
        rounded="lg"
        class="text-none"
        :disabled="isDeleting"
        @click="deleteDialogVisible = false"
      >
        Cancel
      </v-btn>
      <v-btn
        color="error"
        variant="flat"
        rounded="lg"
        class="text-none font-weight-bold"
        :loading="isDeleting"
        @click="executeDelete"
      >
        Delete Document
      </v-btn>
    </div>
  </v-card>
</v-dialog>
```

#### Step 2: Execution & State Invalidation
```js
const isDeleting = ref(false);
const deleteDialogVisible = ref(false);

const executeDelete = async () => {
  if (!uploadedDoc.value?.id) return;

  isDeleting.value = true;
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/pdf/${encodeURIComponent(uploadedDoc.value.id)}`, {
      method: "DELETE",
    });

    if (!res.ok && res.status !== 404) {
      throw new Error(`Deletion failed with HTTP ${res.status}`);
    }

    // Comprehensive State Reset
    uploadedDoc.value = null;
    pdfFile.value = null;
    isUploaded.value = false;
    uploadProgress.value = 0;
    uploadStatusText.value = "";
    numPages.value = 0;

    // Reset hidden file input
    if (fileInput.value) {
      fileInput.value.value = "";
    }

    // Clear thumbnail canvas
    if (thumbnailCanvasRef.value) {
      const ctx = thumbnailCanvasRef.value.getContext("2d");
      ctx.clearRect(0, 0, thumbnailCanvasRef.value.width, thumbnailCanvasRef.value.height);
    }

    // Emit event or clear QR code in parent/peer customizer
    emit("reset-qr");

    deleteDialogVisible.value = false;
    showAlert("Document deleted. Associated QR code and public link have been invalidated.", "success");
  } catch (err) {
    showAlert(err.message || "Failed to delete document.", "error");
  } finally {
    isDeleting.value = false;
  }
};
```

---

## 7. Complete Reactive State Model for `PdfQrPage.vue`

```js
// --- File & Upload Reactive State ---
const pdfFile = ref(null);                     // Selected raw File object
const isDragging = ref(false);                 // Dropzone drag-over flag
const isUploading = ref(false);                // In-progress upload indicator
const isUploaded = ref(false);                 // Document active flag
const uploadProgress = ref(0);                 // 0 to 100 percentage
const uploadStatusText = ref("");              // e.g. "Uploading document... 45%"
const isRenderingThumbnail = ref(false);       // Thumbnail preview rendering flag
const thumbnailError = ref(false);             // Thumbnail fallback flag
const numPages = ref(1);                       // Total pages discovered

// --- Document Metadata & Identifiers ---
const uploadedDoc = ref({
  id: "",
  filename: "",
  size: 0,
  url: "",
  expires_at: "",
});

// --- UI Controls State ---
const isCopied = ref(false);                   // Copy button feedback
const isDeleting = ref(false);                 // Delete action in progress
const deleteDialogVisible = ref(false);        // Confirmation modal
const alertVisible = ref(false);               // Alerts.vue visibility
const alertMessage = ref("");                  // Alerts.vue message
const alertType = ref("success");              // Alerts.vue type ("success" | "error")
```

---

## 8. Verification & Test Suite Traceability Matrix

| Test ID | Test Category | Specification Verified | Component / Function Trace |
|---------|---------------|------------------------|---------------------------|
| **T1-VAL-01** | Happy Path | Accepts `application/pdf` | `validatePdfFile(file)` |
| **T1-VAL-02** | Happy Path | Accepts `.PDF` uppercase | `hasPdfExt` check |
| **T1-VAL-03** | Edge Case | Accepts `application/octet-stream` if `.pdf` | `isPdfMime \|\| hasPdfExt` |
| **T1-VAL-04** | Formatting | Formats B, KB, MB cleanly | `formatFileSize(bytes)` |
| **T1-VAL-05** | Formatting | Truncates long filenames | `truncateFilename(name, 28)` |
| **T2-VAL-01** | Corner Case | Rejects null file | `if (!file)` |
| **T2-VAL-02** | Boundary | Rejects non-PDF (.docx) | MIME & ext check |
| **T2-VAL-03** | Boundary | Rejects $> 10$ MB | `file.size > 10 * 1024 * 1024` |
| **T2-VAL-04** | Boundary | Rejects 0-byte empty file | `file.size === 0` |
| **T2-COR-02** | Security | Rejects file missing `%PDF-` | Magic bytes slice check |
| **T1-UPL-01** | Integration | Sends `POST /api/pdf/upload` | `uploadPdfToBackend(file, onProgress)` |
| **T1-CPY-01** | UI Control | Copies public URL | `copyPublicLink()` |
| **T1-DEL-01** | Lifecycle | `DELETE /api/pdf/:id` | `executeDelete()` + state teardown |
| **T1-THU-01** | Rendering | Page 1 canvas preview | `renderPdfThumbnail(file, canvas)` |

---

## 9. Recommendations for M3 Worker Implementation

1. **Self-Contained Composable (`usePdfUpload.js`) or Inlined Script**:
   Create a clean separation between the upload/validation logic and the visual template to keep `PdfQrPage.vue` manageable and modular.
2. **Icons Verification**:
   All icons required for this domain (`mdi-cloud-upload-outline`, `mdi-file-pdf-box`, `mdi-content-copy`, `mdi-check`, `mdi-check-circle`, `mdi-alert-circle`, `mdi-trash-can-outline`, `mdi-timer-outline`) are already registered in `frontend/src/plugins/icons.js`.
3. **Graceful Error Recovery**:
   When upload fails (e.g. 413, 429, 400), reset the progress bar, clear the loading state, but preserve the user's choice to select a different file immediately.
4. **Immediate Deletion Teardown**:
   Ensure `DELETE /api/pdf/:id` resets `uploadedDoc.value = null` and signals the QR customizer to clear the QR canvas to avoid displaying an invalidated QR code.
