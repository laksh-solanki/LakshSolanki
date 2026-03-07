<template>
  <div class="photo-zoom-root">
    <slot v-if="$slots.trigger" name="trigger" :open-dialog="openDialog"></slot>

    <template v-else-if="!hideTrigger">
      <v-avatar
        v-if="triggerVariant === 'avatar'"
        :size="size"
        :class="['photo-trigger', avatarClass, triggerClass]"
        role="button"
        tabindex="0"
        :aria-label="triggerAriaLabel"
        @click="openDialog"
        @keydown.enter.prevent="openDialog"
        @keydown.space.prevent="openDialog"
      >
        <v-img :src="src" :alt="alt" :cover="imgCover"></v-img>
      </v-avatar>

      <button
        v-else
        type="button"
        :class="['image-trigger', triggerClass]"
        :aria-label="triggerAriaLabel"
        @click="openDialog"
      >
        <v-img
          :src="src"
          :alt="alt"
          :height="imageHeight"
          :cover="imgCover"
          :class="imageClass"
        ></v-img>
      </button>
    </template>

    <v-dialog v-model="dialogOpen" :max-width="maxWidth" :fullscreen="$vuetify.display.xs && fullscreenOnMobile">
      <v-card class="zoom-card" :class="{ 'is-custom-card': isCustomMode }" rounded="xl">
        <div class="zoom-toolbar px-4 py-3">
          <p class="text-subtitle-2 font-weight-bold mb-0">{{ dialogLabel }}</p>
          <div class="d-flex align-center ga-1 flex-wrap justify-end">
            <slot name="toolbar-actions" :close-dialog="closeDialog"></slot>
            <v-btn
              icon="mdi-magnify-minus-outline"
              variant="text"
              density="comfortable"
              @click="zoomOut"
              :disabled="zoomLevel <= 1"
            ></v-btn>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              density="comfortable"
              @click="resetZoom"
              :disabled="zoomLevel === 1"
            ></v-btn>
            <v-btn
              icon="mdi-magnify-plus-outline"
              density="comfortable"
              variant="text"
              @click="zoomIn"
              :disabled="zoomLevel >= 3"
            ></v-btn>
            <v-btn icon="mdi-close" density="comfortable" variant="text" @click="closeDialog"></v-btn>
          </div>
        </div>

        <div
          ref="zoomStage"
          class="zoom-stage"
          :class="{ 'is-zoomed': zoomLevel > 1, 'is-dragging': isDragging, 'is-custom-stage': isCustomMode }"
          tabindex="0"
          @pointerdown="startPan"
          @pointermove="onPanMove"
          @pointerup="stopPan"
          @pointercancel="stopPan"
          @pointerleave="stopPan"
          @keydown="handleStageKeydown"
        >
          <img
            v-if="!isCustomMode"
            ref="zoomImage"
            :src="src"
            :alt="alt"
            class="zoom-image"
            :class="{ 'is-sized': hasBaseImageSize }"
            :style="zoomImageStyle"
            draggable="false"
            @dragstart.prevent
            @load="handleImageLoad"
          />

          <div
            v-else
            ref="zoomContent"
            class="zoom-custom-content"
            :class="{ 'is-sized': hasBaseContentSize }"
            :style="zoomContentStyle"
          >
            <div
              ref="zoomContentInner"
              class="zoom-custom-content-inner"
              :style="zoomContentInnerStyle"
            >
              <slot></slot>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  src: {
    type: String,
    default: "",
  },
  alt: {
    type: String,
    default: "Profile photo",
  },
  dialogTitle: {
    type: String,
    default: "",
  },
  size: {
    type: [Number, String],
    default: 120,
  },
  avatarClass: {
    type: [String, Array, Object],
    default: "",
  },
  triggerClass: {
    type: [String, Array, Object],
    default: "",
  },
  imageClass: {
    type: [String, Array, Object],
    default: "",
  },
  triggerVariant: {
    type: String,
    default: "avatar",
  },
  imageHeight: {
    type: [Number, String],
    default: null,
  },
  imgCover: {
    type: Boolean,
    default: true,
  },
  hideTrigger: {
    type: Boolean,
    default: false,
  },
  contentMode: {
    type: String,
    default: "image",
  },
  maxWidth: {
    type: [Number, String],
    default: 980,
  },
  contentWidth: {
    type: Number,
    default: 0,
  },
  contentHeight: {
    type: Number,
    default: 0,
  },
  fullscreenOnMobile: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const internalDialogOpen = ref(false);
const zoomLevel = ref(1);
const zoomStage = ref(null);
const zoomImage = ref(null);
const zoomContent = ref(null);
const zoomContentInner = ref(null);
const naturalImageSize = ref({ width: 0, height: 0 });
const baseImageSize = ref({ width: 0, height: 0 });
const naturalContentSize = ref({ width: 0, height: 0 });
const baseContentSize = ref({ width: 0, height: 0 });
const isDragging = ref(false);
const activePointerId = ref(null);
const panOrigin = ref({
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0,
});

const isControlled = computed(() => props.modelValue !== undefined);
const isCustomMode = computed(() => props.contentMode === "custom");
const triggerAriaLabel = computed(() => `Open ${props.alt || "image"}`);
const dialogLabel = computed(() => props.dialogTitle || props.alt || "Preview");
const hasBaseImageSize = computed(
  () => baseImageSize.value.width > 0 && baseImageSize.value.height > 0,
);
const hasBaseContentSize = computed(
  () => baseContentSize.value.width > 0 && baseContentSize.value.height > 0,
);
const dialogOpen = computed({
  get: () => (isControlled.value ? props.modelValue : internalDialogOpen.value),
  set: (value) => {
    if (!isControlled.value) {
      internalDialogOpen.value = value;
    }

    emit("update:modelValue", value);
  },
});

const zoomImageStyle = computed(() => {
  if (!hasBaseImageSize.value) return {};

  return {
    width: `${Math.round(baseImageSize.value.width * zoomLevel.value)}px`,
    height: `${Math.round(baseImageSize.value.height * zoomLevel.value)}px`,
  };
});

const zoomContentStyle = computed(() => {
  if (!hasBaseContentSize.value) return {};

  return {
    width: `${Math.round(baseContentSize.value.width * zoomLevel.value)}px`,
    height: `${Math.round(baseContentSize.value.height * zoomLevel.value)}px`,
  };
});

const zoomContentInnerStyle = computed(() => {
  if (!hasBaseContentSize.value || !naturalContentSize.value.width || !naturalContentSize.value.height) {
    return {};
  }

  const scale = (baseContentSize.value.width * zoomLevel.value) / naturalContentSize.value.width;

  return {
    width: `${naturalContentSize.value.width}px`,
    height: `${naturalContentSize.value.height}px`,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };
});

const closeDialog = () => {
  dialogOpen.value = false;
};

const focusStage = () => {
  zoomStage.value?.focus({ preventScroll: true });
};

const centerStage = () => {
  const stageElement = zoomStage.value;
  if (!stageElement) return;

  stageElement.scrollLeft = Math.max(
    0,
    (stageElement.scrollWidth - stageElement.clientWidth) / 2,
  );
  stageElement.scrollTop = Math.max(
    0,
    (stageElement.scrollHeight - stageElement.clientHeight) / 2,
  );
};

const getScaledSize = (naturalWidth, naturalHeight) => {
  const stageElement = zoomStage.value;
  if (!stageElement || !naturalWidth || !naturalHeight) return { width: 0, height: 0 };

  const stagePadding = isCustomMode.value ? 30 : 44;
  const availableWidth = Math.max(stageElement.clientWidth - stagePadding, 120);
  const availableHeight = Math.max(stageElement.clientHeight - stagePadding, 120);
  const scale = Math.min(
    availableWidth / naturalWidth,
    availableHeight / naturalHeight,
    1,
  );

  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
};

const updateBaseImageSize = () => {
  if (!naturalImageSize.value.width || !naturalImageSize.value.height) return;
  baseImageSize.value = getScaledSize(naturalImageSize.value.width, naturalImageSize.value.height);
};

const updateBaseContentSize = () => {
  if (!naturalContentSize.value.width || !naturalContentSize.value.height) return;
  baseContentSize.value = getScaledSize(naturalContentSize.value.width, naturalContentSize.value.height);
};

const syncZoom = async (nextZoomLevel) => {
  const stageElement = zoomStage.value;
  const previousZoomLevel = zoomLevel.value;

  if (!stageElement || nextZoomLevel === previousZoomLevel) {
    zoomLevel.value = nextZoomLevel;
    return;
  }

  const centerXRatio =
    stageElement.scrollWidth > 0
      ? (stageElement.scrollLeft + stageElement.clientWidth / 2) / stageElement.scrollWidth
      : 0.5;
  const centerYRatio =
    stageElement.scrollHeight > 0
      ? (stageElement.scrollTop + stageElement.clientHeight / 2) / stageElement.scrollHeight
      : 0.5;

  zoomLevel.value = nextZoomLevel;
  await nextTick();

  stageElement.scrollLeft = Math.max(
    0,
    stageElement.scrollWidth * centerXRatio - stageElement.clientWidth / 2,
  );
  stageElement.scrollTop = Math.max(
    0,
    stageElement.scrollHeight * centerYRatio - stageElement.clientHeight / 2,
  );

  focusStage();
};

const handleImageLoad = async (event) => {
  naturalImageSize.value = {
    width: event.target?.naturalWidth || 0,
    height: event.target?.naturalHeight || 0,
  };

  await nextTick();
  updateBaseImageSize();
  centerStage();
};

const measureCustomContent = async () => {
  if (!isCustomMode.value) return;

  if (props.contentWidth > 0 && props.contentHeight > 0) {
    naturalContentSize.value = {
      width: props.contentWidth,
      height: props.contentHeight,
    };
    return;
  }

  await nextTick();
  const contentElement = zoomContentInner.value;
  if (!contentElement) return;

  const previousWidth = zoomContent.value?.style.width;
  const previousHeight = zoomContent.value?.style.height;

  if (zoomContent.value) {
    zoomContent.value.style.width = "";
    zoomContent.value.style.height = "";
  }

  await nextTick();

  const rect = contentElement.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    naturalContentSize.value = {
      width: rect.width,
      height: rect.height,
    };
  }

  if (zoomContent.value && zoomLevel.value > 1) {
    zoomContent.value.style.width = previousWidth || "";
    zoomContent.value.style.height = previousHeight || "";
  }
};

const openDialog = () => {
  zoomLevel.value = 1;
  dialogOpen.value = true;
};

const zoomIn = () => {
  syncZoom(Math.min(3, Number((zoomLevel.value + 0.25).toFixed(2))));
};

const zoomOut = () => {
  syncZoom(Math.max(1, Number((zoomLevel.value - 0.25).toFixed(2))));
};

const resetZoom = () => {
  syncZoom(1);
};

const startPan = (event) => {
  if (zoomLevel.value <= 1 || event.button !== 0 || !zoomStage.value) return;

  activePointerId.value = event.pointerId;
  isDragging.value = true;
  panOrigin.value = {
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: zoomStage.value.scrollLeft,
    scrollTop: zoomStage.value.scrollTop,
  };

  zoomStage.value.setPointerCapture?.(event.pointerId);
  event.preventDefault();
};

const onPanMove = (event) => {
  if (
    !isDragging.value ||
    activePointerId.value === null ||
    event.pointerId !== activePointerId.value ||
    !zoomStage.value
  ) {
    return;
  }

  zoomStage.value.scrollLeft =
    panOrigin.value.scrollLeft - (event.clientX - panOrigin.value.startX);
  zoomStage.value.scrollTop =
    panOrigin.value.scrollTop - (event.clientY - panOrigin.value.startY);

  event.preventDefault();
};

const stopPan = (event) => {
  if (!isDragging.value || !zoomStage.value) return;

  if (
    event?.pointerId !== undefined &&
    activePointerId.value !== null &&
    event.pointerId !== activePointerId.value
  ) {
    return;
  }

  if (activePointerId.value !== null) {
    zoomStage.value.releasePointerCapture?.(activePointerId.value);
  }

  isDragging.value = false;
  activePointerId.value = null;
};

const handleStageKeydown = (event) => {
  if (zoomLevel.value <= 1 || !zoomStage.value) return;

  const panAmount = event.shiftKey ? 160 : 80;

  switch (event.key) {
    case "ArrowLeft":
      zoomStage.value.scrollLeft -= panAmount;
      break;
    case "ArrowRight":
      zoomStage.value.scrollLeft += panAmount;
      break;
    case "ArrowUp":
      zoomStage.value.scrollTop -= panAmount;
      break;
    case "ArrowDown":
      zoomStage.value.scrollTop += panAmount;
      break;
    default:
      return;
  }

  event.preventDefault();
};

const resetMeasuredState = () => {
  baseImageSize.value = { width: 0, height: 0 };
  naturalImageSize.value = { width: 0, height: 0 };
  baseContentSize.value = { width: 0, height: 0 };
  naturalContentSize.value = { width: 0, height: 0 };
};

const handleWindowResize = async () => {
  if (!dialogOpen.value) return;

  await nextTick();

  if (isCustomMode.value) {
    if (!naturalContentSize.value.width || !naturalContentSize.value.height) {
      await measureCustomContent();
    }
    updateBaseContentSize();
  } else {
    updateBaseImageSize();
  }

  if (zoomLevel.value === 1) {
    centerStage();
  }
};

watch(dialogOpen, async (isOpen) => {
  if (!isOpen) {
    zoomLevel.value = 1;
    resetMeasuredState();
    isDragging.value = false;
    activePointerId.value = null;
    return;
  }

  await nextTick();

  if (isCustomMode.value) {
    await measureCustomContent();
    updateBaseContentSize();
  } else if (zoomImage.value?.complete && zoomImage.value.naturalWidth) {
    naturalImageSize.value = {
      width: zoomImage.value.naturalWidth,
      height: zoomImage.value.naturalHeight,
    };
    updateBaseImageSize();
  }

  centerStage();
  focusStage();
});

watch(isCustomMode, () => {
  zoomLevel.value = 1;
  resetMeasuredState();
});

onMounted(() => {
  window.addEventListener("resize", handleWindowResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleWindowResize);
});
</script>

<style scoped>
.photo-trigger {
  cursor: zoom-in;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-trigger {
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: zoom-in;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-trigger:hover,
.image-trigger:hover {
  transform: translateY(-2px);
}

.zoom-card {
  overflow: hidden;
  border: 1px solid rgba(76, 207, 183, 0.16);
  background: linear-gradient(165deg, rgba(18, 38, 35, 0.98), rgba(8, 20, 18, 0.98));
}

.zoom-card.is-custom-card {
  background: linear-gradient(165deg, rgba(16, 31, 29, 0.98), rgba(7, 16, 15, 0.98));
}

.zoom-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(76, 207, 183, 0.14);
  background: linear-gradient(120deg, rgba(20, 41, 37, 0.98), rgba(9, 22, 20, 0.98));
}

.zoom-stage {
  min-height: min(80vh, 860px);
  max-height: min(80vh, 860px);
  overflow: auto;
  padding: 22px;
  background:
    radial-gradient(circle at 12% 10%, rgba(84, 214, 192, 0.16), transparent 34%),
    linear-gradient(150deg, rgba(12, 28, 25, 0.98), rgba(5, 14, 13, 0.98));
  display: grid;
  place-items: center;
  cursor: default;
  outline: none;
}

.zoom-stage.is-custom-stage {
  padding: 18px;
}

.zoom-image,
.zoom-custom-content {
  width: auto;
  max-width: 100%;
  max-height: min(70vh, 760px);
  border-radius: 14px;
  border: 1px solid rgba(76, 207, 183, 0.18);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.26);
  transition: width 0.2s ease, height 0.2s ease;
  user-select: none;
  flex: none;
}

.zoom-custom-content {
  overflow: hidden;
  background: #ffffff;
}

.zoom-custom-content-inner {
  width: max-content;
  height: max-content;
}

.zoom-image.is-sized,
.zoom-custom-content.is-sized {
  max-width: none;
  max-height: none;
}

.zoom-stage.is-zoomed {
  cursor: grab;
}

.zoom-stage.is-dragging {
  cursor: grabbing;
}

.zoom-stage.is-dragging .zoom-image,
.zoom-stage.is-dragging .zoom-custom-content {
  pointer-events: none;
}

@media (max-width: 600px) {
  .zoom-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .zoom-stage {
    min-height: 100dvh;
    max-height: 100dvh;
    padding: 14px;
  }
}
</style>
