<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { jsPDF } from 'jspdf'
import { useDisplay } from 'vuetify'

// Component Imports
import RedAlert from '@/components/Red-alert.vue'
import GreenAlert from '@/components/Green-alert.vue'

// State Management
const images = ref([])
const isConverting = ref(false)
const conversionProgress = ref(0)
const conversionStatus = ref('')
const imageIdCounter = ref(0)

const { xs } = useDisplay()

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
  <v-btn @click="goBack" variant="flat" icon="mdi-arrow-left" class="rounded-te rounded-ts rounded-bs" color="primary"></v-btn>
  <GreenAlert v-model:successAlert="successAlert" :successMessage="successMessage" />
  <RedAlert v-model:errorAlert="errorAlert" :errorMessage="errorMessage" />
  <v-container style="min-height: 84.3vh !important">
    <v-card class="text-h5 text-center my-3 pa-4" color="primary-lighten-5" border="primary lg opacity-25" rounded="xl" flat>
      Convert Images to PDF
    </v-card>

    <!-- Upload Zone -->
    <v-sheet class="pa-8 border-double" rounded="xl" border="primary xl opacity-25"  @click="triggerFileInput()">
      <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect" id="fileInput"
        class="file-input" required />
      <div class="text-center">
        <div class="upload-zone-header">
          <v-icon size="100" class="text-primary-emphasis">mdi-upload-circle</v-icon>
          <p class="mb-3">Browse File to upload!</p>
        </div>
        <h3 class="text-2xl font-semibold mb-2 text-slate-800">
          Drop images here or click to browse
        </h3>
        <p class="text-slate-600 mb-4">Supports JPG, PNG, GIF, and WebP formats</p>
        <v-btn variant="outlined" color="primary" rounded="lg">
          Choose Files
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
          <v-btn variant="elevated" append-icon="mdi mdi-file-pdf-box" color="success" rounded="lg"
            @click="generatePdfWithOrientation" :disabled="isConverting || images.length === 0">
            {{ isConverting ? 'Converting...' : 'Download PDF' }}
          </v-btn>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn append-icon="mdi-menu-down" color="info" rounded="lg" variant="elevated  " v-bind="props"
                text="Size All Images"></v-btn>
            </template>
            <v-list class="mt-2">
              <v-list-item @click="setOrientation('p')" :active="orientation === 'p'" color="primary">
                <v-list-item-title>Portrait</v-list-item-title>
              </v-list-item>
              <v-list-item @click="setOrientation('l')" :active="orientation === 'l'" color="primary">
                <v-list-item-title>Landscape</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <v-row dense>
          <v-col v-for="(image, index) in images" :key="image.id" cols="12" sm="6" md="5" lg="4">
            <v-card class="mx-auto" max-width="400" color="primary-lighten-5" border rounded="lg">
              <v-img :src="image.url" :alt="image.name" class="align-end text-white ma-2" height="200" contain
                rounded="lg">
                <v-card-title>
                  <div class="image-controls">
                    <v-btn @click="moveUp(index)" :disabled="index === 0" class="control-btn"
                      :icon="xs ? 'mdi-arrow-up' : 'mdi-arrow-left'" size="small" color="primary"></v-btn>
                    <v-btn @click="moveDown(index)" :disabled="index === images.length - 1" class="control-btn"
                      :icon="xs ? 'mdi-arrow-down' : 'mdi-arrow-right'" size="small" color="primary"></v-btn>
                    <v-btn @click="removeImage(index)" color="red" class="control-btn" icon="mdi-close"
                      size="small"></v-btn>
                  </div>
                </v-card-title>
              </v-img>
              <v-card-text class="pa-2">
                <p class="pa-1 ma-0 text-center">{{ image.name }}</p>
              </v-card-text>
              <v-card-subtitle color="info" class="d-flex justify-center align-center">
                <p class="text-white ma-0 pa-2">{{ formatFileSize(image.size) }}</p>
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
  display: none !important;
}

.image-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
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
  .upload-zone {
    padding: 40px 20px;
  }
}
</style>
