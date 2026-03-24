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
const coursesLoading = ref(false);
const savingCourse = ref(false);
const loading = ref(false);
const dialog = ref(false);
const pdfSection = ref(null);
const showAddCourse = ref(false);

const form = reactive({
  fname: "",
  course: null,
});

const newCourse = reactive({
  name: "",
  category: "",
  level: "Beginner",
  durationHours: "",
});

const BASE_URL = getApiBaseUrl();
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const courseCount = computed(() => courses.value.length);

const normalizeCourseName = (value = "") => value.trim().replace(/\s+/g, " ").toLowerCase();
const sortCourses = (items) => [...items].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));

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
  coursesLoading.value = true;

  try {
    const response = await fetch(`${BASE_URL}/api/courses`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.data ?? [];
    courses.value = sortCourses(items);
    showAddCourse.value = courses.value.length === 0;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    showAlert("Failed to load courses.", "error");
  } finally {
    coursesLoading.value = false;
  }
};

onMounted(() => {
  void fetchCourses();
});

const resetNewCourseForm = () => {
  newCourse.name = "";
  newCourse.category = "";
  newCourse.level = "Beginner";
  newCourse.durationHours = "";
};

const upsertCourse = (course) => {
  const nextCourses = [...courses.value];
  const courseIndex = nextCourses.findIndex((item) => item.id === course.id);

  if (courseIndex >= 0) {
    nextCourses.splice(courseIndex, 1, course);
  } else {
    nextCourses.push(course);
  }

  courses.value = sortCourses(nextCourses);
};

const addCourse = async () => {
  const normalizedName = normalizeCourseName(newCourse.name);
  if (!normalizedName) {
    showAlert("Course name is required.", "error");
    return;
  }

  savingCourse.value = true;

  try {
    const payload = {
      name: newCourse.name.trim(),
      category: newCourse.category.trim() || undefined,
      level: newCourse.level || undefined,
      durationHours: newCourse.durationHours ? Number(newCourse.durationHours) : undefined,
    };

    const response = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => ({}));

    if (response.status === 409) {
      const existingCourse =
        responseBody?.data ||
        courses.value.find((course) => normalizeCourseName(course.name) === normalizedName) ||
        null;

      if (existingCourse) {
        upsertCourse(existingCourse);
        form.course = existingCourse;
      }

      showAddCourse.value = false;
      resetNewCourseForm();
      showAlert("Course already exists. The existing course has been selected.", "success");
      return;
    }

    if (!response.ok) {
      throw new Error(responseBody?.error || "Failed to create course");
    }

    const createdCourse = responseBody?.data;
    if (!createdCourse) {
      throw new Error("Course was created but no course data was returned");
    }

    upsertCourse(createdCourse);
    form.course = createdCourse;
    showAddCourse.value = false;
    resetNewCourseForm();
    showAlert("Course added successfully.", "success");
  } catch (error) {
    console.error("There was a problem while adding the course:", error);
    showAlert(error.message || "Failed to add course.", "error");
  } finally {
    savingCourse.value = false;
  }
};

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
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl"
            class="text-none">
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
          <v-col cols="12" md="4" lg="5" class="hero-stats-col mt-6 mt-md-0">
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
            </div>

            <v-form ref="studentForm" @submit.prevent="previewCertificate">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model.trim="form.fname" :rules="[(v) => !!v || 'Full Name is required']"
                    label="Full Name" placeholder="Enter your full name" name="fname" id="fname" rounded="lg"
                    autocomplete="name" spellcheck="false" prepend-inner-icon="mdi-account" variant="solo-filled" flat
                    class="form-input"></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select v-model="form.course" :items="courses" :rules="[(v) => !!v || 'Course is required']"
                    :label="coursesLoading ? 'Loading courses...' : 'Select Course'" name="course" id="course"
                    rounded="lg" item-title="name" return-object prepend-inner-icon="mdi-school" variant="solo-filled"
                    flat class="form-input"></v-select>
                </v-col>
              </v-row>

              <v-expand-transition>
                <div v-show="showAddCourse" class="add-course-panel mt-2">
                  <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
                    <div>
                      <p class="form-kicker mb-1">Course Collection</p>
                      <h3 class="text-h6 font-weight-bold mb-1">Add a new course</h3>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        This saves the course directly to your MongoDB `courses` collection.
                      </p>
                    </div>
                    <v-chip color="primary" variant="tonal" size="small">MongoDB</v-chip>
                  </div>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="newCourse.name" label="Course Name" placeholder="Enter course name"
                        rounded="lg" prepend-inner-icon="mdi-book-education-outline" variant="solo-filled" flat
                        class="form-input"></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model.trim="newCourse.category" label="Category"
                        placeholder="Software Development" rounded="lg" prepend-inner-icon="mdi-shape-outline"
                        variant="solo-filled" flat class="form-input"></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select v-model="newCourse.level" :items="COURSE_LEVELS" label="Level" rounded="lg"
                        prepend-inner-icon="mdi-ladder" variant="solo-filled" flat class="form-input"></v-select>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model="newCourse.durationHours" label="Duration Hours" placeholder="24"
                        type="number" min="1" rounded="lg" prepend-inner-icon="mdi-timer-outline" variant="solo-filled"
                        flat class="form-input"></v-text-field>
                    </v-col>
                  </v-row>

                  <div class="d-flex align-center flex-wrap ga-3 mt-2">
                    <v-btn color="primary" rounded="xl" class="text-none px-6" prepend-icon="mdi-plus"
                      :loading="savingCourse" @click="addCourse">
                      Save Course
                    </v-btn>

                    <v-btn variant="text" color="primary" class="text-none" :disabled="savingCourse" @click="
                      showAddCourse = false;
                    resetNewCourseForm();
                    ">
                      Cancel
                    </v-btn>
                  </div>
                </div>
              </v-expand-transition>

              <div class="d-flex align-center flex-wrap ga-3 mt-2">
                <v-btn type="submit" :loading="loading" prepend-icon="mdi-eye-outline" color="primary" size="large"
                  rounded="xl" class="text-none px-6">
                  Preview Certificate
                </v-btn>

                <v-btn variant="tonal" :icon="showAddCourse ? 'mdi-minus' : 'mdi-plus'" color="primary"
                  :disabled="coursesLoading" @click="showAddCourse = !showAddCourse">
                </v-btn>
              </div>
            </v-form>
          </v-card>

          <v-alert class="mt-5 rounded-xl note-alert" color="primary" variant="tonal" border="start"
            icon="mdi-information-outline">
            Verify your name and selected course before generating. The premium certificate downloads as a PDF and can
            be shared directly.
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

    <PhotoZoomDialog v-model="dialog" content-mode="custom" hide-trigger dialog-title="Premium Certificate Preview"
      :max-width="1280" :content-width="A4_WIDTH_PX" :content-height="A4_HEIGHT_PX">
      <template #toolbar-actions>
        <v-btn @click="generatePdf" prepend-icon="mdi-download" :loading="loading" variant="flat" color="primary"
          rounded="lg" class="text-none px-4">
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

.add-course-panel {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background:
    radial-gradient(circle at 100% 0%, rgba(255, 199, 120, 0.12), transparent 32%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.96), rgba(240, 249, 245, 0.98));
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
  .hero-stats-col {
    display: none !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

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
