<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Alerts from "@/components/Alerts.vue";

const TRANSLATE_TIMEOUT_MS = 20000;

const languageOptions = [
  { title: "Auto Detect", value: "auto" },
  { title: "English", value: "en" },
  { title: "Hindi", value: "hi" },
  { title: "Spanish", value: "es" },
  { title: "French", value: "fr" },
  { title: "German", value: "de" },
  { title: "Italian", value: "it" },
  { title: "Portuguese", value: "pt" },
  { title: "Russian", value: "ru" },
  { title: "Arabic", value: "ar" },
  { title: "Turkish", value: "tr" },
  { title: "Indonesian", value: "id" },
  { title: "Bengali", value: "bn" },
  { title: "Marathi", value: "mr" },
  { title: "Tamil", value: "ta" },
  { title: "Telugu", value: "te" },
  { title: "Gujarati", value: "gu" },
  { title: "Urdu", value: "ur" },
  { title: "Japanese", value: "ja" },
  { title: "Korean", value: "ko" },
  { title: "Chinese (Simplified)", value: "zh-CN" },
];

const sourceText = ref("");
const translatedText = ref("");
const sourceLanguage = ref("auto");
const targetLanguage = ref("en");
const detectedLanguage = ref("");
const activeProvider = ref("Ready");

const autoTranslate = ref(false);
const isTranslating = ref(false);

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

let autoTranslateTimer = null;
let translateRequestToken = 0;
let suppressAutoTranslateWatcher = false;

const targetLanguageOptions = computed(() =>
  languageOptions.filter((language) => language.value !== "auto"),
);

const languageLabelMap = computed(() =>
  languageOptions.reduce((accumulator, language) => {
    accumulator[language.value] = language.title;
    return accumulator;
  }, {}),
);

const sourceCharacters = computed(() => sourceText.value.length);
const sourceWords = computed(() => {
  const words = sourceText.value.trim().match(/\S+/g);
  return words ? words.length : 0;
});

const translatedCharacters = computed(() => translatedText.value.length);
const translateButtonDisabled = computed(
  () => !sourceText.value.trim() || isTranslating.value,
);

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => window.history.back();

const toMyMemoryLanguageCode = (code = "") => {
  if (code === "zh-CN") return "zh-CN";
  return code;
};

const toLibreLanguageCode = (code = "") => {
  if (code === "zh-CN") return "zh";
  return code;
};

const detectLikelyLanguage = (value = "") => {
  const sample = String(value || "");
  if (/[\u0900-\u097F]/.test(sample)) return "hi";
  if (/[\u0980-\u09FF]/.test(sample)) return "bn";
  if (/[\u0A80-\u0AFF]/.test(sample)) return "gu";
  if (/[\u0B80-\u0BFF]/.test(sample)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(sample)) return "te";
  if (/[\u0600-\u06FF]/.test(sample)) return "ar";
  if (/[\u3040-\u30FF]/.test(sample)) return "ja";
  if (/[\u4E00-\u9FFF]/.test(sample)) return "zh-CN";
  if (/[\uAC00-\uD7AF]/.test(sample)) return "ko";
  if (/[\u0400-\u04FF]/.test(sample)) return "ru";
  return "en";
};

const resolveSourceLanguage = () => {
  if (sourceLanguage.value !== "auto") {
    detectedLanguage.value = "";
    return sourceLanguage.value;
  }

  const guessedLanguage = detectLikelyLanguage(sourceText.value);
  detectedLanguage.value = guessedLanguage;
  return guessedLanguage;
};

const pickDistinctTargetLanguage = (sourceCode = "") => {
  const source = String(sourceCode || "").trim();
  const availableTargets = targetLanguageOptions.value.map((language) => language.value);

  const preferredOrder =
    source === "en"
      ? ["hi", "es", "fr", "de", "ar", "ja"]
      : ["en", "hi", "es", "fr", "de", "ar", "ja"];

  const preferredMatch = preferredOrder.find(
    (languageCode) =>
      languageCode !== source && availableTargets.includes(languageCode),
  );
  if (preferredMatch) return preferredMatch;

  return availableTargets.find((languageCode) => languageCode !== source) || "";
};

const setTargetLanguageWithoutAutoQueue = (languageCode = "") => {
  if (!languageCode || languageCode === targetLanguage.value) return;
  suppressAutoTranslateWatcher = true;
  targetLanguage.value = languageCode;
  queueMicrotask(() => {
    suppressAutoTranslateWatcher = false;
  });
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

const requestMyMemoryTranslate = async (text, sourceCode, targetCode) => {
  const source = toMyMemoryLanguageCode(sourceCode);
  const target = toMyMemoryLanguageCode(targetCode);
  const endpoint =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`;

  const response = await fetchWithTimeout(
    endpoint,
    {
      headers: { Accept: "application/json" },
    },
    TRANSLATE_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`MyMemory returned ${response.status}.`);
  }

  const data = await response.json();
  const sourceLooksLikeQuestion = /[?？]\s*$/.test(String(text || "").trim());
  const matchCandidates = Array.isArray(data?.matches)
    ? data.matches
        .map((item) => String(item?.translation || "").trim())
        .filter(Boolean)
    : [];

  let translated = String(data?.responseData?.translatedText || "").trim();

  // MyMemory can return crowd-sourced answers that are semantically wrong.
  // For questions, prefer candidates that preserve question punctuation.
  if (sourceLooksLikeQuestion && matchCandidates.length) {
    const questionCandidate = matchCandidates.find((candidate) =>
      /[?？]\s*$/.test(candidate),
    );
    if (questionCandidate) {
      translated = questionCandidate;
    }
  }

  if (!translated && matchCandidates.length) {
    translated = matchCandidates[0];
  }

  if (!translated) {
    throw new Error("MyMemory returned an empty response.");
  }

  return translated;
};

const requestGoogleTranslate = async (text, sourceCode, targetCode) => {
  const source = toLibreLanguageCode(sourceCode);
  const target = toLibreLanguageCode(targetCode);
  const endpoint =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}` +
    `&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetchWithTimeout(
    endpoint,
    {
      headers: { Accept: "application/json" },
    },
    TRANSLATE_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`Google Translate endpoint returned ${response.status}.`);
  }

  const data = await response.json();
  const chunks = Array.isArray(data?.[0]) ? data[0] : [];
  const translated = chunks
    .map((part) => (Array.isArray(part) ? String(part[0] || "") : ""))
    .join("")
    .trim();

  if (!translated) {
    throw new Error("Google Translate endpoint returned an empty response.");
  }

  return translated;
};

const translateText = async ({ silent = false } = {}) => {
  const input = sourceText.value.trim();
  if (!input) {
    translatedText.value = "";
    return;
  }

  if (isTranslating.value) return;

  const resolvedSourceLanguage = resolveSourceLanguage();
  let effectiveTargetLanguage = targetLanguage.value;

  if (resolvedSourceLanguage === effectiveTargetLanguage) {
    const autoTargetLanguage = pickDistinctTargetLanguage(resolvedSourceLanguage);
    if (!autoTargetLanguage) {
      translatedText.value = sourceText.value;
      if (!silent) {
        showAlert("Could not auto-select a different target language.", "error");
      }
      return;
    }

    setTargetLanguageWithoutAutoQueue(autoTargetLanguage);
    effectiveTargetLanguage = autoTargetLanguage;
    if (!silent) {
      showAlert(
        `Auto-selected target language: ${languageLabelMap.value[autoTargetLanguage] || autoTargetLanguage}.`,
      );
    }
  }

  const requestToken = ++translateRequestToken;
  isTranslating.value = true;

  const providers = [
    {
      name: "Google Translate",
      run: () =>
        requestGoogleTranslate(
          input,
          resolvedSourceLanguage,
          effectiveTargetLanguage,
        ),
    },
    {
      name: "MyMemory",
      run: () =>
        requestMyMemoryTranslate(
          input,
          resolvedSourceLanguage,
          effectiveTargetLanguage,
        ),
    },
  ];

  let translated = "";
  let lastError = null;

  try {
    for (const provider of providers) {
      try {
        activeProvider.value = provider.name;
        translated = await provider.run();
        if (translated) break;
      } catch (error) {
        lastError = error;
        console.error(`${provider.name} translation failed`, error);
      }
    }

    if (!translated) {
      throw lastError || new Error("Translation service unavailable.");
    }

    if (requestToken !== translateRequestToken) return;

    translatedText.value = translated;

    if (!silent) {
      showAlert(`Translated with ${activeProvider.value}.`);
    }
  } catch (error) {
    if (requestToken !== translateRequestToken) return;

    const rawMessage = String(error?.message || "Translation failed.");
    const networkLikeError =
      /failed to fetch|network|abort|timed out/i.test(rawMessage);
    const message = networkLikeError
      ? "Translation services are unreachable right now. Check internet/VPN and try again."
      : rawMessage;
    showAlert(message, "error");
  } finally {
    if (requestToken === translateRequestToken) {
      isTranslating.value = false;
    }
  }
};

const queueAutoTranslate = () => {
  if (autoTranslateTimer) {
    window.clearTimeout(autoTranslateTimer);
    autoTranslateTimer = null;
  }

  if (!autoTranslate.value || !sourceText.value.trim()) return;

  autoTranslateTimer = window.setTimeout(() => {
    translateText({ silent: true });
  }, 650);
};

const swapLanguages = () => {
  const resolvedSource =
    sourceLanguage.value === "auto"
      ? detectedLanguage.value || "en"
      : sourceLanguage.value;

  if (!resolvedSource || resolvedSource === targetLanguage.value) {
    showAlert("Choose different languages to swap.", "error");
    return;
  }

  const previousTarget = targetLanguage.value;
  targetLanguage.value = resolvedSource;
  sourceLanguage.value = previousTarget;

  if (translatedText.value.trim()) {
    sourceText.value = translatedText.value;
    translatedText.value = "";
  }

  showAlert("Languages swapped.");
  queueAutoTranslate();
};

const clearAll = () => {
  sourceText.value = "";
  translatedText.value = "";
  detectedLanguage.value = "";
  showAlert("Cleared.");
};

const copyTranslatedText = async () => {
  if (!translatedText.value.trim()) {
    showAlert("Nothing to copy.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(translatedText.value);
    showAlert("Translated text copied.");
  } catch (error) {
    console.error("Copy failed", error);
    showAlert("Clipboard is blocked in this browser.", "error");
  }
};

const downloadTranslation = () => {
  if (!translatedText.value.trim()) {
    showAlert("Translate text before downloading.", "error");
    return;
  }

  const fromLabel = languageLabelMap.value[sourceLanguage.value] || sourceLanguage.value;
  const toLabel = languageLabelMap.value[targetLanguage.value] || targetLanguage.value;
  const payload = [
    `From: ${fromLabel}`,
    `To: ${toLabel}`,
    "",
    "--- Source ---",
    sourceText.value,
    "",
    "--- Translation ---",
    translatedText.value,
  ].join("\n");

  const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mindlytic-translation.txt";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  showAlert("Downloaded translation.");
};

const handleGlobalKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    translateText();
  }
};

watch([sourceText, sourceLanguage, targetLanguage], () => {
  if (suppressAutoTranslateWatcher) return;
  queueAutoTranslate();
});

watch(autoTranslate, (enabled) => {
  if (!enabled) return;
  queueAutoTranslate();
});

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  if (autoTranslateTimer) {
    window.clearTimeout(autoTranslateTimer);
    autoTranslateTimer = null;
  }

  window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
  <div class="tool-page translate-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-8 py-md-10">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
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
          <v-chip color="primary" variant="tonal" rounded="lg" size="small">
            Translator Studio
          </v-chip>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" class="pr-md-8">
            <h1 class="hero-title mb-2">Translate Studio</h1>
            <p class="hero-subtitle mb-0">
              Clean translation workspace with smart language detection and quick export.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="mt-5 mt-md-0">
            <div class="hero-stats">
              <div class="stat-card">
                <span class="stat-value">{{ sourceWords }}</span>
                <span class="stat-label">Input Words</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ translatedCharacters }}</span>
                <span class="stat-label">Output Chars</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ autoTranslate ? "On" : "Off" }}</span>
                <span class="stat-label">Auto Translate</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-6 py-md-8">
      <v-row class="ga-0" align="start">
        <v-col cols="12">
          <v-card class="tool-shell pa-4 pa-md-6" rounded="xl" elevation="0">
            <div class="d-flex align-center flex-wrap ga-2 mb-4">
              <v-select
                v-model="sourceLanguage"
                :items="languageOptions"
                item-title="title"
                item-value="value"
                label="From"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                class="lang-select"
                hide-details
              />

              <v-btn
                icon="mdi-swap-horizontal"
                variant="tonal"
                color="primary"
                rounded="lg"
                :disabled="isTranslating"
                @click="swapLanguages"
              />

              <v-select
                v-model="targetLanguage"
                :items="targetLanguageOptions"
                item-title="title"
                item-value="value"
                label="To"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                class="lang-select"
                hide-details
              />

              <v-spacer />

              <v-switch
                v-model="autoTranslate"
                color="primary"
                hide-details
                density="compact"
                label="Auto"
              />
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="sourceText"
                  label="Source text"
                  variant="outlined"
                  rows="10"
                  auto-grow
                  rounded="lg"
                  placeholder="Type text to translate..."
                />
                <p class="meta-copy mb-0">
                  {{ sourceCharacters }} chars | {{ sourceWords }} words
                  <span v-if="detectedLanguage && sourceLanguage === 'auto'">
                    | Detected: {{ languageLabelMap[detectedLanguage] || detectedLanguage }}
                  </span>
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <v-textarea
                  v-model="translatedText"
                  label="Translated text"
                  variant="outlined"
                  rows="10"
                  auto-grow
                  rounded="lg"
                  readonly
                  placeholder="Translation appears here..."
                />
                <p class="meta-copy mb-0">
                  Provider: {{ activeProvider }} | {{ translatedCharacters }} chars
                </p>
              </v-col>
            </v-row>

            <div class="d-flex align-center flex-wrap ga-2 mt-4">
              <v-btn
                color="primary"
                rounded="lg"
                class="text-none"
                :loading="isTranslating"
                :disabled="translateButtonDisabled"
                @click="translateText()"
              >
                <v-icon start icon="mdi-translate" />
                Translate
              </v-btn>
              <v-btn
                variant="tonal"
                color="primary"
                rounded="lg"
                class="text-none"
                :disabled="!translatedText.trim()"
                @click="copyTranslatedText"
              >
                <v-icon start icon="mdi-content-copy" />
                Copy
              </v-btn>
              <v-btn
                variant="tonal"
                color="primary"
                rounded="lg"
                class="text-none"
                :disabled="!translatedText.trim()"
                @click="downloadTranslation"
              >
                <v-icon start icon="mdi-download" />
                Download
              </v-btn>
              <v-btn
                variant="text"
                color="error"
                rounded="lg"
                class="text-none"
                :disabled="!sourceText && !translatedText"
                @click="clearAll"
              >
                Clear
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.translate-page .hero-shell {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: transparent;
}

.hero-title {
  font-size: clamp(1.9rem, 3.2vw, 2.7rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.72);
  line-height: 1.68;
  max-width: 64ch;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
  background: rgba(var(--v-theme-surface), 0.72);
}

.stat-value {
  display: block;
  font-size: 0.96rem;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.stat-label {
  display: block;
  margin-top: 2px;
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.tool-shell {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface), 0.9);
  box-shadow: none;
}

.lang-select {
  min-width: 180px;
  max-width: 220px;
}

.meta-copy {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.78rem;
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .lang-select {
    min-width: 100%;
    max-width: 100%;
  }
}
</style>
