<script setup>
import { computed, provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ImgPdfPage from "./ImgPdfPage.vue";
import PdfImgPage from "./PdfImgPage.vue";
import PdfQrPage from "./PdfQrPage.vue";

const route = useRoute();
const router = useRouter();

const VALID_MODES = ["img-to-pdf", "pdf-to-img", "pdf-to-qr"];
const resolveValidMode = (mode) =>
  VALID_MODES.includes(mode) ? mode : "img-to-pdf";

const activeTab = ref(resolveValidMode(route.query.mode));

watch(
  () => route.query.mode,
  (newMode) => {
    if (VALID_MODES.includes(newMode)) {
      activeTab.value = newMode;
    }
  },
);

const switchTab = (tab) => {
  activeTab.value = tab;
  router.replace({
    query: {
      ...route.query,
      mode: tab,
    },
  });
};

provide("studioMode", {
  activeTab,
  switchTab,
});

const MODE_COMPONENTS = {
  "img-to-pdf": ImgPdfPage,
  "pdf-to-img": PdfImgPage,
  "pdf-to-qr": PdfQrPage,
};

const currentComponent = computed(
  () => MODE_COMPONENTS[activeTab.value] || ImgPdfPage,
);
</script>

<template>
  <div class="pdf-image-studio">
    <!-- Active Tool View with state preservation -->
    <keep-alive>
      <component :is="currentComponent" />
    </keep-alive>
  </div>
</template>

<style scoped>
.pdf-image-studio {
  width: 100%;
  min-height: 100%;
}
</style>
