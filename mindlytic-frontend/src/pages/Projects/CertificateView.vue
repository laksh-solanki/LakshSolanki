<script setup>
// Library Imports
import { ref, reactive, onMounted } from "vue";
import Certificate from "@/components/certificate.vue";
import Alerts from "@/components/Alerts.vue";

// State & Refs
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

const goBack = () => {
  window.history.back();
};

const BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? import.meta.env.VITE_API_URL_1
  : import.meta.env.VITE_API_URL_2;

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
  }, 1000);
};

const generatePdf = async () => {
  loading.value = true;
  const html2pdf = (await import("html2pdf.js")).default;

  if (pdfSection.value) {
    const options = {
      margin: 0,
      filename: form.course.name + ".pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(options)
      .from(pdfSection.value)
      .save()
      .then(() => {
        showAlert("Certificate downloaded successfully!", "success");
      })
      .catch((err) => {
        console.error(err);
        showAlert("Failed to generate certificate.", "error");
      })
      .finally(() => {
        loading.value = false;
        dialog.value = false;
      });
  }
};

</script>

<template>
  <div class="page-wrapper">
    <v-btn @click="goBack" variant="flat" icon="mdi-arrow-left" color="primary"
      class="rounded-0 rounded-be-xl back-button" position="fixed" style="z-index: 10; top: 64px"
      aria-label="Go back"></v-btn>

    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-sheet class="d-flex align-center justify-center flex-wrap text-center" elevation="0" height="250" dark
      color="transparent">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            <div class="text-center mb-8">
              <div class="text-overline text-medium-emphasis">Tool</div>
              <h1 class="text-h2 font-weight-bold">
                Certificate Generator
              </h1>
              <p class="text-body-1 text-medium-emphasis mt-2">
                Create and download your course completion certificate.
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-card class="pa-4 pa-md-6 rounded-xl" flat border>
            <v-form ref="studentForm" @submit.prevent="previewCertificate">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model.trim="form.fname" :rules="[(v) => !!v || 'Full Name is required']"
                    label="Full Name" placeholder="Enter your full name" name="fname" id="fname" rounded="lg"
                    autocomplete="name" spellcheck="false" prepend-inner-icon="mdi-account" variant="solo-filled"
                    flat></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="form.course" :items="courses" :rules="[(v) => !!v || 'Course is required']"
                    label="Select Course" name="course" id="course" rounded="lg" item-title="name" return-object
                    prepend-inner-icon="mdi-school" variant="solo-filled" flat></v-select>
                </v-col>
              </v-row>

              <v-row class="mt-4" justify="center">
                <v-col cols="auto">
                  <v-btn type="submit" text="Preview Certificate" :loading="loading"
                    prepend-icon="mdi-file-certificate-outline" color="primary" size="large" class="rounded-lg"
                    elevation="2"></v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card>
          <v-alert class="mt-6 rounded-xl" color="primary" variant="tonal" border="start" elevation="2"
            icon="mdi-information" prominent>
            <p class="text-body-1">
              <strong>Note:</strong> Please ensure that you have filled in your
              full name and selected the correct course before generating the
              certificate. The certificate will be generated in PDF format,
              which you can
              <v-chip class="mx-1" color="secondary" label size="small">
                Download For Free
              </v-chip>
              .
            </p>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="dialog" max-width="900px">
      <v-card class="d-flex flex-column fill-height">
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title class="text-h6 font-weight-bold">
            Certificate Preview
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="dialog = false" aria-label="Close dialog"></v-btn>
        </v-toolbar>

        <v-card-text class="grow d-flex align-center justify-center pa-2 pa-md-4 bg-grey-darken-4">
          <div class="certificate-preview-wrapper">
            <v-responsive :aspect-ratio="1 / 1.414">
              <div ref="pdfSection" class="certificate-bg">
                <Certificate :form="form" />
              </div>
            </v-responsive>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn @click="generatePdf" text="Download" prepend-icon="mdi-download" :loading="loading" variant="tonal"
            color="primary" size="large"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.page-wrapper {
  position: relative;
}

.back-button {
  top: 64px;
  /* Adjust based on your app bar height */
  left: 0;
}

.certificate-preview-wrapper {
  width: 100%;
  max-width: 820px;
  /* A4-like width for desktop */
  margin: auto;
}

.certificate-bg {
  background-image: url(@/assets/Picture/CoursePathway_BG.jpg);
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
</style>
