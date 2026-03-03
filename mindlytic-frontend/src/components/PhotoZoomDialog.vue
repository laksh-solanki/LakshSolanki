<template>
  <div class="photo-zoom-root">
    <v-avatar
      :size="size"
      :class="['photo-trigger', avatarClass]"
      role="button"
      tabindex="0"
      aria-label="Open profile photo"
      @click="openDialog"
      @keydown.enter.prevent="openDialog"
      @keydown.space.prevent="openDialog"
    >
      <v-img :src="src" :alt="alt" cover></v-img>
    </v-avatar>

    <v-dialog v-model="dialogOpen" max-width="980">
      <v-card class="zoom-card" rounded="xl">
        <div class="zoom-toolbar px-4 py-3">
          <p class="text-subtitle-2 font-weight-bold mb-0">{{ alt }}</p>
          <div class="d-flex ga-1">
            <v-btn icon="mdi-magnify-minus-outline" variant="text" density="comfortable" @click="zoomOut" :disabled="zoomLevel <= 1"></v-btn>
            <v-btn icon="mdi-refresh" variant="text" density="comfortable" @click="resetZoom" :disabled="zoomLevel === 1"></v-btn>
            <v-btn icon="mdi-magnify-plus-outline" density="comfortable" variant="text" @click="zoomIn" :disabled="zoomLevel >= 3"></v-btn>
            <v-btn icon="mdi-close" density="comfortable" variant="text" @click="dialogOpen = false"></v-btn>
          </div>
        </div>

        <div class="zoom-stage">
          <img :src="src" :alt="alt" class="zoom-image" :style="{ transform: `scale(${zoomLevel})` }" />
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: "Profile photo",
  },
  size: {
    type: [Number, String],
    default: 120,
  },
  avatarClass: {
    type: [String, Array, Object],
    default: "",
  },
});

const dialogOpen = ref(false);
const zoomLevel = ref(1);

const openDialog = () => {
  zoomLevel.value = 1;
  dialogOpen.value = true;
};

const zoomIn = () => {
  zoomLevel.value = Math.min(3, Number((zoomLevel.value + 0.25).toFixed(2)));
};

const zoomOut = () => {
  zoomLevel.value = Math.max(1, Number((zoomLevel.value - 0.25).toFixed(2)));
};

const resetZoom = () => {
  zoomLevel.value = 1;
};

watch(dialogOpen, (isOpen) => {
  if (!isOpen) zoomLevel.value = 1;
});
</script>

<style scoped>
.photo-trigger {
  cursor: zoom-in;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-trigger:hover {
  transform: translateY(-2px);
}

.zoom-card {
  overflow: hidden;
  background: #f5faf8;
}

.zoom-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(19, 111, 99, 0.18);
  background: linear-gradient(120deg, #ffffff 0%, #ecf6f1 100%);
}

.zoom-stage {
  min-height: min(76vh, 760px);
  max-height: min(76vh, 760px);
  overflow: auto;
  padding: 22px;
  background:
    radial-gradient(circle at 12% 10%, rgba(84, 214, 192, 0.18), transparent 34%),
    linear-gradient(150deg, #f7fffb, #edf8f3);
  display: grid;
  place-items: center;
}

.zoom-image {
  width: auto;
  max-width: 100%;
  max-height: min(66vh, 680px);
  border-radius: 14px;
  border: 1px solid rgba(19, 111, 99, 0.22);
  box-shadow: 0 16px 30px rgba(12, 35, 31, 0.18);
  transform-origin: center center;
  transition: transform 0.2s ease;
}
</style>
