<script setup>
import { computed } from "vue";
import logoSrc from "@/assets/Picture/mindlytic.svg";

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
</script>

<template>
  <div class="logo-wrap" :class="`variant-${variant}`">
    <img
      :src="logoSrc"
      alt="Mindlytic Logo"
      class="logo-glyph"
      :style="{ width: markSize, height: markSize }"
    />
    <span v-if="showWordmark" class="brand-name" :style="{ fontSize: wordSize }">
      Mind<span class="accent">lytic</span>
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
  filter: drop-shadow(0 6px 12px rgba(12, 55, 48, 0.2));
}

.brand-name {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.03em;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  color: #10231f;
}

.accent {
  color: #136f63;
}

.variant-inverse .brand-name {
  color: #f5fffc;
}

.variant-inverse .accent {
  color: #86e6d3;
}
</style>
