<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Alerts from "@/components/Alerts.vue";
import { usePdfEditorSession } from "@/composables/pdfEditorSession";

const router = useRouter();
const { setPdfForEditing } = usePdfEditorSession();

const fileInput = ref(null);
const isDragging = ref(false);

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const selectedName = ref("");
const selectedSize = ref("");
const loading = ref(false);

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => window.history.back();
const triggerFileInput = () => fileInput.value?.click();

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const steps = ["Bytes", "KB", "MB", "GB"];
  const step = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), steps.length - 1);
  return `${(bytes / 1024 ** step).toFixed(step === 0 ? 0 : 2)} ${steps[step]}`;
};

const openEditorWithFile = async (file) => {
  if (!file || (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) {
    showAlert("Please select a valid PDF file.", "error");
    return;
  }

  loading.value = true;
  selectedName.value = file.name;
  selectedSize.value = formatFileSize(file.size);

  setPdfForEditing(file);
  showAlert("PDF uploaded. Opening editor page...");

  await router.push({ name: "PdfEditorPro" });
  loading.value = false;
};

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0];
  await openEditorWithFile(file);
  event.target.value = "";
};

const handleDrop = async (event) => {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  await openEditorWithFile(file);
};
</script>

<template>
  <div class="upload-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl" class="text-none">
            Back
          </v-btn>
          <div class="hero-chip">Step 1 of 2</div>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" lg="7" class="pr-md-8">
            <h1 class="hero-title mb-3">PDF Editor Pro Upload</h1>
            <p class="hero-subtitle mb-0">
              Upload your PDF on this page, then move to a separate page for full object-level editing.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="5" class="mt-6 mt-md-0">
            <div class="hero-stats">
              <div class="stat-item"><span class="stat-value">Upload</span><span class="stat-label">Current Step</span></div>
              <div class="stat-item"><span class="stat-value">Edit</span><span class="stat-label">Next Step</span></div>
              <div class="stat-item"><span class="stat-value">Apryse</span><span class="stat-label">Engine</span></div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row class="ga-0" align="start">
        <v-col cols="12">
          <v-card class="tool-shell pa-5 pa-md-7" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
              <div>
                <p class="panel-kicker mb-1">Upload PDF</p>
                <h2 class="text-h5 font-weight-bold mb-1">Select file for editing</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">Only PDF files are accepted.</p>
              </div>
              <v-icon icon="mdi-file-upload-outline" color="primary" size="34"></v-icon>
            </div>

            <input ref="fileInput" type="file" accept="application/pdf" class="d-none" @change="handleFileSelect" />

            <v-sheet
              :class="['upload-zone', { 'drag-over': isDragging }]"
              rounded="xl"
              border
              @click="triggerFileInput"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent
              @dragleave.prevent="isDragging = false"
              @drop="handleDrop"
            >
              <div class="d-flex flex-column align-center ga-3 justify-center text-center">
                <v-icon size="72" color="primary">mdi-cloud-upload-outline</v-icon>
                <div class="text-h6 font-weight-bold">Drag and drop PDF file</div>
                <div class="text-body-1 text-medium-emphasis">or click to browse from your device</div>
              </div>
            </v-sheet>

            <div v-if="selectedName" class="selected-file mt-4">
              <v-icon icon="mdi-file-document-outline" size="17" class="mr-2"></v-icon>
              <span class="font-weight-medium">{{ selectedName }}</span>
              <span class="text-caption ml-2">({{ selectedSize }})</span>
            </div>

            <div v-if="loading" class="progress-shell mt-5">
              <div class="text-body-2">Opening editor page...</div>
              <v-progress-linear indeterminate color="primary" rounded height="8"></v-progress-linear>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.upload-page {
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
  border: 1px solid rgba(39, 73, 132, 0.3);
  color: #274984;
  background: rgba(197, 217, 252, 0.6);
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-weight: 800;
}

.hero-title { font-size: clamp(2rem, 3.4vw, 3rem); color: #142447; }
.hero-subtitle { color: #4b5e82; line-height: 1.7; }

.hero-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.stat-item { border: 1px solid rgba(41, 65, 120, 0.18); border-radius: 12px; padding: 12px 10px; text-align: center; background: rgba(255, 255, 255, 0.8); }
.stat-value { display: block; font-size: 0.95rem; font-weight: 800; color: #182d5e; }
.stat-label { display: block; font-size: 0.72rem; color: #65789c; }

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

.upload-zone {
  border: 2px dashed rgba(39, 73, 132, 0.46) !important;
  background: linear-gradient(140deg, rgba(52, 95, 180, 0.06), rgba(198, 226, 255, 0.22));
  padding: 44px 20px;
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.upload-zone:hover {
  transform: translateY(-2px);
  border-color: rgba(29, 61, 129, 0.7) !important;
}

.upload-zone.drag-over {
  border-style: solid !important;
  border-color: rgba(29, 61, 129, 0.95) !important;
}

.selected-file {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(39, 73, 132, 0.24);
  border-radius: 999px;
  background: rgba(39, 73, 132, 0.08);
  color: #19386f;
  padding: 8px 12px;
  font-size: 0.84rem;
}

.progress-shell {
  border: 1px solid rgba(39, 73, 132, 0.18);
  border-radius: 12px;
  background: #f9fbff;
  padding: 12px;
  display: grid;
  gap: 8px;
}

@media (max-width: 960px) {
  .hero-stats { grid-template-columns: 1fr; }
}
</style>
