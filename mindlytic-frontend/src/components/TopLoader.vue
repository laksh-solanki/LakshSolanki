<template>
  <div v-if="isVisible" class="loader-container">
    <div class="loader-bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const progress = ref(0);
const isVisible = ref(false);
let interval = null;

const start = () => {
  isVisible.value = true;
  progress.value = 0;

  // Trickle effect: moves fast at first, then slows down
  interval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 10;
    }
  }, 200);
};

const finish = () => {
  progress.value = 100;
  setTimeout(() => {
    isVisible.value = false;
    clearInterval(interval);
  }, 300); // Wait for the "100%" animation to finish
};

// Expose methods to be used by the router
defineExpose({ start, finish });
</script>

<style scoped>
.loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3%;
  z-index: 9999;
}

.loader-bar {
  height: 100%;
  background: #4248b8;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px #4248b8, 0 0 20px #4248b8;
}
</style>
