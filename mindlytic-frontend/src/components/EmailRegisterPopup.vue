<template>
  <v-card class="mx-auto" elevation="0" max-width="300">
    <div class="mb-3 text-center">
      <v-icon icon="mdi-email-newsletter" size="40" color="primary" class="mb-2"></v-icon>
      <p class="text-h6 font-weight-bold align-center my-2">Subscribe</p>
      <p class="text-body-2 text-medium-emphasis">
        Join our newsletter to stay updated with the latest news and features.
      </p>
    </div>

    <v-form ref="form" v-model="isValid" @submit.prevent="handleSubscribe">
      <Alerts v-model="showAlert" :message="feedbackMessage" :type="feedbackType" />

      <v-text-field v-model.trim="email" label="Email Address" placeholder="you@example.com" type="email"
        variant="outlined" prepend-inner-icon="mdi-email-outline" :rules="emailRules"
        :disabled="isLoading || isSubscribed" required density="comfortable"></v-text-field>

      <v-btn block color="primary" type="submit" rounded="3" :loading="isLoading" :disabled="!isValid || isSubscribed"
        class="text-none mt-2" elevation="2">
        {{ isSubscribed ? "Subscribed" : "Subscribe" }}
      </v-btn>
    </v-form>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Alerts from "./Alerts.vue";

// State
const isValid = ref(false);
const isLoading = ref(false);
const isSubscribed = ref(false);
const email = ref("");
const feedbackMessage = ref("");
const feedbackType = ref("info");
const showAlert = ref(false);

// Validation Rules
const emailRules = [
  (v) => !!v || "Email is required",
  (v) => /.+@.+\..+/.test(v) || "Please enter a valid email address",
];

// API Configuration
const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? import.meta.env.VITE_API_URL_1
  : import.meta.env.VITE_API_URL_2;

// Lifecycle
onMounted(() => {
  const storedEmail = localStorage.getItem("subscribedEmail");
  if (storedEmail) {
    email.value = storedEmail;
    isSubscribed.value = true;
    feedbackMessage.value = "You are already subscribed!";
    feedbackType.value = "success";
    showAlert.value = true;
  }
});

// Methods

const handleSubscribe = async () => {
  if (!isValid.value) return;

  isLoading.value = true;

  try {
    const response = await fetch(`${API_URL}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value }),
    });

    const data = await response.json();

    if (response.ok) {
      isSubscribed.value = true;
      localStorage.setItem("subscribedEmail", email.value);
      feedbackMessage.value = "Thank you for subscribing!";
      feedbackType.value = "success";
      showAlert.value = true;
    } else {
      feedbackMessage.value =
        data.error || "Subscription failed. Please try again.";
      feedbackType.value = "error";
      showAlert.value = true;
    }
  } catch (error) {
    console.error("Subscription error:", error);
    feedbackMessage.value = "Network error. Please try again later.";
    feedbackType.value = "error";
    showAlert.value = true;
  } finally {
    isLoading.value = false;
  }
};
</script>
