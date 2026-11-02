<script setup>
import { provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ImgPdfPage from "./ImgPdfPage.vue";
import PdfImgPage from "./PdfImgPage.vue";

const route = useRoute();
const router = useRouter();

const activeTab = ref(
  route.query.mode === "pdf-to-img" ? "pdf-to-img" : "img-to-pdf",
);

watch(
  () => route.query.mode,
  (newMode) => {
    if (newMode === "pdf-to-img" || newMode === "img-to-pdf") {
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
</script>

<template>
  <div class="pdf-image-studio">
    <!-- Active Tool View with state preservation -->
    <keep-alive>
      <component :is="activeTab === 'img-to-pdf' ? ImgPdfPage : PdfImgPage" />
    </keep-alive>
  </div>
</template>

<style scoped>
.pdf-image-studio {
  width: 100%;
  min-height: 100%;
}
</style>
