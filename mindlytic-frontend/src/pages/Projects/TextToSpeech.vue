<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Alerts from "@/components/Alerts.vue";

const supportsSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
const synth = supportsSpeech ? window.speechSynthesis : null;
const snippetStorageKey = "mindlytic_tts_snippets_v2";

const text = ref(
  "Hello! I am your Mindlytic voice assistant. Paste any content, choose a voice style, and I will read it naturally.",
);
const voices = ref([]);
const selectedVoiceKey = ref("");
const selectedLanguage = ref("all");
const voiceSearch = ref("");

const rate = ref(1);
const pitch = ref(1);
const volume = ref(1);

const readMode = ref("continuous"); // continuous | sentence
const autoAdvanceSentences = ref(true);
const loopMode = ref(false);
const currentSentenceIndex = ref(0);
const currentCharIndex = ref(0);

const isLoadingVoices = ref(true);
const isPlaying = ref(false);
const isPaused = ref(false);
const isDownloading = ref(false);

const savedSnippets = ref([]);
const selectedPreset = ref("natural");

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

let mediaRecorder = null;
let audioChunks = [];
let activeDisplayStream = null;
let stopRequested = false;
let voiceRetryTimers = [];

const presets = [
  { id: "natural", label: "Natural", rate: 1, pitch: 1, volume: 1 },
  { id: "podcast", label: "Podcast", rate: 0.95, pitch: 1, volume: 1 },
  { id: "fast", label: "Fast", rate: 1.3, pitch: 1, volume: 1 },
  { id: "soft", label: "Soft", rate: 0.9, pitch: 0.85, volume: 0.9 },
  { id: "energetic", label: "Energetic", rate: 1.15, pitch: 1.2, volume: 1 },
];

const sampleTemplates = [
  {
    title: "Product Intro",
    text: "Welcome to Mindlytic. We craft premium user interfaces and robust frontend systems that teams can scale confidently.",
  },
  {
    title: "Meeting Summary",
    text: "Today we finalized the launch scope, reviewed the deployment checklist, and aligned timeline owners for each release task.",
  },
  {
    title: "Learning Script",
    text: "Consistency beats intensity. Practice one focused session every day, track your progress, and improve through clear feedback loops.",
  },
];

const wordsCount = computed(() => {
  const matches = text.value.trim().match(/\S+/g);
  return matches ? matches.length : 0;
});

const charsCount = computed(() => text.value.length);

const estimatedSeconds = computed(() => {
  if (!wordsCount.value) return 0;
  const baseWordsPerSecond = 2.5;
  return Math.ceil(wordsCount.value / (baseWordsPerSecond * rate.value));
});

const estimatedDuration = computed(() => {
  const total = estimatedSeconds.value;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
});

const sentenceChunks = computed(() => {
  const chunks = text.value.match(/[^.!?]+[.!?]*/g) || [];
  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
});

const sentenceStartOffsets = computed(() => {
  const starts = [];
  let cursor = 0;

  sentenceChunks.value.forEach((sentence) => {
    const index = text.value.indexOf(sentence, cursor);
    const start = index >= 0 ? index : cursor;
    starts.push(start);
    cursor = start + sentence.length;
  });

  return starts;
});

const getVoiceKey = (voice) => `${voice.voiceURI || ""}::${voice.name || ""}::${voice.lang || ""}`;

const selectedVoice = computed(() => {
  if (!selectedVoiceKey.value) return null;
  return voices.value.find((voice) => getVoiceKey(voice) === selectedVoiceKey.value) || null;
});

const languageOptions = computed(() => {
  const groups = new Map();

  voices.value.forEach((voice) => {
    const code = (voice.lang || "").split("-")[0].toLowerCase() || "other";
    groups.set(code, (groups.get(code) || 0) + 1);
  });

  const options = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, count]) => ({
      label: `${code.toUpperCase()} (${count})`,
      value: code,
    }));

  return [{ label: "All Languages", value: "all" }, ...options];
});

const filteredVoices = computed(() => {
  const search = voiceSearch.value.trim().toLowerCase();

  return voices.value
    .filter((voice) => {
      const byLanguage =
        selectedLanguage.value === "all" ||
        voice.lang.toLowerCase().startsWith(selectedLanguage.value.toLowerCase());

      const bySearch =
        !search ||
        voice.name.toLowerCase().includes(search) ||
        voice.lang.toLowerCase().includes(search);

      return byLanguage && bySearch;
    })
    .map((voice) => ({
      ...voice,
      key: getVoiceKey(voice),
      label: `${voice.name} (${voice.lang})`,
    }));
});

const speechProgress = computed(() => {
  if (!text.value.trim()) return 0;
  return Math.min(100, Math.round((currentCharIndex.value / text.value.length) * 100));
});

const highlightedPreview = computed(() => {
  const source = text.value;
  if (!source) return { before: "", current: "", after: "" };

  let start = 0;
  let end = 0;

  if (isPlaying.value) {
    start = Math.max(0, Math.min(currentCharIndex.value, source.length));
    end = start;

    while (end < source.length && !/\s/.test(source[end])) {
      end += 1;
    }

    if (end === start) {
      end = Math.min(start + 1, source.length);
    }
  } else if (readMode.value === "sentence" && sentenceChunks.value.length > 0) {
    start = sentenceStartOffsets.value[currentSentenceIndex.value] || 0;
    end = start + (sentenceChunks.value[currentSentenceIndex.value]?.length || 0);
  } else {
    return { before: source, current: "", after: "" };
  }

  return {
    before: source.slice(0, start),
    current: source.slice(start, end),
    after: source.slice(end),
  };
});

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => {
  window.history.back();
};

const populateVoiceList = () => {
  if (!supportsSpeech || !synth) {
    isLoadingVoices.value = false;
    return;
  }

  const availableVoices = synth.getVoices();
  if (availableVoices.length === 0) return;

  voices.value = [...availableVoices].sort((a, b) => {
    const langCompare = a.lang.localeCompare(b.lang);
    if (langCompare !== 0) return langCompare;
    return a.name.localeCompare(b.name);
  });

  if (!selectedVoiceKey.value || !voices.value.some((v) => getVoiceKey(v) === selectedVoiceKey.value)) {
    const defaultVoice =
      voices.value.find((voice) => voice.lang.startsWith("en") && voice.default) ||
      voices.value.find((voice) => voice.default) ||
      voices.value[0];

    if (defaultVoice) {
      selectedVoiceKey.value = getVoiceKey(defaultVoice);
    }
  }

  isLoadingVoices.value = false;
};

const loadSavedSnippets = () => {
  try {
    const raw = localStorage.getItem(snippetStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      savedSnippets.value = parsed;
    }
  } catch (error) {
    console.error("Unable to load saved snippets", error);
  }
};

const persistSnippets = () => {
  localStorage.setItem(snippetStorageKey, JSON.stringify(savedSnippets.value));
};

const cleanupRecordingStream = () => {
  if (activeDisplayStream) {
    activeDisplayStream.getTracks().forEach((track) => track.stop());
    activeDisplayStream = null;
  }
};

const finalizeSpeechState = () => {
  isPlaying.value = false;
  isPaused.value = false;
};

const getActiveTextChunk = () => {
  if (readMode.value === "sentence") {
    return sentenceChunks.value[currentSentenceIndex.value] || "";
  }
  return text.value.trim();
};

const getBaseOffset = () => {
  if (readMode.value === "sentence") {
    return sentenceStartOffsets.value[currentSentenceIndex.value] || 0;
  }
  return 0;
};

const handleUtteranceEnd = (fromDownload = false) => {
  if (stopRequested) {
    stopRequested = false;
    finalizeSpeechState();
    if (fromDownload && mediaRecorder?.state === "recording") mediaRecorder.stop();
    return;
  }

  const hasMoreSentences =
    readMode.value === "sentence" &&
    autoAdvanceSentences.value &&
    currentSentenceIndex.value < sentenceChunks.value.length - 1;

  if (hasMoreSentences) {
    currentSentenceIndex.value += 1;
    window.setTimeout(() => speakFromCurrent(fromDownload), 80);
    return;
  }

  if (loopMode.value) {
    if (readMode.value === "sentence") {
      currentSentenceIndex.value = 0;
      currentCharIndex.value = sentenceStartOffsets.value[0] || 0;
    } else {
      currentCharIndex.value = 0;
    }

    window.setTimeout(() => speakFromCurrent(fromDownload), 80);
    return;
  }

  if (readMode.value === "continuous") {
    currentCharIndex.value = text.value.length;
  }

  finalizeSpeechState();
  if (fromDownload && mediaRecorder?.state === "recording") mediaRecorder.stop();
};

const speakFromCurrent = (fromDownload = false) => {
  if (!supportsSpeech || !synth) {
    showAlert("Your browser does not support Text-to-Speech.", "error");
    return;
  }

  const chunk = getActiveTextChunk();
  if (!chunk) {
    showAlert("Please enter text first.", "error");
    return;
  }
  populateVoiceList();
  const voiceToUse =
    selectedVoice.value ||
    voices.value.find((voice) => voice.default) ||
    voices.value[0] ||
    null;

  if (!selectedVoiceKey.value && voiceToUse) {
    selectedVoiceKey.value = getVoiceKey(voiceToUse);
  }

  stopRequested = false;

  const utterance = new SpeechSynthesisUtterance(chunk);
  if (voiceToUse) {
    utterance.voice = voiceToUse;
    if (voiceToUse.lang) {
      utterance.lang = voiceToUse.lang;
    }
  }
  utterance.rate = rate.value;
  utterance.pitch = pitch.value;
  utterance.volume = volume.value;

  const baseOffset = getBaseOffset();
  currentCharIndex.value = baseOffset;

  utterance.onstart = () => {
    isPlaying.value = true;
    isPaused.value = false;
  };

  utterance.onboundary = (event) => {
    if (typeof event.charIndex === "number") {
      currentCharIndex.value = Math.min(text.value.length, baseOffset + event.charIndex);
    }
  };

  utterance.onpause = () => {
    isPaused.value = true;
  };

  utterance.onresume = () => {
    isPaused.value = false;
  };

  utterance.onend = () => {
    handleUtteranceEnd(fromDownload);
  };

  utterance.onerror = (event) => {
    console.error("SpeechSynthesisUtterance error", event);
    finalizeSpeechState();
    if (fromDownload && mediaRecorder?.state === "recording") mediaRecorder.stop();
    showAlert("Speech generation failed.", "error");
  };

  synth.cancel();
  synth.speak(utterance);
};

const startSpeaking = () => {
  if (isDownloading.value) return;
  speakFromCurrent(false);
};

const pauseSpeech = () => {
  if (!supportsSpeech || !synth) return;
  if (synth.speaking && !synth.paused) {
    synth.pause();
    isPaused.value = true;
  }
};

const resumeSpeech = () => {
  if (!supportsSpeech || !synth) return;
  if (synth.paused) {
    synth.resume();
    isPaused.value = false;
  }
};

const stop = (notify = true) => {
  stopRequested = true;

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  if (supportsSpeech && synth && (synth.speaking || synth.pending)) {
    synth.cancel();
  }

  finalizeSpeechState();

  if (isDownloading.value) {
    isDownloading.value = false;
  }

  if (notify) {
    showAlert("Playback stopped.", "error");
  }
};
const saveSnippet = () => {
  const value = text.value.trim();
  if (!value) {
    showAlert("Write some text before saving a snippet.", "error");
    return;
  }

  if (savedSnippets.value.some((snippet) => snippet.content === value)) {
    showAlert("This snippet is already saved.", "error");
    return;
  }

  const snippet = {
    id: Date.now(),
    title: value.slice(0, 56) + (value.length > 56 ? "..." : ""),
    content: value,
  };

  savedSnippets.value.unshift(snippet);
  savedSnippets.value = savedSnippets.value.slice(0, 6);
  persistSnippets();
  showAlert("Snippet saved.", "success");
};

const useSnippet = (snippet) => {
  text.value = snippet.content;
  currentSentenceIndex.value = 0;
  currentCharIndex.value = 0;
  showAlert("Snippet loaded.", "success");
};

const removeSnippet = (id) => {
  savedSnippets.value = savedSnippets.value.filter((snippet) => snippet.id !== id);
  persistSnippets();
};

const applyPreset = (preset) => {
  selectedPreset.value = preset.id;
  rate.value = preset.rate;
  pitch.value = preset.pitch;
  volume.value = preset.volume;
};

const applySample = (sample) => {
  text.value = sample.text;
  currentSentenceIndex.value = 0;
  currentCharIndex.value = 0;
  showAlert(`Loaded sample: ${sample.title}`, "success");
};

const loadRandomSample = () => {
  const index = Math.floor(Math.random() * sampleTemplates.length);
  applySample(sampleTemplates[index]);
};

const clearText = () => {
  text.value = "";
  currentSentenceIndex.value = 0;
  currentCharIndex.value = 0;
};

const copyText = async () => {
  if (!text.value.trim()) {
    showAlert("Nothing to copy.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text.value);
    showAlert("Text copied to clipboard.", "success");
  } catch (error) {
    console.error("Copy failed", error);
    showAlert("Unable to copy text.", "error");
  }
};

const prevSentence = () => {
  if (sentenceChunks.value.length === 0) return;
  stop(false);
  currentSentenceIndex.value = Math.max(0, currentSentenceIndex.value - 1);
  currentCharIndex.value = sentenceStartOffsets.value[currentSentenceIndex.value] || 0;
};

const nextSentence = () => {
  if (sentenceChunks.value.length === 0) return;
  stop(false);
  currentSentenceIndex.value = Math.min(sentenceChunks.value.length - 1, currentSentenceIndex.value + 1);
  currentCharIndex.value = sentenceStartOffsets.value[currentSentenceIndex.value] || 0;
};

const playCurrentSentence = () => {
  readMode.value = "sentence";
  speakFromCurrent(false);
};

const downloadSpeech = async () => {
  if (!text.value.trim()) {
    showAlert("Enter text before downloading audio.", "error");
    return;
  }

  if (!supportsSpeech || !synth) {
    showAlert("Speech feature is not supported in this browser.", "error");
    return;
  }

  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getDisplayMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    showAlert("Audio recording is not supported in this browser.", "error");
    return;
  }

  isDownloading.value = true;
  stop(false);

  try {
    activeDisplayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
      preferCurrentTab: true,
    });

    if (!activeDisplayStream.getAudioTracks().length) {
      cleanupRecordingStream();
      isDownloading.value = false;
      showAlert('Enable "Share tab audio" to download speech.', "error");
      return;
    }

    const audioStream = new MediaStream(activeDisplayStream.getAudioTracks());
    mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = audioUrl;
      link.download = "mindlytic-speech.webm";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(audioUrl);

      cleanupRecordingStream();
      mediaRecorder = null;
      isDownloading.value = false;
      showAlert("Speech downloaded successfully.", "success");
    };

    mediaRecorder.start();
    speakFromCurrent(true);
  } catch (error) {
    console.error("Download speech failed", error);
    cleanupRecordingStream();
    mediaRecorder = null;
    isDownloading.value = false;
    showAlert("Unable to start audio capture.", "error");
  }
};

const handleKeyboardShortcuts = (event) => {
  const isTypingTarget = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "");

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (isPlaying.value) {
      stop(false);
    } else {
      startSpeaking();
    }
  }

  if (event.altKey && event.key === "ArrowLeft" && readMode.value === "sentence" && !isTypingTarget) {
    event.preventDefault();
    prevSentence();
  }

  if (event.altKey && event.key === "ArrowRight" && readMode.value === "sentence" && !isTypingTarget) {
    event.preventDefault();
    nextSentence();
  }
};

watch(filteredVoices, (list) => {
  if (!list.length) {
    selectedVoiceKey.value = "";
    return;
  }

  const exists = list.some((voice) => voice.key === selectedVoiceKey.value);
  if (!exists) {
    selectedVoiceKey.value = list[0].key;
  }
});

watch(text, () => {
  if (readMode.value === "sentence" && currentSentenceIndex.value >= sentenceChunks.value.length) {
    currentSentenceIndex.value = Math.max(0, sentenceChunks.value.length - 1);
  }

  if (!isPlaying.value) {
    currentCharIndex.value = 0;
  }
});

watch(readMode, () => {
  stop(false);
  currentSentenceIndex.value = 0;
  currentCharIndex.value = 0;
});

onMounted(() => {
  if (!supportsSpeech) {
    isLoadingVoices.value = false;
    showAlert("Your browser does not support Web Speech API.", "error");
    return;
  }

  loadSavedSnippets();
  populateVoiceList();
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoiceList;
  }
  voiceRetryTimers = [250, 900, 1800].map((delay) =>
    window.setTimeout(() => {
      populateVoiceList();
    }, delay),
  );

  window.addEventListener("keydown", handleKeyboardShortcuts);
});

onUnmounted(() => {
  stop(false);
  voiceRetryTimers.forEach((timerId) => window.clearTimeout(timerId));
  voiceRetryTimers = [];

  if (synth) {
    synth.onvoiceschanged = null;
  }

  window.removeEventListener("keydown", handleKeyboardShortcuts);
  cleanupRecordingStream();
});
</script>

<template>
  <div class="tool-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn
            @click="goBack"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-arrow-left"
            rounded="xl"
            class="text-none"
          >
            Back
          </v-btn>
          <div class="hero-chip">Voice Studio</div>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" lg="7" class="pr-md-8">
            <h1 class="hero-title mb-3">Text to Speech Studio</h1>
            <p class="hero-subtitle mb-0">
              Premium text-to-speech with voice presets, sentence mode, live highlighting, keyboard shortcuts, and downloadable audio.
            </p>
          </v-col>

          <v-col cols="12" md="4" lg="5" class="mt-6 mt-md-0">
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">{{ voices.length }}</span>
                <span class="stat-label">Voices</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ wordsCount }}</span>
                <span class="stat-label">Words</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ estimatedDuration }}</span>
                <span class="stat-label">Est. Duration</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row class="ga-0" align="start">
        <v-col cols="12" lg="8" class="pr-lg-6 mb-8 mb-lg-0">
          <v-card class="tool-shell pa-5 pa-md-7" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
              <div>
                <p class="panel-kicker mb-1">Input</p>
                <h2 class="text-h5 font-weight-bold mb-1">Write or paste your script</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Ctrl/Cmd + Enter to play or stop. Alt + arrows for sentence navigation.
                </p>
              </div>
              <v-chip label color="teal-lighten-5" class="font-weight-medium">{{ charsCount }} chars</v-chip>
            </div>

            <v-textarea
              v-model="text"
              label="Text"
              variant="solo-filled"
              rows="8"
              auto-grow
              clearable
              rounded="lg"
              placeholder="Type something to be spoken..."
              class="text-input"
            ></v-textarea>

            <div class="d-flex align-center flex-wrap ga-2 mt-2 mb-5">
              <v-btn variant="text" color="primary" class="text-none" @click="copyText">Copy</v-btn>
              <v-btn variant="text" color="primary" class="text-none" @click="saveSnippet">Save Snippet</v-btn>
              <v-btn variant="text" color="primary" class="text-none" @click="loadRandomSample">Random Sample</v-btn>
              <v-btn variant="text" color="error" class="text-none" @click="clearText">Clear</v-btn>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedLanguage"
                  :items="languageOptions"
                  item-title="label"
                  item-value="value"
                  label="Language"
                  variant="solo-filled"
                  rounded="lg"
                  hide-details
                  class="mb-3"
                  :disabled="isPlaying"
                ></v-select>

                <v-text-field
                  v-model.trim="voiceSearch"
                  label="Search Voice"
                  variant="solo-filled"
                  rounded="lg"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  :disabled="isPlaying"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedVoiceKey"
                  :items="filteredVoices"
                  item-title="label"
                  item-value="key"
                  label="Select Voice"
                  variant="solo-filled"
                  rounded="lg"
                  :loading="isLoadingVoices"
                  :disabled="isLoadingVoices || isPlaying"
                ></v-select>
              </v-col>

              <v-col cols="12" md="4">
                <v-slider
                  v-model="rate"
                  label="Rate"
                  min="0.5"
                  max="2"
                  step="0.05"
                  thumb-label
                  color="primary"
                  :disabled="isPlaying"
                >
                  <template #append>
                    <span class="text-caption">{{ rate.toFixed(2) }}</span>
                  </template>
                </v-slider>
              </v-col>

              <v-col cols="12" md="4">
                <v-slider
                  v-model="pitch"
                  label="Pitch"
                  min="0"
                  max="2"
                  step="0.05"
                  thumb-label
                  color="primary"
                  :disabled="isPlaying"
                >
                  <template #append>
                    <span class="text-caption">{{ pitch.toFixed(2) }}</span>
                  </template>
                </v-slider>
              </v-col>

              <v-col cols="12" md="4">
                <v-slider
                  v-model="volume"
                  label="Volume"
                  min="0"
                  max="1"
                  step="0.05"
                  thumb-label
                  color="primary"
                  :disabled="isPlaying"
                >
                  <template #append>
                    <span class="text-caption">{{ volume.toFixed(2) }}</span>
                  </template>
                </v-slider>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex align-center flex-wrap ga-3 mb-4">
              <v-btn-toggle v-model="readMode" divided density="comfortable" color="primary" mandatory>
                <v-btn value="continuous" class="text-none">Continuous</v-btn>
                <v-btn value="sentence" class="text-none">Sentence Mode</v-btn>
              </v-btn-toggle>

              <v-switch
                v-model="autoAdvanceSentences"
                color="primary"
                label="Auto Advance"
                hide-details
                density="compact"
                class="mr-2"
                :disabled="readMode !== 'sentence'"
              ></v-switch>

              <v-switch
                v-model="loopMode"
                color="primary"
                label="Loop"
                hide-details
                density="compact"
              ></v-switch>
            </div>

            <div v-if="readMode === 'sentence'" class="sentence-control mb-4">
              <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-2">
                <p class="mb-0 text-body-2">
                  Sentence {{ Math.min(currentSentenceIndex + 1, Math.max(sentenceChunks.length, 1)) }} / {{ sentenceChunks.length }}
                </p>
                <div class="d-flex align-center ga-2">
                  <v-btn icon="mdi-skip-previous" variant="tonal" color="primary" @click="prevSentence"></v-btn>
                  <v-btn icon="mdi-play" variant="tonal" color="primary" @click="playCurrentSentence"></v-btn>
                  <v-btn icon="mdi-skip-next" variant="tonal" color="primary" @click="nextSentence"></v-btn>
                </div>
              </div>
              <p class="mb-0 text-caption text-medium-emphasis sentence-preview">
                {{ sentenceChunks[currentSentenceIndex] || "No sentence available." }}
              </p>
            </div>

            <div class="d-flex align-center flex-wrap ga-2 mb-4">
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                class="text-none"
                @click="startSpeaking"
                :disabled="!text.trim() || isDownloading"
              >
                <v-icon start icon="mdi-play"></v-icon>
                Speak
              </v-btn>

              <v-btn
                color="secondary"
                variant="tonal"
                rounded="lg"
                class="text-none"
                @click="pauseSpeech"
                :disabled="!isPlaying || isPaused"
              >
                <v-icon start icon="mdi-pause"></v-icon>
                Pause
              </v-btn>

              <v-btn
                color="secondary"
                variant="tonal"
                rounded="lg"
                class="text-none"
                @click="resumeSpeech"
                :disabled="!isPaused"
              >
                <v-icon start icon="mdi-play-pause"></v-icon>
                Resume
              </v-btn>

              <v-btn
                color="error"
                variant="tonal"
                rounded="lg"
                class="text-none"
                @click="stop()"
                :disabled="!isPlaying && !isDownloading"
              >
                <v-icon start icon="mdi-stop"></v-icon>
                Stop
              </v-btn>

              <v-btn
                color="primary"
                variant="outlined"
                rounded="lg"
                class="text-none"
                @click="downloadSpeech"
                :loading="isDownloading"
                :disabled="isDownloading || !text.trim()"
              >
                <v-icon start icon="mdi-download"></v-icon>
                Download Audio
              </v-btn>
            </div>

            <div class="progress-shell">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">Speech Progress</span>
                <span class="text-caption">{{ speechProgress }}%</span>
              </div>
              <v-progress-linear :model-value="speechProgress" color="primary" height="8" rounded></v-progress-linear>
            </div>
          </v-card>

          <v-card class="tool-shell pa-5 mt-6" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Live Preview</p>
            <div class="speech-preview-text">
              <span>{{ highlightedPreview.before }}</span>
              <mark v-if="highlightedPreview.current" class="word-highlight">{{ highlightedPreview.current }}</mark>
              <span>{{ highlightedPreview.after }}</span>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <p class="panel-kicker mb-1">Presets</p>
            <h3 class="text-h6 font-weight-bold mb-3">Voice mood styles</h3>

            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="preset in presets"
                :key="preset.id"
                :color="selectedPreset === preset.id ? 'primary' : 'teal-lighten-5'"
                :variant="selectedPreset === preset.id ? 'flat' : 'flat'"
                class="preset-chip"
                label
                @click="applyPreset(preset)"
              >
                {{ preset.label }}
              </v-chip>
            </div>
          </v-card>

          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <p class="panel-kicker mb-1">Samples</p>
            <h3 class="text-h6 font-weight-bold mb-3">Quick text templates</h3>

            <div class="d-flex flex-column ga-2">
              <v-btn
                v-for="sample in sampleTemplates"
                :key="sample.title"
                variant="tonal"
                color="primary"
                class="text-none justify-start"
                rounded="lg"
                @click="applySample(sample)"
              >
                {{ sample.title }}
              </v-btn>
            </div>
          </v-card>

          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <p class="panel-kicker mb-1">Saved</p>
            <h3 class="text-h6 font-weight-bold mb-3">Your snippets</h3>

            <div v-if="savedSnippets.length === 0" class="text-body-2 text-medium-emphasis">
              No saved snippets yet.
            </div>

            <div v-else class="d-flex flex-column ga-2">
              <v-sheet
                v-for="snippet in savedSnippets"
                :key="snippet.id"
                class="snippet-item pa-3"
                rounded="lg"
              >
                <div class="d-flex align-start justify-space-between ga-2">
                  <button class="snippet-title" @click="useSnippet(snippet)">
                    {{ snippet.title }}
                  </button>
                  <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeSnippet(snippet.id)"></v-btn>
                </div>
              </v-sheet>
            </div>
          </v-card>

          <v-card class="side-panel pa-5" rounded="xl" elevation="0">
            <p class="panel-kicker mb-1">Shortcuts</p>
            <h3 class="text-h6 font-weight-bold mb-3">Keyboard controls</h3>
            <ul class="shortcut-list">
              <li><kbd>Ctrl/Cmd + Enter</kbd> Play or Stop</li>
              <li><kbd>Alt + Left</kbd> Previous sentence</li>
              <li><kbd>Alt + Right</kbd> Next sentence</li>
            </ul>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.tool-page {
  position: relative;
  background:
    radial-gradient(circle at 10% 0%, rgba(96, 219, 198, 0.18), transparent 28%),
    radial-gradient(circle at 96% 15%, rgba(255, 199, 120, 0.2), transparent 30%);
}

.hero-shell {
  border-bottom: 1px solid rgba(19, 111, 99, 0.12);
  background: linear-gradient(152deg, rgba(246, 252, 250, 0.98), rgba(236, 246, 241, 0.92));
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.22);
  color: #136f63;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(2rem, 3.2vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  color: #4d5d59;
  max-width: 64ch;
  line-height: 1.72;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid rgba(19, 111, 99, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px 10px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: #10312b;
}

.stat-label {
  display: block;
  font-size: 0.73rem;
  color: #5f716d;
}

.tool-shell {
  border: 1px solid rgba(19, 111, 99, 0.17);
  background: linear-gradient(160deg, #ffffff 0%, #f5fbf8 100%);
  box-shadow: 0 16px 30px rgba(11, 39, 34, 0.08);
}

.panel-kicker {
  color: #157568;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.72rem;
  font-weight: 700;
}

.text-input :deep(.v-field) {
  border: 1px solid rgba(19, 111, 99, 0.14);
  border-radius: 12px;
  background: #f8fcfa;
}

.sentence-control {
  border: 1px solid rgba(19, 111, 99, 0.14);
  border-radius: 12px;
  background: #f8fcfa;
  padding: 12px;
}

.sentence-preview {
  line-height: 1.6;
}

.progress-shell {
  border: 1px solid rgba(19, 111, 99, 0.14);
  border-radius: 12px;
  background: #f8fcfa;
  padding: 12px;
}

.speech-preview-text {
  line-height: 1.8;
  font-size: 1.02rem;
  color: #223f39;
  min-height: 90px;
}

.word-highlight {
  background: rgba(255, 193, 94, 0.44);
  color: #153d35;
  border-radius: 6px;
  padding: 0 4px;
}

.side-panel {
  border: 1px solid rgba(19, 111, 99, 0.17);
  background:
    radial-gradient(circle at 90% 12%, rgba(255, 201, 131, 0.2), transparent 34%),
    linear-gradient(160deg, #ffffff 0%, #f4faf7 100%);
  box-shadow: 0 16px 30px rgba(11, 39, 34, 0.08);
}

.preset-chip {
  cursor: pointer;
  user-select: none;
}

.snippet-item {
  border: 1px solid rgba(19, 111, 99, 0.12);
  background: rgba(255, 255, 255, 0.82);
}

.snippet-title {
  all: unset;
  cursor: pointer;
  color: #174840;
  font-size: 0.9rem;
  line-height: 1.4;
}

.snippet-title:hover {
  text-decoration: underline;
}

.shortcut-list {
  margin: 0;
  padding-left: 18px;
  color: #385953;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

kbd {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.74rem;
  border: 1px solid rgba(19, 111, 99, 0.25);
  border-radius: 6px;
  background: rgba(19, 111, 99, 0.09);
  padding: 2px 6px;
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>
