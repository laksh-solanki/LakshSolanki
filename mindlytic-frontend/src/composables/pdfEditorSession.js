import { ref } from "vue";

const selectedPdfFile = ref(null);
const lastUpdatedAt = ref(0);

export const usePdfEditorSession = () => {
  const setPdfForEditing = (file) => {
    selectedPdfFile.value = file || null;
    lastUpdatedAt.value = Date.now();
  };

  const clearPdfForEditing = () => {
    selectedPdfFile.value = null;
    lastUpdatedAt.value = Date.now();
  };

  return {
    selectedPdfFile,
    lastUpdatedAt,
    setPdfForEditing,
    clearPdfForEditing,
  };
};
