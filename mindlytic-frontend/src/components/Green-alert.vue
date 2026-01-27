<script setup>
import { computed } from 'vue'

const props = defineProps({
  successAlert: Boolean,
  successMessage: String,
})

const emit = defineEmits(['update:successAlert'])

const snackbar = computed({
  get: () => props.successAlert,
  set: (value) => emit('update:successAlert', value),
})
</script>

<template>
  <v-snackbar
    v-model="snackbar"
    location="top"
    color="success"
    variant="flat"
  >
    ✔ {{ successMessage }}
    <template #actions>
      <v-btn icon="mdi-close" @click="snackbar = false"></v-btn>
    </template>
  </v-snackbar>
</template>
