<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

// Component Imports
import Alerts from '@/components/Alerts.vue'

// State Management
const pdfFile = ref(null)
const images = ref([])
const isConverting = ref(false)
const conversionProgress = ref(0)
const conversionStatus = ref('')
const imageIdCounter = ref(0)
const pdfName = ref('')
const isDragging = ref(false)

// Template Refs
const fileInput = ref(null)

// Notification State (unified)
const alertVisible = ref(false)
const alertMessage = ref('')
const alertType = ref('success')

const showAlert = (message, type) => {
  alertMessage.value = message
  alertType.value = type === 'error' ? 'error' : 'success'
  alertVisible.value = true
}

// Navigation & File Input
const goBack = () => window.history.back()
const triggerFileInput = () => fileInput.value?.click()

const processSelectedFile = (file) => {
  if (file && file.type === 'application/pdf') {
    pdfFile.value = file
    pdfName.value = file.name
    showAlert('PDF file selected', 'success')
    processPdf()
  } else {
    showAlert('Please select a valid PDF file.', 'error')
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  processSelectedFile(file)
}

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  processSelectedFile(file);
}

// PDF Processing
const processPdf = async () => {
  if (!pdfFile.value) return
  conversionStatus.value = 'Loading PDF...'
  images.value = []

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const typedarray = new Uint8Array(e.target.result)
      const pdf = await pdfjsLib.getDocument(typedarray).promise

      conversionStatus.value = `Found ${pdf.numPages} pages. Converting...`

      for (let i = 1; i <= pdf.numPages; i++) {
        conversionProgress.value = Math.round(((i - 1) / pdf.numPages) * 100)
        conversionStatus.value = `Converting page ${i} of ${pdf.numPages}`

        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }
        await page.render(renderContext).promise

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        const url = URL.createObjectURL(blob)

        images.value.push({
          id: imageIdCounter.value++,
          url: url,
          blob: blob,
          name: `${pdfName.value.replace('.pdf', '')}-page-${i}.png`,
        })
      }
      conversionProgress.value = 100
      showAlert(`PDF converted to [ ${images.value.length}   ] images successfully!`, 'success')
    } catch (error) {
      console.error('Error processing PDF:', error)
      showAlert('Error processing PDF.', 'error')
    } finally {
      setTimeout(() => {
        isConverting.value = false
        conversionProgress.value = 0
      }, 2000)
    }
  }
  reader.readAsArrayBuffer(pdfFile.value)
}

// Image Management
const removeImage = (index) => {
  URL.revokeObjectURL(images.value[index].url)
  images.value.splice(index, 1)
}

const downloadImage = (url, name) => {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const downloadAll = () => {
  const zip = new JSZip()
  images.value.forEach((image) => {
    zip.file(image.name, image.blob)
  })
  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `${pdfName.value.replace('.pdf', '')}-images.zip`)
  })
}

const clearAll = () => {
  images.value.forEach((img) => URL.revokeObjectURL(img.url))
  pdfFile.value = null
  images.value = []
  pdfName.value = ''
  if (fileInput.value) fileInput.value.value = ''
  showAlert('Cleared all data', 'error')
}

// Drag and Drop global handlers
const onDragOver = (e) => e.preventDefault();
const onDrop = (e) => e.preventDefault();

// Lifecycle Hooks
onMounted(() => {
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('drop', onDrop)
});

onUnmounted(() => {
  images.value.forEach((img) => URL.revokeObjectURL(img.url))
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('drop', onDrop)
})
</script>

<template>
  <v-btn @click="goBack" variant="flat" icon="mdi-arrow-left" class="rounded-te rounded-ts rounded-bs"
    color="primary"></v-btn>
  <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />
  <v-container style="min-height: 84.3vh !important">
    <v-card class="text-h5 text-center my-3 pa-4" color="primary-lighten-5" border="primary md opacity-100" rounded="xl"
      flat>
      Convert PDF to Images
    </v-card>

    <!-- Upload Zone -->
    <v-sheet :class="['upload-zone', 'pa-8', { 'drag-over': isDragging }]" rounded="xl" border @click="triggerFileInput()"
      @dragenter.prevent="isDragging = true" @dragover.prevent @dragleave.prevent="isDragging = false" @drop="handleDrop">
      <input ref="fileInput" type="file" accept="application/pdf" @change="handleFileSelect" id="fileInput" class="file-input"
        required />
      <div class="d-flex flex-column align-center justify-center ga-4 text-center">
        <v-icon size="80" color="grey-lighten-1">mdi-cloud-upload-outline</v-icon>
        <div class="text-h6 font-weight-bold text-grey-darken-2">Drag & Drop PDF here</div>
        <div class="text-body-1 text-grey-darken-1">or click to select a file</div>
        <p class="text-caption text-grey-darken-2 mt-2">
          Supports: PDF
        </p>
      </div>
    </v-sheet>

    <!-- Image Gallery -->
    <transition name="slide-up">
      <div v-if="images.length > 0" class="mb-12">
        <div class="d-flex justify-start align-center my-8 ga-1 flex-wrap">
          <v-btn variant="elevated" @click="clearAll" append-icon="mdi-window-close" color="error" rounded="lg">
            Clear All
          </v-btn>
          <v-btn variant="elevated" color="success" rounded="lg" append-icon="mdi mdi-download" @click="downloadAll">
            Download All
          </v-btn>
        </div>

        <v-row dense>
          <v-col v-for="(image, index) in images" :key="image.id" cols="12" sm="6" md="5" lg="4">
            <v-card class="mx-auto" max-width="400" color="primary-lighten-5" border rounded="xl" elevation="5  ">
              <v-card-actions>
                <div class="d-flex justify-end align-center ga-1   w-100">
                  <v-btn @click="removeImage(index)" icon="mdi-close" variant="elevated" color="red" size="small">
                  </v-btn>
                  <v-btn @click="downloadImage(image.url, image.name)" icon="mdi-download" variant="elevated"
                    color="green" size="small">
                  </v-btn>
                </div>
              </v-card-actions>
              <v-img :src="image.url" :alt="image.name" class="align-end text-white img-thumbnail m-2 rounded-4"
                height="200" contain>
              </v-img>
              <v-card-text class="text-center py-4">
                <p class="p-1 m-0">{{ image.name }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </transition>
  </v-container>
</template>

<style>
#fileInput {
  display: none;
}

.file-btn {
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: inline-block;
}

.file-input {
  display: none;
}

.card {
  width: 100%;
  height: 300px;
  margin: 0 auto;
  background-color: #011522 !important;
  color: white !important;
  border-radius: 8px;
  z-index: 1;
}

.tools {
  display: flex;
  align-items: center;
  padding: 9px;
}

.upload-zone-header svg {
  height: 100px;
}

.upload-zone {
  border: 2px dashed rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.05);
  transition: background-color 0.3s ease, border-style 0.3s ease, border-color 0.3s ease, transform 0.2s ease-in-out;
  cursor: pointer;
  text-align: center;
}

.upload-zone:hover {
  transform: scale(1.01);
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-style: solid !important;
}

.upload-zone.drag-over {
  background-color: rgba(var(--v-theme-primary), 0.15);
  border-color: rgb(var(--v-theme-primary));
  border-style: solid;
  transform: scale(1.02);
}

.image-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.hover-card {
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}

@media (max-width: 768px) {
  .upload-zone {
    padding: 40px 20px;
  }
}
</style>
