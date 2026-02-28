<template>
  <v-card class="newsletter-card pa-4 pa-md-5" rounded="xl" elevation="0">
    <div class="newsletter-glow"></div>
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
      <v-chip size="x-small" color="teal-lighten-4" variant="flat" rounded="lg">No spam</v-chip>
      <v-chip size="x-small" color="teal-lighten-4" variant="flat" rounded="lg">1 mail / month</v-chip>
      <v-chip size="x-small" color="teal-lighten-4" variant="flat" rounded="lg">Unsubscribe anytime</v-chip>
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
  border: 1px solid rgba(126, 232, 213, 0.24);
  background:
    radial-gradient(circle at 92% 6%, rgba(255, 193, 109, 0.2), transparent 38%),
    radial-gradient(circle at 10% 14%, rgba(92, 237, 210, 0.19), transparent 42%),
    linear-gradient(160deg, rgba(19, 61, 55, 0.95), rgba(10, 33, 29, 0.94));
  box-shadow:
    0 20px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
}

.newsletter-glow {
  position: absolute;
  right: -38px;
  top: -38px;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(126, 232, 213, 0.28), transparent 70%);
  pointer-events: none;
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
  border: 1px solid rgba(154, 243, 228, 0.32);
  background: rgba(12, 39, 35, 0.5);
  color: #9de8db;
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  font-weight: 700;
}

.mail-avatar {
  border: 1px solid rgba(255, 255, 255, 0.54);
}

.tracking-wide {
  letter-spacing: 0.08em;
}

.copy-muted {
  color: #c7e2dc;
}

.newsletter-card h3 {
  color: #f4fffc;
}

.benefit-chips {
  position: relative;
  z-index: 1;
}

.newsletter-input :deep(.v-field) {
  border: 1px solid rgba(126, 232, 213, 0.26);
  border-radius: 14px;
  background: rgba(7, 24, 22, 0.56);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.newsletter-input :deep(.v-label),
.newsletter-input :deep(input) {
  color: #ecfaf7;
}

.subscribe-btn {
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #082621;
  background: linear-gradient(145deg, #9cf0df, #5ed5be);
  box-shadow: 0 12px 18px rgba(32, 153, 133, 0.34);
}

.subscribe-btn:hover {
  filter: brightness(1.05);
}
</style>
