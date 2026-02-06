<template>
  <div>
    <Alerts v-model="showAlert" :message="feedbackMessage" :type="feedbackType" :duration="4000" />

    <v-dialog v-model="showDialog" max-width="400" persistent location="bottom end">
      <v-card>
        <v-card-title class="text-center pb-2">
          <div class="text-center">
            <v-icon icon="mdi-email-newsletter" size="40" color="primary" class="mb-2"></v-icon>
            <p class="text-h6 font-weight-bold my-2">Register Email</p>
          </div>
        </v-card-title>

        <v-card-text class="text-center pb-4">
          <p class="text-body-2 text-medium-emphasis">
            Join our community to stay updated with the latest news and features.
          </p>
        </v-card-text>

        <v-card-text>
          <v-form ref="form" v-model="isValid" @submit.prevent="handleRegister">
            <v-text-field
              v-model.trim="email"
              label="Email Address"
              placeholder="you@example.com"
              type="email"
              variant="outlined"
              prepend-inner-icon="mdi-email-outline"
              :rules="emailRules"
              :disabled="isLoading"
              :error-messages="emailExistsError"
              required
              density="comfortable"
            ></v-text-field>

            <div class="d-flex gap-1 mt-4">
              <v-btn
                variant="text"
                color="primary"
                @click="handleCancel"
                :disabled="isLoading"
                class="text-none"
              >
                Skip for Now
              </v-btn>
              <v-btn
                color="primary"
                type="submit"
                rounded="3"
                :loading="isLoading"
                :disabled="!isValid || !!emailExistsError"
                class="text-none"
                elevation="2"
              >
                Register
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Alerts from './Alerts.vue'

// State
const isValid = ref(false)
const isLoading = ref(false)
const email = ref('')
const feedbackMessage = ref('')
const feedbackType = ref('info')
const showAlert = ref(false)
const showDialog = ref(false)
const emailExistsError = ref('')

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

// Get current hour for localStorage key
const getHourKey = () => {
  const now = new Date()
  const dateHour = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}`
  return `emailRegisterShown_${dateHour}`
}

// Lifecycle
onMounted(() => {
  const hourKey = getHourKey()
  const shown = localStorage.getItem(hourKey)

  if (!shown) {
    showDialog.value = true
    localStorage.setItem(hourKey, 'true')
  }
})

// Methods
const showFeedback = (message, type = 'info') => {
  feedbackMessage.value = message
  feedbackType.value = type
  showAlert.value = true
}

const checkEmailExists = async (emailToCheck) => {
  try {
    const response = await fetch(`${API_URL}/api/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToCheck }),
    })

    if (!response.ok) {
      const data = await response.json()
      return data.exists || false
    }
    return false
  } catch (error) {
    console.error('Email check error:', error)
    return false
  }
}

const handleRegister = async () => {
  if (!isValid.value) return

  isLoading.value = true
  emailExistsError.value = ''
  feedbackMessage.value = ''

  try {
    // Check if email already exists
    const exists = await checkEmailExists(email.value)
    if (exists) {
      emailExistsError.value = 'This email is already registered'
      isLoading.value = false
      return
    }

    // Submit to subscribe/register endpoint
    const response = await fetch(`${API_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem('registeredEmail', email.value)
      showFeedback('Thank you for registering!', 'success')
      closeDialog()
    } else {
      showFeedback(data.error || 'Registration failed. Please try again.', 'error')
    }
  } catch (error) {
    console.error('Registration error:', error)
    showFeedback('Network error. Please try again later.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  closeDialog()
}

const closeDialog = () => {
  showDialog.value = false
  email.value = ''
  emailExistsError.value = ''
}
</script>
