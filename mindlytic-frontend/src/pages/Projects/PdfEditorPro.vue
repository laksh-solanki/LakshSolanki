<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Alerts from "@/components/Alerts.vue";
import { usePdfEditorSession } from "@/composables/pdfEditorSession";

const router = useRouter();
const { selectedPdfFile } = usePdfEditorSession();

const viewerHost = ref(null);
const viewerInstance = ref(null);

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const busy = ref(false);
const busyLabel = ref("");
const viewerReady = ref(false);
const currentFileName = ref("");
const activeToolbar = ref("edit");

const searchText = ref("");
const replaceText = ref("");

const hasDocument = computed(() => Boolean(currentFileName.value));
const hasUploadedSession = computed(() => Boolean(selectedPdfFile.value));
const licenseStatus = computed(() => (import.meta.env.VITE_APRYSE_LICENSE_KEY ? "Licensed" : "Trial"));

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => window.history.back();
const goToUpload = () => router.push({ name: "PdfEditorUpload" });

const getToolbarMap = (UI) => ({
  view: UI.ToolbarGroup?.VIEW || "toolbarGroup-View",
  annotate: UI.ToolbarGroup?.ANNOTATE || "toolbarGroup-Annotate",
  edit: UI.ToolbarGroup?.EDIT_TEXT || "toolbarGroup-EditText",
  redact: UI.ToolbarGroup?.REDACT || "toolbarGroup-Redact",
  insert: UI.ToolbarGroup?.INSERT || "toolbarGroup-Insert",
});

const setToolbar = (mode) => {
  const instance = viewerInstance.value;
  if (!instance) return;

  const map = getToolbarMap(instance.UI);
  const target = map[mode] || map.view;

  try {
    instance.UI.setToolbarGroup(target);
    activeToolbar.value = mode;
  } catch (error) {
    console.error("toolbar switch failed", error);
    showAlert("Unable to switch toolbar mode.", "error");
  }
};

const enablePremiumFeatures = () => {
  const instance = viewerInstance.value;
  if (!instance) return;

  const features = [];
  if (instance.UI.Feature?.ContentEdit) features.push(instance.UI.Feature.ContentEdit);
  if (instance.UI.Feature?.Redaction) features.push(instance.UI.Feature.Redaction);

  if (!features.length) return;

  try {
    instance.UI.enableFeatures(features);
  } catch (error) {
    console.error("feature toggle failed", error);
    showAlert("Unable to enable premium tools.", "error");
  }
};

const loadPdfFile = async (file) => {
  const instance = viewerInstance.value;
  if (!instance) {
    showAlert("Viewer is still loading.", "error");
    return;
  }

  if (!file || (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) {
    showAlert("Invalid PDF file in session. Upload again.", "error");
    return;
  }

  busy.value = true;
  busyLabel.value = "Loading uploaded PDF...";

  try {
    await instance.UI.loadDocument(file, { filename: file.name });
    currentFileName.value = file.name;
    setToolbar("edit");
    showAlert("PDF loaded from upload page. You can now edit existing content.");
  } catch (error) {
    console.error("load failed", error);
    showAlert("Could not load PDF from upload session.", "error");
  } finally {
    busy.value = false;
    busyLabel.value = "";
  }
};

const replaceAllMatches = async () => {
  const instance = viewerInstance.value;
  if (!instance || !hasDocument.value) {
    showAlert("Load a PDF before running replace.", "error");
    return;
  }

  const searchTerm = searchText.value.trim();
  if (!searchTerm) {
    showAlert("Enter text to find.", "error");
    return;
  }

  busy.value = true;
  busyLabel.value = "Replacing text...";

  try {
    const docViewer = instance.Core.documentViewer;

    if (typeof docViewer.search !== "function" || typeof docViewer.replace !== "function") {
      showAlert("Replace API unavailable in current mode.", "error");
      return;
    }

    const stream = docViewer.search(searchTerm, {
      caseSensitive: false,
      wholeWord: false,
      wildcard: false,
      regex: false,
    });

    const results = await stream.getAll();

    if (!results.length) {
      showAlert("No matching text found.", "error");
      return;
    }

    await docViewer.replace(results, replaceText.value || "");
    showAlert(`Replaced ${results.length} match(es).`);
  } catch (error) {
    console.error("replace failed", error);
    showAlert("Text replace failed for this document.", "error");
  } finally {
    busy.value = false;
    busyLabel.value = "";
  }
};

const downloadEditedPdf = async () => {
  const instance = viewerInstance.value;
  if (!instance || !hasDocument.value) {
    showAlert("Load a PDF before downloading.", "error");
    return;
  }

  busy.value = true;
  busyLabel.value = "Preparing download...";

  try {
    const filenameBase = currentFileName.value.replace(/\.pdf$/i, "") || "document";

    if (typeof instance.UI.downloadPdf === "function") {
      await instance.UI.downloadPdf({ filename: `${filenameBase}-edited.pdf` });
      showAlert("Edited PDF downloaded.");
      return;
    }

    const doc = instance.Core.documentViewer.getDocument();
    const xfdf = await instance.Core.annotationManager.exportAnnotations();
    const data = await doc.getFileData({ xfdfString: xfdf });
    const blob = new Blob([new Uint8Array(data)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenameBase}-edited.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAlert("Edited PDF downloaded.");
  } catch (error) {
    console.error("download failed", error);
    showAlert("Download failed.", "error");
  } finally {
    busy.value = false;
    busyLabel.value = "";
  }
};

onMounted(async () => {
  if (!viewerHost.value) return;

  busy.value = true;
  busyLabel.value = "Initializing editor...";

  try {
    const WebViewer = (await import("@pdftron/webviewer")).default;

    const instance = await WebViewer(
      {
        path: "/lib/webviewer",
        fullAPI: true,
        enableFilePicker: false,
        licenseKey: import.meta.env.VITE_APRYSE_LICENSE_KEY || undefined,
      },
      viewerHost.value,
    );

    viewerInstance.value = instance;
    instance.UI.setTheme("light");
    instance.UI.disableElements(["menuButton"]);

    const documentViewer = instance.Core.documentViewer;
    documentViewer.addEventListener("documentLoaded", () => {
      viewerReady.value = true;
    });

    enablePremiumFeatures();
    setToolbar("edit");

    if (!import.meta.env.VITE_APRYSE_LICENSE_KEY) {
      showAlert("Running in Apryse trial mode. Add VITE_APRYSE_LICENSE_KEY for production.", "error");
    }

    if (selectedPdfFile.value) {
      await loadPdfFile(selectedPdfFile.value);
    } else {
      showAlert("No uploaded PDF found. Please upload from step 1.", "error");
    }
  } catch (error) {
    console.error("viewer init failed", error);
    showAlert("Failed to initialize Apryse WebViewer.", "error");
  } finally {
    busy.value = false;
    busyLabel.value = "";
  }
});
</script>

<template>
  <div class="pro-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl"
            class="text-none">
            Back
          </v-btn>
          <div class="hero-chip">Step 2 of 2</div>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" lg="7" class="pr-md-8">
            <h1 class="hero-title mb-3">PDF Editor Pro | Edit</h1>
            <p class="hero-subtitle mb-0">
              This page is dedicated to editing the uploaded PDF content: text, images, logos, and vector elements.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="5" class="mt-6 mt-md-0">
            <div class="hero-stats">
              <div class="stat-item"><span class="stat-value">{{ viewerReady ? "Ready" : "Loading" }}</span><span
                  class="stat-label">Editor</span></div>
              <div class="stat-item"><span class="stat-value">ON</span><span class="stat-label">Premium Tools</span>
              </div>
              <div class="stat-item"><span class="stat-value">{{ licenseStatus }}</span><span
                  class="stat-label">License</span></div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container fluid>
      <v-row class="ga-0" align="start">
        <v-col cols="12">
          <v-card class="tool-shell pa-5 pa-md-7 mb-6" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
              <div>
                <p class="panel-kicker mb-1">Editing Workspace</p>
                <h2 class="text-h5 font-weight-bold mb-1">True content editor</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">Upload happens on previous page. Edit happens here.</p>
              </div>
              <v-icon icon="mdi-file-document-edit-outline" color="primary" size="34"></v-icon>
            </div>

            <div class="d-flex align-center ga-2 flex-wrap mb-4">
              <v-chip v-if="hasDocument" color="primary" variant="tonal" size="small">{{ currentFileName }}</v-chip>
              <v-btn color="primary" variant="tonal" rounded="lg" class="text-none" prepend-icon="mdi-upload"
                @click="goToUpload">
                Change File
              </v-btn>
              <template v-if="hasDocument">
                <div class="toolbar-row">
                  <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-download"
                    @click="downloadEditedPdf">Download</v-btn>
                </div>
              </template>
            </div>

            <div v-if="busy" class="progress-shell mb-4">
              <div class="text-body-2">{{ busyLabel }}</div>
              <v-progress-linear indeterminate color="primary" rounded height="8"></v-progress-linear>
            </div>

            <div class="viewer-shell">
              <div ref="viewerHost" class="webviewer"></div>
            </div>

            <div v-if="!hasUploadedSession" class="missing-file mt-4">
              <p class="mb-2">No uploaded PDF found for this edit page.</p>
              <v-btn color="primary" variant="flat" rounded="lg" class="text-none" @click="goToUpload">Go To Upload
                Page</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.pro-page {
  background:
    radial-gradient(circle at 7% 2%, rgba(61, 124, 234, 0.2), transparent 32%),
    radial-gradient(circle at 94% 8%, rgba(222, 171, 76, 0.22), transparent 34%),
    linear-gradient(180deg, #f7f9ff 0%, #eef6f2 100%);
}

.hero-shell {
  border-bottom: 1px solid rgba(24, 44, 88, 0.16);
  background: linear-gradient(145deg, rgba(248, 251, 255, 0.98), rgba(235, 243, 255, 0.96));
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 13px;
  border: 1px solid rgba(191, 139, 40, 0.35);
  color: #8d5f12;
  background: rgba(255, 234, 193, 0.72);
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-weight: 800;
}

.hero-title {
  font-size: clamp(2rem, 3.4vw, 3rem);
  color: #142447;
}

.hero-subtitle {
  color: #4b5e82;
  line-height: 1.7;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid rgba(41, 65, 120, 0.18);
  border-radius: 12px;
  padding: 12px 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
}

.stat-value {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  color: #182d5e;
}

.stat-label {
  display: block;
  font-size: 0.72rem;
  color: #65789c;
}

.tool-shell {
  border: 1px solid rgba(31, 61, 119, 0.16);
  background: linear-gradient(168deg, #ffffff 0%, #f6f9ff 100%);
  box-shadow: 0 18px 36px rgba(15, 33, 78, 0.08);
}

.panel-kicker {
  color: #274984;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.71rem;
  font-weight: 700;
}

.toolbar-row,
.replace-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.replace-row {
  grid-template-columns: 1fr 1fr auto;
}

.progress-shell {
  border: 1px solid rgba(39, 73, 132, 0.18);
  border-radius: 12px;
  background: #f9fbff;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.viewer-shell {
  border: 1px solid rgba(39, 73, 132, 0.2);
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  min-height: auto !important;
}

.webviewer {
  width: 100%;
  overflow: hidden;
  height: 90vh;
}

.missing-file {
  border: 1px solid rgba(217, 76, 76, 0.24);
  border-radius: 12px;
  padding: 12px;
  background: rgba(217, 76, 76, 0.08);
  color: #7c2a2a;
}

@media (max-width: 1100px) {
  .toolbar-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .replace-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .viewer-shell,
  .webviewer {
    min-height: 62vh;
    height: 62vh;
  }
}
</style>
