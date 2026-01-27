<template>
  <v-card class="mx-auto" elevation="0" max-width="300">
    <div class="text-center mb-3">
      <v-icon icon="mdi-email-newsletter" size="40" color="primary" class="mb-2"></v-icon>
      <p class="text-h6 font-weight-bold my-2">Subscribe</p>
      <p class="text-body-2 text-medium-emphasis">
        Join our newsletter to stay updated with the latest news and features.
      </p>
    </div>

    <v-form ref="form" v-model="isValid" @submit.prevent="handleSubscribe">
      <v-alert
        v-if="feedbackMessage"
        :type="feedbackType"
        variant="tonal"
        class="mb-3"
        closable
        rounded="3"
        density="compact"
        @click:close="feedbackMessage = ''"
      >
        {{ feedbackMessage }}
      </v-alert>

      <v-text-field
        v-model.trim="email"
        label="Email Address"
        placeholder="you@example.com"
        type="email"
        variant="outlined"
        prepend-inner-icon="mdi-email-outline"
        :rules="emailRules"
        :disabled="isLoading || isSubscribed"
        required
        density="comfortable"
      ></v-text-field>

      <v-btn
        block
        color="primary"
        type="submit"
        rounded="3"
        :loading="isLoading"
        :disabled="!isValid || isSubscribed"
        class="mt-2 text-none"
        elevation="2"
      >
        {{ isSubscribed ? 'Subscribed' : 'Subscribe' }}
      </v-btn>
    </v-form>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// State
const isValid = ref(false)
const isLoading = ref(false)
const isSubscribed = ref(false)
const email = ref('')
const feedbackMessage = ref('')
const feedbackType = ref('info')

// Validation Rules
const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'Please enter a valid email address',
]

// API Configuration
const API_URL =
  import.meta.env.VITE_API_URL ||
  (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:5001'
    : 'https://mindlytic-backend.onrender.com')

// Lifecycle
onMounted(() => {
  const storedEmail = localStorage.getItem('subscribedEmail')
  if (storedEmail) {
    email.value = storedEmail
    isSubscribed.value = true
    showFeedback('You are already subscribed!', 'success')
  }
})

// Methods
const showFeedback = (message, type = 'info') => {
  feedbackMessage.value = message
  feedbackType.value = type
}

const handleSubscribe = async () => {
  if (!isValid.value) return

  isLoading.value = true
  feedbackMessage.value = ''

  try {
    const response = await fetch(`${API_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    const data = await response.json()

    if (response.ok) {
      isSubscribed.value = true
      localStorage.setItem('subscribedEmail', email.value)
      showFeedback('Thank you for subscribing!', 'success')
    } else {
      showFeedback(data.error || 'Subscription failed. Please try again.', 'error')
    }
  } catch (error) {
    console.error('Subscription error:', error)
    showFeedback('Network error. Please try again later.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>
