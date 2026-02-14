<script setup>
// Library Imports
import {
  computed,
  watch,
  onBeforeUnmount,
  defineProps,
  defineEmits,
} from "vue";

// Props & Emits & State & Refs
const emit = defineEmits(["update:modelValue"]);
let timer = null;

const props = defineProps({
  modelValue: Boolean,
  message: { type: String, default: "" },
  type: { type: String, default: "success" }, // 'success' | 'error' | 'info'
  duration: { type: Number, default: 4000 },
});

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const color = computed(() =>
  props.type === "error"
    ? "error"
    : props.type === "success"
      ? "success"
      : "info",
);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      clearTimeout(timer);
      timer = setTimeout(
        () => emit("update:modelValue", false),
        props.duration,
      );
    } else {
      clearTimeout(timer);
    }
  },
);

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <v-snackbar
    v-model="visible"
    :color="color"
    variant="elevated"
    rounded="lg"
    location="bottom center"
    transition="slide-y-reverse-transition"
  >
    <span v-if="type === 'success'" class="mr-2">✔</span>
    <span v-else-if="type === 'error'" class="mr-2">❌</span>
    {{ message }}
    <template #actions>
      <v-btn icon="mdi-close" @click="visible = false"></v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
/* small spacing tweaks if needed */
</style>
