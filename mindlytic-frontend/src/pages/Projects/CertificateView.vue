<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import Certificate from "@/components/certificate.vue";
import Alerts from "@/components/Alerts.vue";
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";

const studentForm = ref(null);
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const courses = ref([]);
const loading = ref(false);
const dialog = ref(false);
const pdfSection = ref(null);

const form = reactive({
  fname: "",
  course: "",
});

const BASE_URL = getApiBaseUrl();
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const courseCount = computed(() => courses.value.length);

let html2CanvasPromise;
let jsPdfCtorPromise;

const loadCertificatePdfTools = async () => {
  if (!html2CanvasPromise) {
    html2CanvasPromise = import("html2canvas").then((module) => module.default);
  }

  if (!jsPdfCtorPromise) {
    jsPdfCtorPromise = import("jspdf").then((module) => module.jsPDF);
  }

  return Promise.all([html2CanvasPromise, jsPdfCtorPromise]);
};

const sanitizeFileName = (name) => (name || "certificate").replace(/[\\/:*?"<>|]+/g, "-").trim() || "certificate";

const goBack = () => {
  window.history.back();
};

const showAlert = (message, type) => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const fetchCourses = async () => {
  try {
    const response = await fetch(`${BASE_URL}/project/certificate-gen`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    courses.value = await response.json();
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    showAlert("Failed to load courses.", "error");
  }
};

onMounted(() => {
  fetchCourses();
});

const previewCertificate = async () => {
  const { valid } = await studentForm.value.validate();
  if (!valid) {
    showAlert("Please fill in all required fields.", "error");
    return;
  }

  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    dialog.value = true;
  }, 800);
};

const generatePdf = async () => {
  loading.value = true;

  try {
    if (!pdfSection.value) {
      showAlert("Preview is not ready yet.", "error");
      return;
    }

    const [html2canvas, JsPdf] = await loadCertificatePdfTools();
    const canvas = await html2canvas(pdfSection.value, {
      scale: 3,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: "#ffffff",
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      logging: false,
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new JsPdf({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    pdf.save(`${sanitizeFileName(form.course?.name)}.pdf`);

    showAlert("Certificate downloaded successfully!", "success");
  } catch (err) {
    console.error(err);
    showAlert("Failed to generate certificate.", "error");
  } finally {
    loading.value = false;
    dialog.value = false;
  }
};
</script>

<template>
  <div class="certificate-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn
            @click="goBack"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-arrow-left"
            rounded="xl"
            class="text-none"
          >
            Back
          </v-btn>
          <div class="hero-chip">Certificate Tool</div>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" lg="7" class="pr-md-8">
            <h1 class="hero-title mb-3">Premium Certificate Generator</h1>
            <p class="hero-subtitle mb-0">
              Enter your details, preview a custom premium certificate, and download a polished PDF in one flow.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="5" class="mt-6 mt-md-0">
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">{{ courseCount }}</span>
                <span class="stat-label">Available Courses</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">PDF</span>
                <span class="stat-label">Output Format</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">1 min</span>
                <span class="stat-label">Average Time</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row class="ga-0" align="start">
        <v-col cols="12" lg="8" class="pr-lg-6 mb-8 mb-lg-0">
          <v-card class="form-shell pa-5 pa-md-7" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
              <div>
                <p class="form-kicker mb-1">Fill Certificate Details</p>
                <h2 class="text-h5 font-weight-bold mb-1">Generate your premium certificate</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">Use your full name and select the correct course.</p>
              </div>
              <v-icon icon="mdi-file-certificate-outline" color="primary" size="34"></v-icon>
            </div>

            <v-form ref="studentForm" @submit.prevent="previewCertificate">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.trim="form.fname"
                    :rules="[(v) => !!v || 'Full Name is required']"
                    label="Full Name"
                    placeholder="Enter your full name"
                    name="fname"
                    id="fname"
                    rounded="lg"
                    autocomplete="name"
                    spellcheck="false"
                    prepend-inner-icon="mdi-account"
                    variant="solo-filled"
                    flat
                    class="form-input"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.course"
                    :items="courses"
                    :rules="[(v) => !!v || 'Course is required']"
                    label="Select Course"
                    name="course"
                    id="course"
                    rounded="lg"
                    item-title="name"
                    return-object
                    prepend-inner-icon="mdi-school"
                    variant="solo-filled"
                    flat
                    class="form-input"
                  ></v-select>
                </v-col>
              </v-row>

              <div class="d-flex align-center flex-wrap ga-3 mt-2">
                <v-btn
                  type="submit"
                  :loading="loading"
                  prepend-icon="mdi-eye-outline"
                  color="primary"
                  size="large"
                  rounded="xl"
                  class="text-none px-6"
                >
                  Preview Certificate
                </v-btn>

                <p class="mb-0 text-body-2 text-medium-emphasis">Preview first, then download from the zoom dialog.</p>
              </div>
            </v-form>
          </v-card>

          <v-alert
            class="mt-5 rounded-xl note-alert"
            color="primary"
            variant="tonal"
            border="start"
            icon="mdi-information-outline"
          >
            Verify your name and selected course before generating. The premium certificate downloads as a PDF and can be shared directly.
          </v-alert>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="side-panel pa-5" rounded="xl" elevation="0">
            <p class="form-kicker mb-1">Quick Guide</p>
            <h3 class="text-h6 font-weight-bold mb-3">3-step process</h3>

            <div class="step-list">
              <article class="step-item">
                <span class="step-index">01</span>
                <div>
                  <p class="step-title mb-1">Enter full name</p>
                  <p class="step-copy mb-0">Use the exact name you want to appear on the certificate.</p>
                </div>
              </article>

              <article class="step-item">
                <span class="step-index">02</span>
                <div>
                  <p class="step-title mb-1">Choose course</p>
                  <p class="step-copy mb-0">Select the completed course from the available list.</p>
                </div>
              </article>

              <article class="step-item">
                <span class="step-index">03</span>
                <div>
                  <p class="step-title mb-1">Preview and download</p>
                  <p class="step-copy mb-0">Check all details in the zoom preview, then download the final PDF.</p>
                </div>
              </article>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <PhotoZoomDialog
      v-model="dialog"
      content-mode="custom"
      hide-trigger
      dialog-title="Premium Certificate Preview"
      :max-width="1280"
      :content-width="A4_WIDTH_PX"
      :content-height="A4_HEIGHT_PX"
    >
      <template #toolbar-actions>
        <v-btn
          @click="generatePdf"
          prepend-icon="mdi-download"
          :loading="loading"
          variant="flat"
          color="primary"
          rounded="lg"
          class="text-none px-4"
        >
          Download PDF
        </v-btn>
      </template>

      <div class="certificate-sheet certificate-sheet--preview">
        <Certificate :form="form" />
      </div>
    </PhotoZoomDialog>

    <div class="certificate-export-root" aria-hidden="true">
      <div ref="pdfSection" class="certificate-sheet certificate-sheet--export">
        <Certificate :form="form" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.certificate-page {
  position: relative;
  background:
    radial-gradient(circle at 10% 0%, rgba(96, 219, 198, 0.18), transparent 28%),
    radial-gradient(circle at 96% 15%, rgba(255, 199, 120, 0.2), transparent 30%);
}

.hero-shell {
  border-bottom: 1px solid rgba(19, 111, 99, 0.12);
  background: linear-gradient(152deg, rgba(246, 252, 250, 0.98), rgba(236, 246, 241, 0.92));
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.22);
  color: #136f63;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(2rem, 3.3vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  color: #4d5d59;
  max-width: 54ch;
  line-height: 1.7;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid rgba(19, 111, 99, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px 10px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: #10312b;
}

.stat-label {
  display: block;
  font-size: 0.73rem;
  color: #5f716d;
}

.form-shell {
  border: 1px solid rgba(19, 111, 99, 0.17);
  background: linear-gradient(160deg, #ffffff 0%, #f5fbf8 100%);
  box-shadow: 0 16px 30px rgba(11, 39, 34, 0.08);
}

.form-kicker {
  color: #157568;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  font-weight: 700;
}

.form-input :deep(.v-field) {
  border-radius: 12px;
  border: 1px solid rgba(19, 111, 99, 0.12);
  background: #f8fcfa;
}

.note-alert {
  border: 1px solid rgba(19, 111, 99, 0.14);
}

.side-panel {
  border: 1px solid rgba(19, 111, 99, 0.17);
  background:
    radial-gradient(circle at 90% 12%, rgba(255, 201, 131, 0.2), transparent 34%),
    linear-gradient(160deg, #ffffff 0%, #f4faf7 100%);
  box-shadow: 0 16px 30px rgba(11, 39, 34, 0.08);
}

.step-list {
  display: grid;
  gap: 12px;
}

.step-item {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: rgba(255, 255, 255, 0.84);
}

.step-index {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 0.76rem;
  font-weight: 800;
  color: #157568;
  background: rgba(21, 117, 104, 0.12);
}

.step-title {
  font-weight: 700;
  color: #12352f;
}

.step-copy {
  color: #556865;
  font-size: 0.89rem;
  line-height: 1.5;
}

.certificate-sheet {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  background: #fff;
}

.certificate-sheet--preview {
  width: 794px;
  height: 1123px;
  flex: 0 0 auto;
}

.certificate-sheet--export {
  width: 794px;
  height: 1123px;
}

.certificate-export-root {
  position: fixed;
  left: -99999px;
  top: 0;
  pointer-events: none;
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .step-item {
    grid-template-columns: 36px 1fr;
    gap: 10px;
    padding: 10px;
  }

  .step-index {
    width: 36px;
    height: 36px;
  }
}
</style>
