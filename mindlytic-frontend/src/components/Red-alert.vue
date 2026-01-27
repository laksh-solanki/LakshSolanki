<script setup>
import { computed } from 'vue'

const props = defineProps({
  errorAlert: Boolean,
  errorMessage: String,
})

const emit = defineEmits(['update:errorAlert'])

const snackbar = computed({
  get: () => props.errorAlert,
  set: (value) => emit('update:errorAlert', value),
})
</script>

<template>
  <v-snackbar
    v-model="snackbar"
    location="top"
    style="margin-top: 70px !important"
    color="error"
    variant="flat"
  >
    ❌ {{ errorMessage }}
    <template v-slot:actions>
      <v-btn icon="mdi-close" @click="snackbar = false"></v-btn>
    </template>
  </v-snackbar>
</template>
