<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import Certificate from "@/components/Certificate.vue";
import Alerts from "@/components/Alerts.vue";
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import { getMediaUrl } from "@/utils/mediaUrl";

const studentForm = ref(null);
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const courses = ref([]);
const coursesLoading = ref(false);
const savingCourse = ref(false);
const loading = ref(false);

// Two separate dialog states
const styleDialog = ref(false);
const certificateDialog = ref(false);

const pdfSection = ref(null);
const showAddCourse = ref(false);

const form = reactive({
  fname: "",
  course: null,
  template: "achievement",
  coursesCount: 7,
  learningHours: 33,
});

const TEMPLATE_OPTIONS = [
  {
    id: "achievement",
    title: "Certificate of Achievement",
    description: "Classic gold-accented landscape certificate with seal, ornate vintage border, and cursive script calligraphy.",
    badge: "Landscape",
    orientation: "landscape",
    thumbnail: getMediaUrl("Picture/thumb_achievement.png"),
  },
  {
    id: "completion",
    title: "L&T EduTech & SPU",
    description: "Official landscape certificate with university seal, LearnKonnect header & blue dynamic wave ribbon.",
    badge: "Landscape",
    orientation: "landscape",
    thumbnail: getMediaUrl("Picture/thumb_completion.png"),
  },
  {
    id: "pathway",
    title: "Course Pathway",
    description: "Classic portrait certificate with textured parchment border, SPU & L&T EduTech logos and signatures.",
    badge: "Portrait",
    orientation: "portrait",
    thumbnail: getMediaUrl("Picture/IMCA.jpeg"),
  },
  {
    id: "premium",
    title: "Mindlytic Premium",
    description: "Executive portrait credential with luxury metallic seal, track area breakdown, and verification code.",
    badge: "Portrait",
    orientation: "portrait",
    thumbnail: getMediaUrl("Picture/thumb_premium.png"),
  },
];

const isLandscape = computed(() => form.template === "completion" || form.template === "achievement");
const activeWidth = computed(() => (isLandscape.value ? 1123 : 794));
const activeHeight = computed(() => (isLandscape.value ? 794 : 1123));

const activeTemplateTitle = computed(() => {
  const match = TEMPLATE_OPTIONS.find((t) => t.id === form.template);
  return match ? `${match.title}` : "Certificate Preview";
});

const onCourseSelected = (selectedCourse) => {
  if (selectedCourse?.durationHours && Number(selectedCourse.durationHours) > 0) {
    form.learningHours = Number(selectedCourse.durationHours);
  }
};

const newCourse = reactive({
  name: "",
  category: "",
  level: "Beginner",
  durationHours: "",
});

const BASE_URL = getApiBaseUrl();
const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"];

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

// Form submit opens the Style Dialog first
const onFormSubmit = async () => {
  const { valid } = await studentForm.value.validate();
  if (!valid) {
    showAlert("Please enter your name and select a course.", "error");
    return;
  }

  styleDialog.value = true;
};

// Selecting a style opens the Certificate Preview Dialog
const selectStyleAndPreview = (templateId) => {
  form.template = templateId;
  styleDialog.value = false;

  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    certificateDialog.value = true;
  }, 250);
};

// Switch back to the style dialog from the certificate preview
const openStyleDialogFromPreview = () => {
  certificateDialog.value = false;
  setTimeout(() => {
    styleDialog.value = true;
  }, 150);
};

const generatePdf = async () => {
  loading.value = true;

  try {
    if (!pdfSection.value) {
      showAlert("Preview is not ready yet.", "error");
      return;
    }

    const isLand = isLandscape.value;
    const targetWidth = isLand ? 1123 : 794;
    const targetHeight = isLand ? 794 : 1123;

    const [html2canvas, JsPdf] = await loadCertificatePdfTools();
    const canvas = await html2canvas(pdfSection.value, {
      scale: 3,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: "#ffffff",
      width: targetWidth,
      height: targetHeight,
      windowWidth: targetWidth,
      windowHeight: targetHeight,
      logging: false,
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new JsPdf({
      unit: "mm",
      format: "a4",
      orientation: isLand ? "landscape" : "portrait",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

    const courseTitle = form.course?.name || "Certificate";
    const downloadName = form.fname
      ? `${sanitizeFileName(form.fname)}_${sanitizeFileName(courseTitle)}.pdf`
      : `${sanitizeFileName(courseTitle)}.pdf`;
    pdf.save(downloadName);

    showAlert("Certificate downloaded successfully!", "success");
  } catch (err) {
    console.error(err);
    showAlert("Failed to generate certificate.", "error");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="certificate-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-row class="ga-0" align="start">
      <v-col cols="12" lg="8" class="pr-lg-6 mb-8 mb-lg-0">
        <v-card class="form-shell p-8" rounded="xl" elevation="0">
          <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
            <div>
              <p class="form-kicker mb-1">Fill Certificate Details</p>
              <h2 class="text-headline-large font-weight-bold mb-1">Generate your certificate</h2>
            </div>
          </div>

          <v-form ref="studentForm" @submit.prevent="onFormSubmit">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="form.fname" :rules="[(v) => !!v || 'Full Name is required *']"
                  label="Full Name" name="fname" id="fname" rounded="lg" autocomplete="name" spellcheck="false"
                  prepend-inner-icon="mdi-account" variant="outlined" messages="Full Name is required*"
                  class="form-input"></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="form.course" :items="courses" :rules="[(v) => !!v || 'Course is required *']"
                  :label="coursesLoading ? 'Loading courses...' : 'Select Course'" name="course" id="course"
                  rounded="lg" item-title="name" return-object prepend-inner-icon="mdi-school" variant="outlined" flat
                  class="form-input" @update:model-value="onCourseSelected" messages="Course is required*"></v-select>
              </v-col>
            </v-row>

            <v-expand-transition>
              <div v-show="showAddCourse" class="add-course-panel mt-2 mb-4">
                <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
                  <div>
                    <h3 class="text-h6 font-weight-bold my-1">Add a new course</h3>
                  </div>
                </div>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="newCourse.name" label="Course Name" placeholder="Enter course name"
                      rounded="lg" prepend-inner-icon="mdi-book-education-outline" variant="solo-filled" flat
                      class="form-input" hide-details></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field v-model.trim="newCourse.category" label="Category" placeholder="Software Development"
                      rounded="lg" prepend-inner-icon="mdi-shape-outline" variant="solo-filled" flat class="form-input"
                      hide-details></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-select v-model="newCourse.level" :items="COURSE_LEVELS" label="Level" rounded="lg"
                      prepend-inner-icon="mdi-ladder" variant="solo-filled" flat class="form-input"
                      hide-details></v-select>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field v-model="newCourse.durationHours" label="Duration Hours" placeholder="24"
                      type="number" min="1" rounded="lg" prepend-inner-icon="mdi-timer-outline" variant="solo-filled"
                      flat class="form-input mb-2" hide-details></v-text-field>
                  </v-col>
                </v-row>

                <div class="d-flex align-center flex-wrap ga-3 mt-2">
                  <v-btn color="primary" rounded="xl" class="text-none px-6" prepend-icon="mdi-plus"
                    :loading="savingCourse" @click="addCourse">
                    Save Course
                  </v-btn>
                </div>
              </div>
            </v-expand-transition>

            <div class="d-flex align-center flex-wrap ga-3 mt-4">
              <v-btn type="submit" :loading="loading" prepend-icon="mdi-crop-portrait" color="primary" size="large"
                rounded="xl" class="text-none px-6">
                Choose Certificate Style
              </v-btn>

              <v-btn variant="tonal" :prepend-icon="showAddCourse ? 'mdi-minus' : 'mdi-plus'" color="primary"
                :disabled="coursesLoading" @click="showAddCourse = !showAddCourse" rounded="xl" size="large"
                :text="showAddCourse ? 'Back' : 'Add Course'">
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="side-panel p-5" rounded="xl" elevation="0">
          <p class="form-kicker mb-3">Quick Guide</p>

          <div class="step-list">
            <article class="step-item">
              <span class="step-index">01</span>
              <div>
                <p class="step-title mb-1">Enter student name</p>
                <p class="step-copy mb-0">Type the exact name for the certificate.</p>
              </div>
            </article>

            <article class="step-item">
              <span class="step-index">02</span>
              <div>
                <p class="step-title mb-1">Pick completed course</p>
                <p class="step-copy mb-0">Select from the database or add a new course.</p>
              </div>
            </article>

            <article class="step-item">
              <span class="step-index">03</span>
              <div>
                <p class="step-title mb-1">Choose style & download</p>
                <p class="step-copy mb-0">Pick any certificate thumbnail, preview the design, and download as PDF.</p>
              </div>
            </article>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- DIALOG 1: CERTIFICATE STYLE SELECTOR WITH THUMBNAILS -->
    <v-dialog v-model="styleDialog" max-width="980" :fullscreen="$vuetify.display.xs" scrollable>
      <v-card class="style-dialog-card p-4 p-md-6" rounded="lg">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap mb-3">
          <h4 class="font-weight-bold my-0">Select Certificate Style</h4>
          <v-btn icon="mdi-close" variant="outlined" density="compact" size="large"
            @click="styleDialog = false"></v-btn>
        </v-card-title>

        <v-row class="ga-2">
          <v-col v-for="tmpl in TEMPLATE_OPTIONS" :key="tmpl.id" cols="12" sm="6" md="6" lg="4" class="p-2">
            <div class="style-choice-card" :class="{ 'is-selected': form.template === tmpl.id }"
              @click="selectStyleAndPreview(tmpl.id)" role="button" tabindex="0">
              <div class="card-thumb-frame" :class="tmpl.orientation">
                <img :src="tmpl.thumbnail" :alt="tmpl.title" />
                <v-chip size="x-small" class="card-badge" color="primary" variant="flat">
                  {{ tmpl.badge }}
                </v-chip>
                <div v-if="form.template === tmpl.id" class="card-selected-tag">
                  <v-icon icon="mdi-check-circle" size="20" color="white"></v-icon>
                </div>
              </div>

              <div class="card-text-block">
                <div class="d-flex align-center justify-space-between mb-1">
                  <h3 class="card-title text-subtitle-1 font-weight-bold mb-0">{{ tmpl.title }}</h3>
                </div>
                <p class="card-desc text-body-2 text-medium-emphasis mb-3">{{ tmpl.description }}</p>
                <v-btn color="primary" variant="tonal" size="small" rounded="lg" class="w-100 text-none"
                  prepend-icon="mdi-eye-outline">
                  Select & Preview
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <!-- DIALOG 2: CERTIFICATE PREVIEW & DOWNLOAD -->
    <PhotoZoomDialog v-model="certificateDialog" content-mode="custom" hide-trigger :fullscreen="$vuetify.display.xs"
      :dialog-title="activeTemplateTitle" :max-width="1420" :content-width="activeWidth" :content-height="activeHeight">
      <template #toolbar-actions>
        <v-btn variant="outlined" color="primary" rounded="lg" class="text-none px-3 px-sm-3 mr-1 mr-sm-2 text-caption"
          prepend-icon="mdi-palette-outline" size="small" @click="openStyleDialogFromPreview">
          <span class="d-none d-sm-inline">Change Style</span>
          <span class="d-inline d-sm-none">Style</span>
        </v-btn>
        <v-btn @click="generatePdf" prepend-icon="mdi-download" :loading="loading" variant="flat" color="primary"
          rounded="lg" class="text-none px-3 px-sm-4 text-caption text-sm-button" size="small">
          <span class="d-none d-sm-inline">Download PDF</span>
          <span class="d-inline d-sm-none">PDF</span>
        </v-btn>
      </template>

      <div class="certificate-sheet-container">
        <div class="certificate-sheet certificate-sheet--preview"
          :class="[isLandscape ? 'sheet--landscape' : 'sheet--portrait']">
          <Certificate :form="form" />
        </div>
      </div>
    </PhotoZoomDialog>

    <!-- Hidden Export Sheet for High-Res Canvas PDF Generation -->
    <div class="certificate-export-root" aria-hidden="true">
      <div ref="pdfSection" class="certificate-sheet certificate-sheet--export"
        :class="[isLandscape ? 'sheet--landscape' : 'sheet--portrait']">
        <Certificate :form="form" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.certificate-page {
  position: relative;
  background: var(--portfolio-bg);
}

.form-shell {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
}

.form-kicker {
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  font-weight: 700;
  color: #7C0E44 !important;
}

.form-input :deep(.v-field) {
  border-radius: 12px;
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-field-bg);
}

.note-alert {
  border: 1px solid rgba(124, 14, 68, 0.24);
}

.add-course-panel {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--portfolio-border-color);
  background: rgba(124, 14, 68, 0.03);
}

.side-panel {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
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
  border: 1px solid var(--portfolio-border-color);
  background: rgba(255, 255, 255, 0.02);
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
  color: #7C0E44;
  background: rgba(124, 14, 68, 0.15);
}

.step-title {
  font-weight: 700;
  color: var(--portfolio-ink);
}

.step-copy {
  color: var(--portfolio-muted);
  font-size: 0.89rem;
  line-height: 1.5;
}

/* ========================================================
   Dialog 1: Style Chooser Card Styles
   ======================================================== */
.style-dialog-card {
  background: var(--portfolio-panel-highlight);
  border: 1px solid var(--portfolio-border-color);
  backdrop-filter: blur(24px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.16);
}

.style-choice-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 16px;
  border: 2px solid var(--portfolio-border-color);
  background: var(--portfolio-field-bg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
}

.style-choice-card:hover {
  transform: translateY(-4px);
  border-color: rgba(124, 14, 68, 0.5);
  box-shadow: 0 12px 24px rgba(124, 14, 68, 0.12);
}

.style-choice-card.is-selected {
  border-color: #7C0E44;
  background: rgba(124, 14, 68, 0.03);
  box-shadow: 0 12px 28px rgba(124, 14, 68, 0.18);
}

.card-thumb-frame {
  position: relative;
  width: 100%;
  height: 180px;
  background: #f4f4f4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid var(--portfolio-border-color);
  padding: 10px;
}

.card-thumb-frame img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s ease;
}

.style-choice-card:hover .card-thumb-frame img {
  transform: scale(1.03);
}

.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.card-selected-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #7C0E44;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.card-text-block {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-title {
  color: var(--portfolio-ink);
  line-height: 1.3;
}

.card-desc {
  flex: 1;
  font-size: 0.82rem;
  line-height: 1.45;
}

/* ========================================================
   Dialog 2: Certificate Preview Sheet
   ======================================================== */
.certificate-sheet-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 10px 0;
}

.certificate-sheet {
  display: flex;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
  border-radius: 4px;
}

.certificate-sheet--preview.sheet--landscape,
.certificate-sheet--export.sheet--landscape {
  width: 1123px;
  height: 794px;
  flex: 0 0 auto;
}

.certificate-sheet--preview.sheet--portrait,
.certificate-sheet--export.sheet--portrait {
  width: 794px;
  height: 1123px;
  flex: 0 0 auto;
}

.certificate-export-root {
  position: fixed;
  left: -99999px;
  top: 0;
  pointer-events: none;
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

  .card-thumb-frame {
    height: 150px;
  }
}

@media (max-width: 480px) {
  .style-dialog-card {
    padding: 16px 12px !important;
  }
}
</style>
