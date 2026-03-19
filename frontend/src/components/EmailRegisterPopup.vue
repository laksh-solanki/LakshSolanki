<template>
  <v-card class="newsletter-card pa-4 pa-md-5" rounded="xl" elevation="0">
    <div class="newsletter-head mb-4">
      <div class="eyebrow-chip">Let's collaborate better</div>
      <div class="d-flex align-start justify-space-between ga-3">
        <div>
          <h3 class="text-h6 font-weight-bold mb-1"></h3>
          <p class="text-body-2 copy-muted mb-0">
            Fill your email below to receive monthly updates and a direct collaboration reply.
          </p>
        </div>
      </div>
    </div>

    <div class="d-flex flex-wrap ga-2 mb-4 benefit-chips">
      <v-chip size="x-small" color="primary" variant="tonal" rounded="lg">No spam</v-chip>
      <v-chip size="x-small" color="primary" variant="tonal" rounded="lg">1 mail / month</v-chip>
      <v-chip size="x-small" color="primary" variant="tonal" rounded="lg">Unsubscribe anytime</v-chip>
    </div>

    <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubscribe">
      <Alerts
        v-model="showAlert"
        :message="feedbackMessage"
        :type="feedbackType"
      />

      <v-text-field
        v-model.trim="email"
        label="Email address"
        placeholder="you@company.com"
        type="email"
        variant="solo-filled"
        prepend-inner-icon="mdi-email-outline"
        :rules="emailRules"
        :disabled="isLoading || isSubscribed"
        required
        density="comfortable"
        flat
        class="newsletter-input mb-3"
      ></v-text-field>

      <v-btn
        block
        type="submit"
        rounded="xl"
        :loading="isLoading"
        :disabled="!isValid || isSubscribed"
        class="text-none subscribe-btn"
        elevation="0"
      >
        <v-icon start icon="mdi-bell-ring-outline"></v-icon>
        {{ isSubscribed ? "Already subscribed" : "Join the newsletter" }}
      </v-btn>
    </v-form>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
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

const emailRules = [
  (v) => !!v || "Email is required",
  (v) => /.+@.+\..+/.test(v) || "Please enter a valid email address",
];

const API_URL = getApiBaseUrl();

onMounted(() => {
  const storedEmail = localStorage.getItem("subscribedEmail");
  if (storedEmail) {
    email.value = storedEmail;
    isSubscribed.value = true;
    feedbackMessage.value = "You are already subscribed.";
    feedbackType.value = "success";
    showAlert.value = true;
  }
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
  border: 1px solid rgba(15, 143, 124, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 249, 247, 0.96));
  box-shadow:
    0 20px 36px rgba(18, 38, 33, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.newsletter-head {
  position: relative;
  z-index: 1;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 143, 124, 0.18);
  background: rgba(15, 143, 124, 0.08);
  color: var(--portfolio-primary);
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  font-weight: 700;
}

.mail-avatar {
  border: 1px solid rgba(15, 143, 124, 0.16);
}

.tracking-wide {
  letter-spacing: 0.08em;
}

.copy-muted {
  color: var(--portfolio-muted);
}

.newsletter-card h3 {
  color: var(--portfolio-ink);
}

.benefit-chips {
  position: relative;
  z-index: 1;
}

.benefit-chips :deep(.v-chip) {
  border: 1px solid rgba(15, 143, 124, 0.14);
  background: rgba(15, 143, 124, 0.08);
  color: var(--portfolio-ink);
}

.newsletter-input :deep(.v-field) {
  border: 1px solid rgba(15, 143, 124, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.newsletter-input :deep(.v-label),
.newsletter-input :deep(input) {
  color: var(--portfolio-ink);
}

.subscribe-btn {
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #f7fffd;
  background: linear-gradient(145deg, var(--portfolio-primary), #2ab89f);
  box-shadow: 0 12px 18px rgba(15, 143, 124, 0.22);
}

.subscribe-btn:hover {
  filter: brightness(1.05);
}
</style>
