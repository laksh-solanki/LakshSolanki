<script setup>
import { ref, onUnmounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

// Component Imports
import RedAlert from '@/components/Red-alert.vue'
import GreenAlert from '@/components/Green-alert.vue'

// State Management
const pdfFile = ref(null)
const images = ref([])
const isConverting = ref(false)
const conversionProgress = ref(0)
const conversionStatus = ref('')
const imageIdCounter = ref(0)
const pdfName = ref('')

// Template Refs
const fileInput = ref(null)

// Notification State
const successAlert = ref(false)
const successMessage = ref('')
const errorAlert = ref(false)
const errorMessage = ref('')

let successTimeout = null
let errorTimeout = null

// Alert Logic
const showAlert = (message, type) => {
  if (type === 'success') {
    successMessage.value = message
    successAlert.value = true
    clearTimeout(successTimeout)
    successTimeout = setTimeout(() => {
      successAlert.value = false
    }, 4000)
  } else {
    errorMessage.value = message
    errorAlert.value = true
    clearTimeout(errorTimeout)
    errorTimeout = setTimeout(() => {
      errorAlert.value = false
    }, 4000)
  }
}

// Navigation & File Input
const goBack = () => window.history.back()
const triggerFileInput = () => fileInput.value?.click()

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    pdfFile.value = file
    pdfName.value = file.name
    showAlert('PDF file selected', 'success')
    processPdf()
  } else {
    showAlert('Please select a valid PDF file.', 'error')
  }
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
      showAlert('PDF converted to images successfully!', 'success')
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

// Lifecycle Hooks
onUnmounted(() => {
  images.value.forEach((img) => URL.revokeObjectURL(img.url))
  clearTimeout(successTimeout)
  clearTimeout(errorTimeout)
})
</script>

<template>
  <v-btn @click="goBack" variant="flat" icon="mdi-arrow-left" class="rounded-te rounded-ts rounded-bs"
    color="primary"></v-btn>
  <GreenAlert v-model:successAlert="successAlert" :successMessage="successMessage" />
  <RedAlert v-model:errorAlert="errorAlert" :errorMessage="errorMessage" />
  <v-container style="min-height: 84.3vh !important">
    <v-card class="text-h5 text-center my-3 pa-4" color="primary-lighten-5" border="primary lg opacity-25" rounded="xl"
      flat>
      Convert PDF to Images
    </v-card>

    <!-- Upload Zone -->
    <v-sheet class="pa-8 border-double" rounded="xl" border="primary xl opacity-25" @click="triggerFileInput()">
      <input ref="fileInput" type="file" accept="application/pdf" @change="handleFileSelect" class="file-input"
        required />
      <div class="text-center">
        <div class="upload-zone-header">
          <v-icon size="100" class="text-primary-emphasis">mdi-upload-circle</v-icon>
          <p>Browse File to upload!</p>
        </div>
        <h3 class="text-2xl font-semibold mb-2 text-slate-800">
          Drop a PDF here or click to browse
        </h3>
        <p class="text-slate-600 mb-4">Supports PDF files</p>
        <v-btn variant="outlined" class="text-primary-emphasis bg-primary-subtle border-primary-subtle rounded-3">
          Choose File
        </v-btn>
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
            <v-card class="mx-auto" max-width="400" color="primary-lighten-5" border rounded="lg">
              <v-card-actions>
                <div class="d-flex justify-end align-center ga-1   w-100">
                  <v-btn @click="removeImage(index)" icon="mdi-close" variant="elevated" color="red" size="small">
                  </v-btn>
                  <v-btn @click="downloadImage(image.url, image.name)" icon="mdi-download" variant="elevated" color="green"
                    size="small">
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

    <!-- Progress Section -->
    <transition name="fade">
      <div class="card" v-if="isConverting">
        <div class="tools">
          <div class="circle">
            <span class="red box"></span>
          </div>
          <div class="circle">
            <span class="yellow box"></span>
          </div>
          <div class="circle">
            <span class="green box"></span>
          </div>
        </div>
        <div class="card-content p-3">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-800">Converting to Images...</h3>
            <span class="text-sm text-slate-600">{{ conversionProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-gradient-to-r from-teal-500 to-amber-500 h-3 rounded-full transition-all duration-300"
              :style="{ width: conversionProgress + '%' }"></div>
          </div>
          <p class="text-sm text-slate-600 mt-2">{{ conversionStatus }}</p>
        </div>
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

.circle {
  padding: 0 4px;
}

.box {
  display: inline-block;
  align-items: center;
  width: 10px;
  height: 10px;
  padding: 1px;
  border-radius: 50%;
}

.red {
  background-color: #ff605c;
}

.yellow {
  background-color: #ffbd44;
}

.green {
  background-color: #00ca4e;
}

.upload-zone-header svg {
  height: 100px;
}

.btn-css {
  border-start-start-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
  border-top-right-radius: 0% !important;
}

.upload-zone {
  border: 3px dashed royalblue;
  padding: 35px 40px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-zone:hover {
  border-color: black !important;
  color: var(--bs-primary-text-emphasis) !important;
  background-color: rgb(207 226 255) !important;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
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
</style>
