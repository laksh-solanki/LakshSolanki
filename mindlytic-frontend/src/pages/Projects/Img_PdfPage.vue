<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { jsPDF } from 'jspdf'

// Component Imports
import RedAlert from '@/components/Red-alert.vue'
import GreenAlert from '@/components/Green-alert.vue'

// State Management
const images = ref([])
const isConverting = ref(false)
const conversionProgress = ref(0)
const conversionStatus = ref('')
const imageIdCounter = ref(0)

// Template Refs
const fileInput = ref(null)
const addMoreInput = ref(null)

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
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    showAlert(`${files.length} file(s) added`, 'success')
    processFiles(files)
  }
}

const processFiles = (files) => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length === 0) {
    showAlert('Please select valid image files.', 'error')
    return
  }

  imageFiles.forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      images.value.push({
        id: imageIdCounter.value++,
        file: file,
        url: e.target.result,
        name: file.name,
        size: file.size,
        type: file.type,
      })
    }
    reader.readAsDataURL(file)
  })
}

// List Management
const removeImage = (index) => images.value.splice(index, 1)

const moveUp = (index) => {
  if (index > 0) {
    const temp = images.value[index]
    images.value.splice(index, 1)
    images.value.splice(index - 1, 0, temp)
  }
}

const moveDown = (index) => {
  if (index < images.value.length - 1) {
    const temp = images.value[index]
    images.value.splice(index, 1)
    images.value.splice(index + 1, 0, temp)
  }
}

const clearAll = () => {
  images.value = []
  if (fileInput.value) fileInput.value.value = ''
  if (addMoreInput.value) addMoreInput.value.value = ''
  showAlert('All images cleared', 'error')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const addImageToPDF = (pdf, image, addPage) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (addPage) pdf.addPage()

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 5

      const availableWidth = pageWidth - 2 * margin
      const availableHeight = pageHeight - 2 * margin

      let imgWidth = img.width
      let imgHeight = img.height

      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight, 1)

      imgWidth *= scale
      imgHeight *= scale

      const x = (pageWidth - imgWidth) / 2
      const y = (pageHeight - imgHeight) / 2

      const format = image.type === 'image/jpeg' ? 'JPEG' : 'PNG'
      pdf.addImage(img, format, x, y, imgWidth, imgHeight)
      resolve()
    }
    img.onerror = () => reject(new Error(`Failed to load ${image.name}`))
    img.src = image.url
  })
}

// Drag and Drop Handlers (Placeholder logic to prevent errors)
const onDragOver = (e) => e.preventDefault()
const onDrop = (e) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  processFiles(files)
}

onMounted(() => {
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('drop', onDrop)
})

onUnmounted(() => {
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('drop', onDrop)
  clearTimeout(successTimeout)
  clearTimeout(errorTimeout)
})

const orientation = ref('p')
const generatePdfWithOrientation = async () => {
  if (images.value.length === 0) {
    showAlert('Please add some images first.', 'error')
    return
  }

  isConverting.value = true
  conversionProgress.value = 0
  conversionStatus.value = 'Initializing PDF document...'

  try {
    const pdf = new jsPDF({
      orientation: orientation.value,
      unit: 'mm',
      format: 'a4',
    })

    const totalImages = images.value.length

    for (let i = 0; i < totalImages; i++) {
      const image = images.value[i]
      conversionStatus.value = `Processing image ${i + 1} of ${totalImages}`
      conversionProgress.value = Math.round(((i + 1) / totalImages) * 95)
      await addImageToPDF(pdf, image, i > 0)
    }

    conversionStatus.value = 'Finalizing PDF...'
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const orientationName = orientation.value === 'p' ? 'portrait' : 'landscape'
    pdf.save(`images-to-pdf-${orientationName}-${timestamp}.pdf`)

    conversionProgress.value = 100
    showAlert('PDF generated successfully!', 'success')
  } catch (error) {
    console.error('PDF generation error:', error)
    showAlert('Error generating PDF.', 'error')
  } finally {
    setTimeout(() => {
      isConverting.value = false
      conversionProgress.value = 0
    }, 2000)
  }
}

const setOrientation = (layout) => {
  orientation.value = layout
  showAlert(`Layout set to ${layout === 'p' ? 'Portrait' : 'Landscape'}`, 'success')
}
</script>
<template>
  <v-btn
    @click="goBack"
    variant="flat"
    icon="mdi-arrow-left"
    class="btn-css text-primary-emphasis bg-primary-subtle border border-primary-subtle"
  ></v-btn>
  <GreenAlert v-model:successAlert="successAlert" :successMessage="successMessage" />
  <RedAlert v-model:errorAlert="errorAlert" :errorMessage="errorMessage" />
  <v-container style="min-height: 84.3vh !important">
    <v-card
      class="text-h5 mb-3 p-3 text-center text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-4"
    >
      Convert Images to PDF
    </v-card>

    <!-- Upload Zone -->
    <v-container fluid>
      <div class="upload-zone rounded-4" @click="triggerFileInput()">
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          @change="handleFileSelect"
          class="file-input"
          required
        />
        <div class="text-center">
          <div class="upload-zone-header">
            <v-icon size="100" class="text-primary-emphasis">mdi-upload-circle</v-icon>
            <p>Browse File to upload!</p>
          </div>
          <h3 class="text-2xl font-semibold mb-2 text-slate-800">
            Drop images here or click to browse
          </h3>
          <p class="text-slate-600 mb-4">Supports JPG, PNG, GIF, and WebP formats</p>
          <v-btn
            variant="outlined"
            class="text-primary-emphasis bg-primary-subtle border-primary-subtle rounded-3"
          >
            Choose Files
          </v-btn>
        </div>
      </div>
    </v-container>

    <!-- Image Gallery -->
    <transition name="slide-up">
      <div v-if="images.length > 0" class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <div
            class="text-h6 font-bold p-3 text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-3"
          >
            Uploaded Images <v-icon>mdi-menu-right</v-icon> {{ images.length }}
          </div>
          <div class="d-flex justify-content-start align-content-center mt-4 gap-1 flex-wrap">
            <v-btn
              variant="outlined"
              @click="clearAll"
              append-icon="mdi-window-close"
              class="text-danger-emphasis bg-danger-subtle border border-danger-subtle rounded-3"
            >
              Clear All
            </v-btn>
            <v-btn
              variant="outlined"
              append-icon="mdi mdi-file-pdf-box"
              class="text-success-emphasis bg-success-subtle border border-success-subtle rounded-3"
              @click="generatePdfWithOrientation"
              :disabled="isConverting || images.length === 0"
            >
              {{ isConverting ? 'Converting...' : 'Download PDF' }}
            </v-btn>
            <v-label
              class="px-3 text-center opacity-100 align-content-center text-black bg-primary-subtle border border-primary-subtle rounded-3"
              text="Add More"
              v-ripple
            >
              <v-file-input
                ref="addMoreInput"
                type="file"
                hide-input
                class="opacity-100 text-black"
                multiple
                prepend-icon="mdi-plus"
                accept="image/*"
                @change="handleFileSelect"
                hide-details
              />
            </v-label>

            <div class="dropdown">
              <v-btn
                append-icon="mdi-menu-down"
                class="text-info-emphasis bg-info-subtle border border-info-subtle dropdown-toggle rounded-2"
                variant="outlined"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Size
              </v-btn>
              <ul class="dropdown-menu bg-info-subtle border-info-subtle">
                <li>
                  <button
                    class="dropdown-item px-4 py-2 rounded"
                    type="button"
                    @click="setOrientation('p')"
                    :class="{
                      'text-blue': orientation === 'p',
                      'bg-gray-200': orientation !== 'p',
                    }"
                  >
                    Portrait
                  </button>
                </li>
                <li>
                  <button
                    class="dropdown-item px-4 py-2 rounded"
                    type="button"
                    @click="setOrientation('l')"
                    :class="{
                      'text-blue': orientation === 'l',
                      'bg-gray-200': orientation !== 'l',
                    }"
                  >
                    Landscape
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <v-row dense>
          <v-col v-for="(image, index) in images" :key="image.id" cols="12" sm="6" md="5" lg="4">
            <v-card
              class="mx-auto text-primary-emphasis bg-primary-subtle border-1 border-black rounded-4"
              max-width="400"
            >
              <v-img
                :src="image.url"
                :alt="image.name"
                class="align-end text-white img-thumbnail m-2 rounded-4"
                height="200"
                contain
              >
                <v-card-title>
                  <div class="image-controls">
                    <button
                      @click="moveUp(index)"
                      :disabled="index === 0"
                      class="control-btn"
                      title="Move up"
                    >
                      <i class="mdi mdi-arrow-up"></i>
                    </button>
                    <button
                      @click="moveDown(index)"
                      :disabled="index === images.length - 1"
                      class="control-btn"
                      title="Move down"
                    >
                      <i class="mdi mdi-arrow-down"></i>
                    </button>
                    <button @click="removeImage(index)" class="control-btn" title="Remove">
                      <i class="mdi mdi-close"></i>
                    </button>
                  </div>
                </v-card-title>
              </v-img>
              <v-card-text class="p-2">
                <p class="p-1 m-0">{{ image.name }}</p>
              </v-card-text>
              <v-card-subtitle class="bg-info d-flex justify-content-center align-items-center">
                <p class="text-white m-0 p-2">{{ formatFileSize(image.size) }}</p>
              </v-card-subtitle>
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

#overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none;
}

.icon {
  font-size: 70px;
  color: white;
}

.file-input {
  display: none;
}

.upload-zone-header svg {
  height: 100px;
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

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background: white;
}

.image-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
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

.progress-container {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.gradient-text {
  background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-primary {
  background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(13, 148, 136, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }

  .upload-zone {
    padding: 40px 20px;
  }
}

.btn-css {
  border-bottom: 1px solid black;
  border-right: 1px solid black;
  border-start-start-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
  border-top-right-radius: 0% !important;
}
</style>
