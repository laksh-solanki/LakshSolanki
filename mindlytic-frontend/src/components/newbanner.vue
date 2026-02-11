<template>
  <div v-if="isVisible" class="relative isolate flex items-center justify-center p-4">
    <div
      class="flex flex-wrap items-center justify-between w-full max-w-5xl gap-x-6 gap-y-3
             bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl
             rounded-2xl px-8 py-4 animate-in fade-in zoom-in duration-500"
    >
      <div class="flex items-center gap-x-3 text-sm leading-6 text-white tracking-tight">
        <span class="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
          New
        </span>
        <p>
          <strong class="font-semibold text-white">Mindlytic 2026</strong>
          <svg viewBox="0 0 2 2" class="mx-2 inline h-0.5 w-0.5 fill-current opacity-30" aria-hidden="true"><circle cx="1" cy="1" r="1" /></svg>
          Experience the next generation of data visualization and serverless analytics.
        </p>
      </div>

      <div class="flex items-center gap-x-5">
        <a
          href="#"
          class="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-gray-900 shadow-sm hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
        >
          Explore Now <span aria-hidden="true" class="ml-1">&rarr;</span>
        </a>

        <button
          @click="isVisible = false"
          type="button"
          class="text-white/40 hover:text-white transition-colors"
        >
          <span class="sr-only">Dismiss</span>
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isVisible = ref(true);
</script>

<style scoped>
/* Optional: Adding a subtle glow effect behind the banner */
.isolate {
  background: radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15) 0%, transparent 50%);
}
</style>
