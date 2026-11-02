<template>
  <div v-if="isVisible" class="loader-container">
    <div class="loader-bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const progress = ref(0);
const isVisible = ref(false);
let interval = null;

const start = () => {
  isVisible.value = true;
  progress.value = 0;

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
  }, 300);
};

defineExpose({ start, finish });
</script>

<style scoped>
.loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 9999;
}

.loader-bar {
  height: 100%;
  background: linear-gradient(90deg, #7C0E44, #AA5E7A);
  transition: width 0.3s ease;
}
</style>
