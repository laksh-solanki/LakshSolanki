<script setup>
import { computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  message: { type: String, default: '' },
  type: { type: String, default: 'success' }, // 'success' | 'error' | 'info'
  duration: { type: Number, default: 4000 },
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const color = computed(() => (props.type === 'error' ? 'error' : props.type === 'success' ? 'success' : 'info'))

let timer = null
watch(() => props.modelValue, (val) => {
  if (val) {
    clearTimeout(timer)
    timer = setTimeout(() => emit('update:modelValue', false), props.duration)
  } else {
    clearTimeout(timer)
  }
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <v-snackbar v-model="visible" :color="color" variant="flat" location="top right" transition="slide-x-reverse-transition">
    <span v-if="type === 'success'">✔</span>
    <span v-else-if="type === 'error'">❌</span>
    {{ message }}
    <template #actions>
      <v-btn icon="mdi-close" @click="visible = false"></v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
/* small spacing tweaks if needed */
</style>
