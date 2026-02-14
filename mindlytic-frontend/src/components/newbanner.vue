<template>
  <v-slide-y-transition>
    <v-banner
      v-if="isVisible"
      class="relative isolate flex items-center justify-center pa-2 border-0"
    >
      <div
        class="relative flex flex-col sm:flex-row items-center w-full max-w-6xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-6 py-5 sm:py-3 gap-y-4 sm:gap-x-6"
      >
        <div
          class="flex flex-col sm:flex-row items-center gap-y-3 sm:gap-x-4 text-sm leading-6 text-white text-center sm:text-left flex-1"
        >
          <span
            class="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20"
          >
            New
          </span>
          <p class="tracking-tight">
            <strong class="font-semibold text-white">Mindlytic 2026</strong>
            <span class="hidden sm:inline mx-2 opacity-30">|</span>
            <span class="block sm:inline opacity-80 mt-1 sm:mt-0">
              Experience the next generation of data visualization and
              serverless analytics.
            </span>
          </p>
        </div>

        <div class="flex items-center gap-x-4 w-full sm:w-auto justify-center">
          <a
            href="/about"
            class="whitespace-nowrap rounded-lg bg-white px-6 py-2 text-sm font-bold text-gray-900 shadow-sm hover:bg-gray-100 transition-all active:scale-95"
          >
            Explore Now
          </a>

          <button
            @click="isVisible = false"
            type="button"
            class="absolute top-4 right-4 sm:static text-white/40 hover:text-white transition-colors p-1"
          >
            <span class="sr-only">Dismiss</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>
      </div>
    </v-banner>
  </v-slide-y-transition>
</template>

<script setup>
// Library Imports
import { ref } from "vue";
// State & Refs
const isVisible = ref(true);
</script>

<style scoped>
.isolate {
  /* Slightly wider gradient for a smoother desktop look */
  background: radial-gradient(
    circle at 50% 50%,
    rgba(79, 70, 229, 0.12) 0%,
    transparent 80%
  ) !important;
}
</style>
