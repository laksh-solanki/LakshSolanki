<script setup>
// Library Imports
import { ref, onMounted, onUnmounted, computed } from "vue";

// State & Refs
const text = ref(
  "Hello! I am Mindlytic Text to Speech Assist. You can write any text here, and I will read it aloud for you. Try changing the voice, pitch, and rate!",
);
const voices = ref([]);
const selectedVoiceURI = ref(null);
const rate = ref(1);
const pitch = ref(1);
const isLoading = ref(true);
const isPlaying = ref(false);
const isDownloading = ref(false);
const synth = window.speechSynthesis;
let mediaRecorder = null;
let audioChunks = [];

const goBack = () => {
  window.history.back();
};

const selectedVoice = computed(() => {
  if (!selectedVoiceURI.value) return null;
  return voices.value.find((v) => v.voiceURI === selectedVoiceURI.value);
});

const populateVoiceList = () => {
  const availableVoices = synth.getVoices();
  if (availableVoices.length > 0) {
    voices.value = availableVoices.sort((a, b) => a.lang.localeCompare(b.lang)); // Sort by language

    // Set a default voice if none is selected
    if (!selectedVoiceURI.value && voices.value.length > 0) {
      // Prefer a default English voice if available
      const defaultVoice =
        voices.value.find(
          (voice) => voice.lang.includes("en") && voice.default,
        ) || voices.value[0];
      if (defaultVoice) {
        selectedVoiceURI.value = defaultVoice.voiceURI;
      }
    }
    isLoading.value = false;
  }
};

const speak = (onEndCallback) => {
  if (synth.speaking) {
    console.error("SpeechSynthesis is already speaking.");
    return;
  }
  if (text.value !== "" && selectedVoice.value) {
    const utterance = new SpeechSynthesisUtterance(text.value);

    utterance.onstart = () => {
      isPlaying.value = true;
    };

    utterance.onend = () => {
      isPlaying.value = false;
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance.onerror", event);
      isPlaying.value = false;
      if (onEndCallback) onEndCallback();
    };

    utterance.voice = selectedVoice.value;
    utterance.pitch = pitch.value;
    utterance.rate = rate.value;

    synth.speak(utterance);
  }
};

const stop = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  if (synth.speaking) {
    synth.cancel();
  }
  isPlaying.value = false;
  isDownloading.value = false;
};

const downloadSpeech = async () => {
  if (!text.value || !selectedVoice.value) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    alert(
      "Your browser does not support the Media Capture API required for audio download.",
    );
    return;
  }

  isDownloading.value = true;

  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
      preferCurrentTab: true,
    });

    if (displayStream.getAudioTracks().length === 0) {
      alert(
        'Audio permission is required. Please share "Tab audio" to record the speech.',
      );
      displayStream.getTracks().forEach((track) => track.stop());
      isDownloading.value = false;
      return;
    }

    const audioStream = new MediaStream(displayStream.getAudioTracks());
    mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = audioUrl;
      a.download = "speech.webm";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(audioUrl);
      document.body.removeChild(a);

      displayStream.getTracks().forEach((track) => track.stop());
      isDownloading.value = false;
      mediaRecorder = null;
    };

    mediaRecorder.start();
    speak(() => mediaRecorder?.stop());
  } catch (err) {
    console.error("Error during audio capture:", err);
    isDownloading.value = false;
  }
};


// --- Lifecycle Hooks ---
onMounted(() => {
  // Voices are loaded asynchronously. We need to listen for the 'voiceschanged' event.
  populateVoiceList();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoiceList;
  }
});

onUnmounted(() => {
  // Clean up to prevent memory leaks if the component is destroyed.
  if (synth.speaking) {
    synth.cancel();
  }
  synth.onvoiceschanged = null;
});
</script>

<template>
  <v-btn @click="goBack" variant="flat" icon="mdi-arrow-left" class="rounded-te rounded-ts rounded-bs"
    color="primary"></v-btn>
  <v-container style="min-height: 84.3vh !important">
    <v-card class="text-h5 pa-4 my-3 text-center" color="primary-lighten-5" border="primary md opacity-100" rounded="xl"
      flat>
      Text to Speech Converter
    </v-card>

    <v-card class="pa-4 pa-md-8 rounded-xl" border>
      <v-row>
        <v-col cols="12">
          <v-textarea v-model="text" label="Enter Text" variant="outlined" rows="8" auto-grow clearable
            bg-color="surface" rounded="lg" placeholder="Type something to be spoken..."></v-textarea>
        </v-col>

        <v-col cols="12" md="6">
          <v-select v-model="selectedVoiceURI" :items="voices" item-title="name" item-value="voiceURI"
            label="Select Voice" variant="outlined" clearable clear-icon="mdi-close" hide-details :loading="isLoading"
            bg-color="surface" rounded="lg" :disabled="isLoading || isPlaying">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.lang"></v-list-item>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="6" class="d-flex align-center ga-3">
          <v-btn @click="isPlaying ? stop() : speak()" :color="isPlaying ? 'error' : 'primary'"
            :loading="isPlaying && !synth.speaking" :disabled="!text || !selectedVoice || isDownloading" size="x-large"
            class="grow rounded-lg" variant="tonal" height="56">
            <v-icon start>{{
              isPlaying ? "mdi-stop-circle-outline" : "mdi-play-circle-outline"
              }}</v-icon>
            {{ isPlaying ? "Stop" : "Speak" }}
          </v-btn>
        </v-col>

        <v-col cols="12" md="6">
          <v-slider v-model="rate" label="Rate" min="0.5" max="2" step="0.1" thumb-label color="primary" class="mt-4"
            :disabled="isPlaying">
            <template v-slot:append>
              <span class="text-caption">{{ rate.toFixed(1) }}</span>
            </template>
          </v-slider>
        </v-col>

        <v-col cols="12" md="6">
          <v-slider v-model="pitch" label="Pitch" min="0" max="2" step="0.1" thumb-label color="primary" class="mt-4"
            :disabled="isPlaying">
            <template v-slot:append>
              <span class="text-caption">{{ pitch.toFixed(1) }}</span>
            </template>
          </v-slider>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="mt-4 rounded-xl" color="primary" variant="tonal" elevation="3" border>
      <v-card-text>
        <div>
          Note: This tool uses your browser's built-in Web Speech API. The
          available voices depend on your operating system and browser.
          <v-chip class="ma-1" color="secondary" label>
            It's completely free and private.
          </v-chip>
        </div>
        <div class="mt-2">
          Adjust the rate and pitch sliders to change how the voice sounds. The
          download button records your tab's audio output, so you may be
          prompted for screen share permission.
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
