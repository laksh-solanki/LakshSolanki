<script setup>
import { computed } from "vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const props = defineProps({
  size: {
    type: Number,
    default: 42,
  },
  showWordmark: {
    type: Boolean,
    default: true,
  },
  variant: {
    type: String,
    default: "default", // default | inverse
  },
});

const markSize = computed(() => `${props.size}px`);
const wordSize = computed(() => `${Math.max(18, Math.round(props.size * 0.52))}px`);
const logoSrc = getMediaUrl("Picture/LS.svg");
</script>

<template>
  <div class="logo-wrap" :class="`variant-${variant}`">
    <img :src="logoSrc" alt="Laksh Solanki Logo" class="logo-glyph" :style="{ width: markSize, height: markSize }" />
    <span v-if="showWordmark" class="brand-name" :style="{ fontSize: wordSize }">
      Laksh <span class="accent">Solanki</span>
    </span>
  </div>
</template>

<style scoped>
.logo-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
}

.logo-glyph {
  display: block;
  border-radius: 10px;
  object-fit: contain;
}

.brand-name {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.03em;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  color: var(--portfolio-ink, #231219);
}

.brand-name .accent {
  color: var(--portfolio-primary, #7C0E44) !important;
}

@media (max-width: 400px) {
  .logo-wrap {
    gap: 6px;
  }
  .logo-glyph {
    width: 34px !important;
    height: 34px !important;
  }
  .brand-name {
    font-size: 1.05rem !important;
    white-space: nowrap;
  }
}

@media (max-width: 340px) {
  .logo-wrap {
    gap: 5px;
  }
  .logo-glyph {
    width: 30px !important;
    height: 30px !important;
  }
  .brand-name {
    font-size: 0.92rem !important;
  }
}
</style>
