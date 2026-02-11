<script setup>
import { ref, reactive, onMounted } from "vue";
import Certificate from "@/components/certificate.vue";
import Alerts from "@/components/Alerts.vue";

const studentForm = ref(null);
const form = reactive({
  fname: "",
  course: "",
});

const courses = ref([]);
const BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? import.meta.env.VITE_API_URL_1
  : import.meta.env.VITE_API_URL_2;

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

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

const loading = ref(false);
const dialog = ref(false);
const pdfSection = ref(null);

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

const goBack = () => {
  window.history.back();
};
</script>

<template>
  <v-btn
    @click="goBack"
    variant="flat"
    icon="mdi-arrow-left"
    color="primary"
    class="rounded-0 rounded-be-xl"
  ></v-btn>

  <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

  <v-container class="certificate-container" style="min-height: 84.3vh">
    <v-card
      class="text-h5 pa-4 my-3 text-center"
      color="primary-lighten-5"
      border="primary md opacity-100"
      rounded="xl"
      flat
    >
      Student Certificate
    </v-card>

    <v-card class="rounded-xl" color="primary" variant="tonal" border>
      <v-card-text>
        <v-form ref="studentForm">
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 text-md-start mt-4 text-center">
                Personal Details
              </h3>
              <v-divider class="my-3"></v-divider>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.fname"
                :rules="[(v) => !!v || 'Full Name is required']"
                label="Full Name"
                variant="outlined"
                name="fname"
                id="fname"
                rounded="lg"
                bg-color="surface"
                autocomplete
                spellcheck
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.course"
                :items="courses"
                :rules="[(v) => !!v || 'Course is required']"
                label="Course"
                variant="outlined"
                name="course"
                id="course"
                rounded="lg"
                item-title="name"
                return-object
                bg-color="surface"
              ></v-select>
            </v-col>
          </v-row>

          <v-row class="mt-5 justify-center">
            <v-col cols="12" md="3" class="d-flex justify-center">
              <v-tooltip
                text="Preview and Download the certificate"
                location="top"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    @click="previewCertificate"
                    text="Certificate"
                    :loading="loading"
                    prepend-icon="mdi-file-certificate-outline"
                    variant="tonal"
                    color="primary"
                    size="large"
                    class="rounded-lg border"
                  ></v-btn>
                </template>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card
      class="mt-4 rounded-xl"
      color="primary"
      variant="tonal"
      elevation="3"
      border
    >
      <v-card-text>
        <div>
          Note: Please ensure that you have filled in your full name and
          selected the correct course before generating the certificate. The
          certificate will be generated in PDF format, which you can
          <v-chip class="ma-1" color="secondary" label>
            Download For Free.
          </v-chip>
        </div>
        <div class="mt-2">
          Certificates: The 10 courses available for certificate generation.
        </div>
      </v-card-text>
    </v-card>
  </v-container>

  <v-dialog v-model="dialog" max-width="820">
    <v-card>
      <v-card-title class="pa-0 d-flex justify-space-between">
        <v-btn
          @click="generatePdf"
          text="Download"
          prepend-icon="mdi-download"
          :loading="loading"
          variant="tonal"
          color="primary"
          height="45"
          class="rounded-0 rounded-br-lg"
        ></v-btn>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="primary"
          @click="dialog = false"
          class="rounded-0 rounded-bl-lg"
        ></v-btn>
      </v-card-title>

      <div>
        <div ref="pdfSection" class="certificate-bg">
          <Certificate :form="form" />
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.certificate-bg {
  background-image: url(/src/assets/Picture/CoursePathway_BG.jpg);
  padding: 0;
  margin: 0;
  width: 100%;
  height: 1120px !important;
  align-items: center;
  overflow: hidden;
  position: relative;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
</style>
