<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { jsPDF } from 'jspdf'
import { useDisplay } from 'vuetify'

// Component Imports
import Alerts from '@/components/Alerts.vue'

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
        rotation: 0
      })
    }
    reader.readAsDataURL(file)
  })
}

const rotateImage = (index) => {
  // Add 90 degrees, reset to 0 if it hits 360
  images.value[index].rotation = (images.value[index].rotation + 90) % 360
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
      // 1. Create Canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // 2. Swap dimensions if rotated 90 or 270 degrees
      if (image.rotation === 90 || image.rotation === 270) {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      // 3. Rotate Context
      // Move pivot to center
      ctx.translate(canvas.width / 2, canvas.height / 2)
      // Rotate
      ctx.rotate((image.rotation * Math.PI) / 180)
      // Draw image (offset by negative half-width/height to center it)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      // 4. Get rotated data URL
      const rotatedDataUrl = canvas.toDataURL('image/png')

      // 5. Standard PDF adding logic (using the NEW rotatedDataUrl)
      if (addPage) pdf.addPage()

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 5
      const availableWidth = pageWidth - 2 * margin
      const availableHeight = pageHeight - 2 * margin

      // Use canvas dimensions (which might be swapped)
      let finalW = canvas.width
      let finalH = canvas.height

      const scale = Math.min(availableWidth / finalW, availableHeight / finalH, 1)
      finalW *= scale
      finalH *= scale

      const x = (pageWidth - finalW) / 2
      const y = (pageHeight - finalH) / 2

      pdf.addImage(rotatedDataUrl, 'PNG', x, y, finalW, finalH)
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
  <v-btn @click="goBack" variant="flat" icon="mdi-arrow-left" class="rounded-te rounded-ts rounded-bs"
    color="primary"></v-btn>
  <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />
  <v-container style="min-height: 83.90vh;">
    <v-card class="text-h5 text-center my-3 pa-4" color="primary-lighten-5" border="primary md opacity-100" rounded="xl"
      flat>
      Convert Images to PDF
    </v-card>

    <!-- Upload Zone -->
    <v-sheet class="pa-8 upload-zone" rounded="xl" hover border @click="triggerFileInput()">
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
              <v-btn append-icon="mdi-menu-down" color="info" rounded="lg" variant="elevated" v-bind="props"
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
              <v-card-actions>
                <div class="d-flex justify-end align-center ga-1 w-100">
                  <v-btn @click="rotateImage(index)" icon="mdi-rotate-right" size="small" variant="elevated"
                    color="yellow-accent-2"></v-btn>
                  <v-btn @click="moveUp(index)" :disabled="index === 0"
                    :icon="xs ? 'mdi-arrow-up' : 'mdi-arrow-left'" size="small" color="primary" variant="elevated"></v-btn>
                  <v-btn @click="moveDown(index)" :disabled="index === images.length - 1"
                    :icon="xs ? 'mdi-arrow-down' : 'mdi-arrow-right'" size="small" color="primary"
                    variant="elevated"></v-btn>
                  <v-btn @click="removeImage(index)" color="red" icon="mdi-close" variant="elevated"
                    size="small"></v-btn>
                </div>
              </v-card-actions>
              <div class="d-flex justify-center align-center pa-2 position-relative overflow-hidden">
                <v-img :src="image.url" :alt="image.name" class="align-end text-white ma-2" max-width="100%"
                  height="200" contain rounded="lg"
                  :style="{ transform: `rotate(${image.rotation}deg)`, transition: 'transform 0.3s ease' }">
                </v-img>
              </div>
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

.upload-zone {
  border: 3px dashed royalblue !important;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-zone:hover {
  border: 3px solid royalblue !important;
  transform: translateY(-2px);
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
