<template>
  <v-card id="collaborate-container" class="newsletter-card p-4 p-md-5" :class="{ 'highlight-target': isHighlighted }" rounded="xl" elevation="0">
    <div v-if="suggestNotice" class="collaborate-suggestion-notice mb-3 animate-fade-in">
      <v-icon size="18" class="mr-1 text-primary">mdi-message-text-outline</v-icon>
      <span class="text-caption font-weight-bold text-primary">{{ suggestNotice }}</span>
    </div>

    <div class="newsletter-head mb-4">
      <v-chip size="small" variant="elevated" color="primary">Let's collaborate better</v-chip>
    </div>
    <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubscribe">
      <Alerts v-model="showAlert" :message="feedbackMessage" :type="feedbackType" />

      <v-text-field ref="emailInputRef" v-model.trim="email" type="email" variant="outlined" label="Enter your email"
        prepend-inner-icon="mdi-email-outline" :rules="emailRules" hide-details :disabled="isLoading || isSubscribed"
        density="comfortable" flat class="newsletter-input mb-3"></v-text-field>

      <v-btn block type="submit" color="primary" :loading="isLoading" :disabled="!isValid || isSubscribed"
        rounded="xl" elevation="0" class="text-none subscribe-btn">
        <v-icon start icon="mdi-bell-ring-outline"></v-icon>
        {{ isSubscribed ? "Already subscribed" : "Join the newsletter" }}
      </v-btn>
    </v-form>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Alerts from "./Alerts.vue";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";

const isValid = ref(false);
const isLoading = ref(false);
const isSubscribed = ref(false);
const email = ref("");
const feedbackMessage = ref("");
const feedbackType = ref("info");
const showAlert = ref(false);
const formRef = ref(null);
const emailInputRef = ref(null);
const suggestNotice = ref("");
const isHighlighted = ref(false);
let highlightTimer = null;

const emailRules = [
  (v) => !!v || "Email is required",
  (v) => /.+@.+\..+/.test(v) || "Please enter a valid email address",
];

const API_URL = getApiBaseUrl();

const handleConnectPrompt = (event) => {
  const customMessage = event?.detail?.message || "Write Your Email to Connect to Me.";
  suggestNotice.value = customMessage;
  isHighlighted.value = true;

  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    isHighlighted.value = false;
  }, 4000);

  setTimeout(() => {
    emailInputRef.value?.focus?.();
  }, 400);
};

onMounted(() => {
  window.addEventListener("prompt-connect-email", handleConnectPrompt);
  const storedEmail = localStorage.getItem("subscribedEmail");
  if (storedEmail) {
    email.value = storedEmail;
    isSubscribed.value = true;
    feedbackMessage.value = "You are already subscribed.";
    feedbackType.value = "success";
    showAlert.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener("prompt-connect-email", handleConnectPrompt);
  if (highlightTimer) clearTimeout(highlightTimer);
});

const handleSubscribe = async () => {
  const validation = await formRef.value?.validate();
  if (!validation?.valid) return;

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
      feedbackMessage.value = "Thank you for subscribing.";
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

<style scoped>
.newsletter-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.14)) !important;
  background: var(--portfolio-surface, #FFFFFF) !important;
  box-shadow: var(--portfolio-shadow-sm, 0 4px 16px rgba(124, 14, 68, 0.05)) !important;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.newsletter-card.highlight-target {
  border-color: var(--portfolio-primary, #7C0E44) !important;
  box-shadow: 0 0 0 3px var(--portfolio-border-strong, rgba(124, 14, 68, 0.25)), var(--portfolio-shadow, 0 8px 24px rgba(124, 14, 68, 0.12)) !important;
}

.collaborate-suggestion-notice {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--nav-seg-bg, rgba(124, 14, 68, 0.08));
  border-left: 3px solid var(--portfolio-primary, #7C0E44);
  border-radius: 8px;
}

.newsletter-head {
  position: relative;
  z-index: 1;
}

.newsletter-input :deep(.v-field) {
  border: 1px solid var(--portfolio-border-color, rgba(124, 14, 68, 0.16)) !important;
  border-radius: 12px !important;
  background: var(--portfolio-field-bg, #FFFFFF) !important;
}

.newsletter-input :deep(.v-label),
.newsletter-input :deep(input) {
  color: var(--portfolio-ink, #231219) !important;
}

.subscribe-btn {
  background: var(--portfolio-primary, #7C0E44) !important;
  color: #FFFFFF !important;
  font-weight: 700;
  transition: all 0.2s ease;
}

.subscribe-btn:hover {
  background: #901452 !important;
  transform: translateY(-1px);
}
</style>
