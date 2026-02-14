<template>
  <v-container class="py-10">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg pb-3 text-center" elevation="10" border>
          <v-img height="160" :src="selectedImage" cover class="rounded-t-lg">
            <template v-slot:error>
              <v-img src="../assets/Picture/banners/img-1.jpg" cover></v-img>
            </template>
          </v-img>

          <v-avatar size="120" class="border-lg border-background mx-auto" style="margin-top: -60px; z-index: 2;"
            :image="my_photo"></v-avatar>

          <div class="mt-10">
            <h2 class="text-h5 font-weight-bold">Laksh Solanki</h2>
            <p class="text-medium-emphasis mb-4">Senior Full-Stack Engineer</p>

            <div class="d-flex mb-6 justify-center gap-2">
              <v-btn color="grey" variant="tonal" rounded="lg" icon="mdi-email-outline" @click="openanyModal"></v-btn>
              <v-btn color="grey" variant="tonal" rounded="lg" icon="mdi-dots-horizontal" @click="openanyModal"></v-btn>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="d-flex justify-space-around mb-4">
              <div>
                <div class="text-h6 font-weight-bold">82</div>
                <div class="text-caption text-medium-emphasis">Projects</div>
              </div>
              <div>
                <div class="text-h6 font-weight-bold">14k</div>
                <div class="text-caption text-medium-emphasis">Commits</div>
              </div>
              <div>
                <div class="text-h6 font-weight-bold">4.9</div>
                <div class="text-caption text-medium-emphasis">Rating</div>
              </div>
            </div>

            <v-divider class="mb-4"></v-divider>

            <v-list density="compact" nav class="text-left">
              <v-list-item prepend-icon="mdi-map-marker-outline" title="Gujarat, India"
                class="text-body-2"></v-list-item>
              <v-list-item prepend-icon="mdi-web" title="https://mindlytic.onrender.com/"
                href="https://mindlytic.onrender.com/" target="_blank" class="text-body-2"></v-list-item>
              <v-list-item prepend-icon="mdi-github" title="github.com/laksh-solanki"
                href="https://github.com/laksh-solanki" target="_blank" class="text-body-2 text-blue"></v-list-item>
              <v-list-item prepend-icon="mdi-twitter" title="@laksh_solanki" class="text-body-2"></v-list-item>
            </v-list>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="rounded-lg" elevation="10" border>
          <v-card-text class="pa-0">
            <v-tabs v-model="tab" grow color="white" align-tabs="start" slider-color="white" class="mb-6 border-b">
              <v-tab value="edit" class="text-capitalize">Edit Profile</v-tab>
              <v-divider vertical></v-divider>
              <v-tab value="security" class="text-capitalize">Security</v-tab>
            </v-tabs>
          </v-card-text>

          <v-window v-model="tab" class="ma-5">
            <v-window-item value="edit">
              <p class="text-h6 font-weight-bold mb-1">General Information</p>
              <p class="text-caption text-medium-emphasis mb-6">
                Update your personal details here.
              </p>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field label="First Name" variant="outlined" density="comfortable" color="primary"
                    v-model="form.firstName" rounded="lg"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Last Name" variant="outlined" density="comfortable" color="primary"
                    v-model="form.lastName" rounded="lg"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-combobox v-model="chips" :items="hobbies" label="Your favorite hobbies" variant="outlined" chips
                    closable-chips multiple class="hobbies-combobox" item-title="name" return-object rounded="lg"
                    color="primary" density="comfortable">
                    <template v-slot:chip="{ props, item }">
                      <v-chip v-bind="props" color="primary" text-color="primary" variant="outlined">
                        <strong>{{ item.title }}</strong>
                      </v-chip>
                    </template>
                  </v-combobox>
                </v-col>
                <v-col cols="12">
                  <v-text-field label="Headline / Role" variant="outlined" density="comfortable" color="primary"
                    v-model="form.role" rounded="lg"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea label="Bio" variant="outlined" rows="3" color="primary" v-model="form.bio"
                    hint="Brief description for your profile." rounded="lg"></v-textarea>
                </v-col>
              </v-row>

              <div class="d-flex mt-4 justify-end">
                <v-btn color="primary" size="large" variant="flat" class="text-capitalize" rounded="lg"
                  @click="submitProfile">Save
                  Changes</v-btn>
              </div>
            </v-window-item>
            <v-window-item value="security">
              <p class="text-h6 font-weight-bold mb-4">Password & Security</p>

              <v-list bg-color="transparent">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary ma-n4">mdi-lock-outline</v-icon>
                  </template>
                  <v-list-item-title>Change Password</v-list-item-title>
                  <v-list-item-subtitle>Last changed 3 months ago</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn variant="outlined" size="small" color="primary" rounded="lg">Update</v-btn>
                  </template>
                </v-list-item>

                <v-divider class="my-3"></v-divider>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary ma-n4">mdi-shield-check-outline</v-icon>
                  </template>
                  <v-list-item-title>Two-Factor Authentication</v-list-item-title>
                  <v-list-item-subtitle :class="twoFAEnabled ? 'text-success' : 'text-error'">{{
                    twoFAEnabled ? "Enabled" : "Disabled"
                    }}</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-switch color="primary" v-model="twoFAEnabled" hide-details density="compact"></v-switch>
                  </template>
                </v-list-item>
              </v-list>

              <v-alert color="error" variant="tonal" icon="mdi-alert-circle-outline" title="Delete Account"
                class="mt-6">
                <div class="text-caption mb-4">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </div>
                <v-btn color="error" variant="flat" size="small">Delete Account</v-btn>
              </v-alert>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>

// Library Imports
import { ref, onMounted } from "vue";
import my_photo from "@/assets/Picture/my-pic.jpg";
import Alerts from "@/components/Alerts.vue";

// Notification State (unified)
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const selectedImage = ref('')
const tab = ref("edit");
const chips = ref([]);
const hobbies = ref([]);
const twoFAEnabled = ref(true);

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = ["success", "error", "info"].includes(type)
    ? type
    : "success";
  alertVisible.value = true;
};

//profile background image change

const images = [
  new URL("../assets/Picture/banners/img-1.jpg", import.meta.url).href,
  new URL("../assets/Picture/banners/img-2.jpg", import.meta.url).href,
  new URL("../assets/Picture/banners/img-3.jpg", import.meta.url).href,
  new URL("../assets/Picture/banners/img-4.jpg", import.meta.url).href,
];

onMounted(() => {
  const randomIndex = Math.floor(Math.random() * images.length)
  selectedImage.value = images[randomIndex]
})

const openanyModal = () => {
  showAlert("Email modal opened (functionality not implemented)", "info");
};

const submitProfile = () => {
  // Here you would normally send the updated profile data to your backend
  showAlert("Profile updated successfully!", "success");
};

const BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? import.meta.env.VITE_API_URL_1
  : import.meta.env.VITE_API_URL_2;
const fetchhobbies = async () => {
  try {
    const response = await fetch(`${BASE_URL}/profile`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    hobbies.value = data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
};

onMounted(() => {
  fetchhobbies();
});

const form = ref({
  firstName: "Laksh",
  lastName: "Solanki",
  email: "lakshsolanki848@gmail.com",
  role: "Senior Full-Stack Engineer",
  bio: "Passionate about building scalable web applications with Vue and Node.js. Open source contributor and coffee enthusiast.",
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

/* Custom thick border for the avatar to cut into the cover image */
.border-lg {
  border: 4px solid rgb(var(--v-theme-background));
}
</style>
