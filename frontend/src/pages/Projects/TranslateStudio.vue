<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Alerts from "@/components/Alerts.vue";

const TRANSLATE_TIMEOUT_MS = 20000;
const MAX_CHARS = 5000;

const STOPWORDS = new Set([
  "the","a","an","and","or","but","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","shall","should","may",
  "might","must","can","could","of","in","to","for","on","at","by","from",
  "with","about","as","into","through","during","before","after","above",
  "below","between","out","off","over","under","then","than","so","if","it",
  "its","this","that","these","those","i","you","he","she","we","they","me",
  "him","her","us","them","my","your","his","our","their","what","which","who",
  "not","no","nor","at","up","down",
]);

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

// ── Core state ────────────────────────────────────────────────────────────────
const sourceText = ref("");
const translatedText = ref("");
const sourceLanguage = ref("auto");
const targetLanguage = ref("en");
const detectedLanguage = ref("");
const activeProvider = ref("Ready");

const autoTranslate = ref(false);
const isTranslating = ref(false);

// ── Alert ─────────────────────────────────────────────────────────────────────
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

// ── Comparison mode ───────────────────────────────────────────────────────────
const compareMode = ref(false);
const compareResults = ref({ google: "", myMemory: "" });
const isComparing = ref(false);

// ── Find & Replace ────────────────────────────────────────────────────────────
const showFindReplace = ref(false);
const findText = ref("");
const replaceText = ref("");
const findReplaceCount = ref(0);

// ── Timers / tokens ───────────────────────────────────────────────────────────
let autoTranslateTimer = null;
let translateRequestToken = 0;
let suppressAutoTranslateWatcher = false;

// ── Computed helpers ──────────────────────────────────────────────────────────
const targetLanguageOptions = computed(() =>
  languageOptions.filter((l) => l.value !== "auto"),
);

const languageLabelMap = computed(() =>
  languageOptions.reduce((acc, l) => {
    acc[l.value] = l.title;
    return acc;
  }, {}),
);

const sourceCharacters = computed(() => sourceText.value.length);
const sourceWords = computed(() => {
  const words = sourceText.value.trim().match(/\S+/g);
  return words ? words.length : 0;
});

const sourceSentences = computed(() => {
  const s = sourceText.value.trim();
  if (!s) return 0;
  const parts = s.match(/[^.!?…]+[.!?…]+/g);
  return parts ? parts.length : 1;
});

const readingTimeMinutes = computed(() => {
  const wpm = 200;
  const mins = Math.ceil(sourceWords.value / wpm);
  return mins < 1 ? "<1" : String(mins);
});

const charProgress = computed(() =>
  Math.min(100, Math.round((sourceCharacters.value / MAX_CHARS) * 100)),
);

const charProgressColor = computed(() => {
  if (charProgress.value >= 95) return "error";
  if (charProgress.value >= 80) return "warning";
  return "primary";
});

const isOverLimit = computed(() => sourceCharacters.value > MAX_CHARS);

const translatedCharacters = computed(() => translatedText.value.length);

const translateButtonDisabled = computed(
  () => !sourceText.value.trim() || isTranslating.value || isOverLimit.value || isComparing.value,
);

// ── Word frequency ────────────────────────────────────────────────────────────
const topWords = computed(() => {
  const text = sourceText.value.toLowerCase();
  const tokens = text.match(/[a-z']+/g) || [];
  const freq = {};
  for (const t of tokens) {
    const word = t.replace(/^'+|'+$/g, "");
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    freq[word] = (freq[word] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
});

// ── Alerts ────────────────────────────────────────────────────────────────────
const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => window.history.back();

// ── Language helpers ──────────────────────────────────────────────────────────
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
  const guessed = detectLikelyLanguage(sourceText.value);
  detectedLanguage.value = guessed;
  return guessed;
};

const pickDistinctTargetLanguage = (sourceCode = "") => {
  const source = String(sourceCode || "").trim();
  const available = targetLanguageOptions.value.map((l) => l.value);
  const preferred =
    source === "en"
      ? ["hi", "es", "fr", "de", "ar", "ja"]
      : ["en", "hi", "es", "fr", "de", "ar", "ja"];
  const match = preferred.find((c) => c !== source && available.includes(c));
  if (match) return match;
  return available.find((c) => c !== source) || "";
};

const setTargetLanguageWithoutAutoQueue = (languageCode = "") => {
  if (!languageCode || languageCode === targetLanguage.value) return;
  suppressAutoTranslateWatcher = true;
  targetLanguage.value = languageCode;
  queueMicrotask(() => {
    suppressAutoTranslateWatcher = false;
  });
};

// ── Fetch helper ──────────────────────────────────────────────────────────────
const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

// ── Providers ─────────────────────────────────────────────────────────────────
const requestMyMemoryTranslate = async (text, sourceCode, targetCode) => {
  const source = toMyMemoryLanguageCode(sourceCode);
  const target = toMyMemoryLanguageCode(targetCode);
  const endpoint =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`;

  const response = await fetchWithTimeout(
    endpoint,
    { headers: { Accept: "application/json" } },
    TRANSLATE_TIMEOUT_MS,
  );
  if (!response.ok) throw new Error(`MyMemory returned ${response.status}.`);

  const data = await response.json();
  const sourceLooksLikeQuestion = /[?？]\s*$/.test(String(text || "").trim());
  const matchCandidates = Array.isArray(data?.matches)
    ? data.matches.map((m) => String(m?.translation || "").trim()).filter(Boolean)
    : [];

  let translated = String(data?.responseData?.translatedText || "").trim();

  if (sourceLooksLikeQuestion && matchCandidates.length) {
    const qc = matchCandidates.find((c) => /[?？]\s*$/.test(c));
    if (qc) translated = qc;
  }
  if (!translated && matchCandidates.length) translated = matchCandidates[0];
  if (!translated) throw new Error("MyMemory returned an empty response.");
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
    { headers: { Accept: "application/json" } },
    TRANSLATE_TIMEOUT_MS,
  );
  if (!response.ok)
    throw new Error(`Google Translate returned ${response.status}.`);

  const data = await response.json();
  const chunks = Array.isArray(data?.[0]) ? data[0] : [];
  const translated = chunks
    .map((p) => (Array.isArray(p) ? String(p[0] || "") : ""))
    .join("")
    .trim();

  if (!translated) throw new Error("Google Translate returned an empty response.");
  return translated;
};

// ── Translate (normal mode) ───────────────────────────────────────────────────
const translateText = async ({ silent = false } = {}) => {
  const input = sourceText.value.trim();
  if (!input) { translatedText.value = ""; return; }
  if (isTranslating.value || isOverLimit.value) return;

  const resolvedSource = resolveSourceLanguage();
  let effectiveTarget = targetLanguage.value;

  if (resolvedSource === effectiveTarget) {
    const auto = pickDistinctTargetLanguage(resolvedSource);
    if (!auto) {
      translatedText.value = sourceText.value;
      if (!silent) showAlert("Could not auto-select a different target language.", "error");
      return;
    }
    setTargetLanguageWithoutAutoQueue(auto);
    effectiveTarget = auto;
    if (!silent)
      showAlert(`Auto-selected target: ${languageLabelMap.value[auto] || auto}.`);
  }

  const token = ++translateRequestToken;
  isTranslating.value = true;

  const providers = [
    { name: "Google Translate", run: () => requestGoogleTranslate(input, resolvedSource, effectiveTarget) },
    { name: "MyMemory", run: () => requestMyMemoryTranslate(input, resolvedSource, effectiveTarget) },
  ];

  let translated = "";
  let lastError = null;

  try {
    for (const provider of providers) {
      try {
        activeProvider.value = provider.name;
        translated = await provider.run();
        if (translated) break;
      } catch (err) {
        lastError = err;
        console.error(`${provider.name} failed`, err);
      }
    }

    if (!translated) throw lastError || new Error("Translation service unavailable.");
    if (token !== translateRequestToken) return;

    translatedText.value = translated;
    if (!silent) showAlert(`Translated with ${activeProvider.value}.`);
  } catch (err) {
    if (token !== translateRequestToken) return;
    const raw = String(err?.message || "Translation failed.");
    const isNetwork = /failed to fetch|network|abort|timed out/i.test(raw);
    showAlert(
      isNetwork
        ? "Translation services are unreachable. Check internet/VPN and try again."
        : raw,
      "error",
    );
  } finally {
    if (token === translateRequestToken) isTranslating.value = false;
  }
};

// ── Comparison mode ───────────────────────────────────────────────────────────
const runComparison = async () => {
  const input = sourceText.value.trim();
  if (!input || isComparing.value || isOverLimit.value) return;

  const resolvedSource = resolveSourceLanguage();
  let effectiveTarget = targetLanguage.value;

  if (resolvedSource === effectiveTarget) {
    const auto = pickDistinctTargetLanguage(resolvedSource);
    if (!auto) { showAlert("Could not auto-select a different target language.", "error"); return; }
    setTargetLanguageWithoutAutoQueue(auto);
    effectiveTarget = auto;
  }

  isComparing.value = true;
  compareResults.value = { google: "", myMemory: "" };

  const [googleResult, myMemoryResult] = await Promise.allSettled([
    requestGoogleTranslate(input, resolvedSource, effectiveTarget),
    requestMyMemoryTranslate(input, resolvedSource, effectiveTarget),
  ]);

  compareResults.value = {
    google: googleResult.status === "fulfilled" ? googleResult.value : `Error: ${googleResult.reason?.message || "failed"}`,
    myMemory: myMemoryResult.status === "fulfilled" ? myMemoryResult.value : `Error: ${myMemoryResult.reason?.message || "failed"}`,
  };

  isComparing.value = false;
};

const useCompareResult = (which) => {
  const text = which === "google" ? compareResults.value.google : compareResults.value.myMemory;
  if (text) {
    translatedText.value = text;
    activeProvider.value = which === "google" ? "Google Translate" : "MyMemory";
    showAlert(`Using ${activeProvider.value} result.`);
  }
};

// ── Find & Replace ────────────────────────────────────────────────────────────
const doFindReplace = () => {
  if (!findText.value || !translatedText.value) return;
  const escaped = findText.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const matches = translatedText.value.match(regex);
  findReplaceCount.value = matches ? matches.length : 0;
  if (!findReplaceCount.value) {
    showAlert("No matches found.", "error");
    return;
  }
  translatedText.value = translatedText.value.replace(regex, replaceText.value);
  showAlert(`Replaced ${findReplaceCount.value} occurrence(s).`);
  findText.value = "";
  replaceText.value = "";
};

const closeFindReplace = () => {
  showFindReplace.value = false;
  findText.value = "";
  replaceText.value = "";
  findReplaceCount.value = 0;
};

// ── Clipboard helpers ─────────────────────────────────────────────────────────
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      sourceText.value = text;
      showAlert("Pasted from clipboard.");
    } else {
      showAlert("Clipboard is empty.", "error");
    }
  } catch {
    showAlert("Clipboard access denied.", "error");
  }
};

const copySourceText = async () => {
  if (!sourceText.value.trim()) { showAlert("Nothing to copy.", "error"); return; }
  try {
    await navigator.clipboard.writeText(sourceText.value);
    showAlert("Source text copied.");
  } catch {
    showAlert("Clipboard is blocked in this browser.", "error");
  }
};

const copyTranslatedText = async () => {
  if (!translatedText.value.trim()) { showAlert("Nothing to copy.", "error"); return; }
  try {
    await navigator.clipboard.writeText(translatedText.value);
    showAlert("Translated text copied.");
  } catch {
    showAlert("Clipboard is blocked in this browser.", "error");
  }
};

// ── Auto translate ────────────────────────────────────────────────────────────
const queueAutoTranslate = () => {
  if (autoTranslateTimer) { window.clearTimeout(autoTranslateTimer); autoTranslateTimer = null; }
  if (!autoTranslate.value || !sourceText.value.trim() || isOverLimit.value) return;
  autoTranslateTimer = window.setTimeout(() => { translateText({ silent: true }); }, 650);
};

// ── Swap languages ────────────────────────────────────────────────────────────
const swapLanguages = () => {
  const resolvedSource =
    sourceLanguage.value === "auto"
      ? detectedLanguage.value || "en"
      : sourceLanguage.value;

  if (!resolvedSource || resolvedSource === targetLanguage.value) {
    showAlert("Choose different languages to swap.", "error");
    return;
  }

  const prevTarget = targetLanguage.value;
  targetLanguage.value = resolvedSource;
  sourceLanguage.value = prevTarget;

  if (translatedText.value.trim()) {
    sourceText.value = translatedText.value;
    translatedText.value = "";
  }

  compareResults.value = { google: "", myMemory: "" };
  showAlert("Languages swapped.");
  queueAutoTranslate();
};

// ── Clear ─────────────────────────────────────────────────────────────────────
const clearAll = () => {
  sourceText.value = "";
  translatedText.value = "";
  detectedLanguage.value = "";
  compareResults.value = { google: "", myMemory: "" };
  closeFindReplace();
  showAlert("Cleared.");
};

// ── Download ──────────────────────────────────────────────────────────────────
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
  const a = document.createElement("a");
  a.href = url;
  a.download = "mindlytic-translation.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAlert("Downloaded translation.");
};

// ── Global keyboard shortcut ──────────────────────────────────────────────────
const handleGlobalKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (compareMode.value) runComparison();
    else translateText();
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "h") {
    event.preventDefault();
    if (translatedText.value) showFindReplace.value = !showFindReplace.value;
  }
};

// ── Watchers ──────────────────────────────────────────────────────────────────
watch([sourceText, sourceLanguage, targetLanguage], () => {
  if (suppressAutoTranslateWatcher) return;
  compareResults.value = { google: "", myMemory: "" };
  queueAutoTranslate();
});

watch(autoTranslate, (enabled) => { if (!enabled) return; queueAutoTranslate(); });

watch(compareMode, (enabled) => { if (!enabled) compareResults.value = { google: "", myMemory: "" }; });

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => window.addEventListener("keydown", handleGlobalKeydown));

onUnmounted(() => {
  if (autoTranslateTimer) { window.clearTimeout(autoTranslateTimer); autoTranslateTimer = null; }
  window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
  <div class="tool-page translate-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
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
          <v-col cols="12" md="7" class="pr-md-8">
            <h1 class="hero-title mb-2">Translate Studio</h1>
            <p class="hero-subtitle mb-0">
              Clean translation workspace with smart language detection, dual-provider comparison, and quick export.
            </p>
          </v-col>
          <v-col cols="12" md="5" class="hero-stats-col mt-5 mt-md-0">
            <div class="hero-stats">
              <div class="stat-card">
                <span class="stat-value">{{ sourceWords }}</span>
                <span class="stat-label">Words</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ sourceSentences }}</span>
                <span class="stat-label">Sentences</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ readingTimeMinutes }}</span>
                <span class="stat-label">Min Read</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ translatedCharacters }}</span>
                <span class="stat-label">Output Chars</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ autoTranslate ? "On" : "Off" }}</span>
                <span class="stat-label">Auto Translate</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ compareMode ? "On" : "Off" }}</span>
                <span class="stat-label">Compare Mode</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Main tool card ────────────────────────────────────────────────── -->
    <v-container class="py-6 py-md-8">
      <v-row class="ga-0" align="start">
        <v-col cols="12">
          <v-card class="tool-shell pa-4 pa-md-6" rounded="xl" elevation="0">

            <!-- Controls row -->
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
                :disabled="isTranslating || isComparing"
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
              <v-switch
                v-model="compareMode"
                color="secondary"
                hide-details
                density="compact"
                label="Compare"
              />
            </div>

            <!-- ── Text panels ──────────────────────────────────────────── -->
            <v-row>
              <!-- Source panel -->
              <v-col cols="12" md="6">
                <div class="panel-header d-flex align-center ga-1 mb-2">
                  <span class="panel-label">Source</span>
                  <v-spacer />
                  <v-btn
                    icon="mdi-clipboard-arrow-down-outline"
                    size="x-small"
                    variant="text"
                    color="primary"
                    title="Paste from clipboard"
                    @click="pasteFromClipboard"
                  />
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    color="primary"
                    title="Copy source text"
                    :disabled="!sourceText.trim()"
                    @click="copySourceText"
                  />
                </div>
                <v-textarea
                  v-model="sourceText"
                  label="Source text"
                  variant="outlined"
                  rows="10"
                  auto-grow
                  rounded="lg"
                  placeholder="Type or paste text to translate..."
                  :error="isOverLimit"
                />
                <!-- Char progress bar -->
                <v-progress-linear
                  :model-value="charProgress"
                  :color="charProgressColor"
                  rounded
                  height="4"
                  class="char-bar mt-1"
                />
                <div class="d-flex align-center justify-space-between mt-1">
                  <p class="meta-copy mb-0">
                    {{ sourceCharacters }}&thinsp;/&thinsp;{{ MAX_CHARS }} chars &bull; {{ sourceWords }} words
                    <span v-if="detectedLanguage && sourceLanguage === 'auto'">
                      &bull; Detected: {{ languageLabelMap[detectedLanguage] || detectedLanguage }}
                    </span>
                  </p>
                  <span v-if="isOverLimit" class="over-limit-badge">Over limit</span>
                </div>

                <!-- Word frequency -->
                <div v-if="topWords.length" class="freq-row mt-2 d-flex align-center flex-wrap ga-1">
                  <span class="freq-label">Top words:</span>
                  <v-chip
                    v-for="item in topWords"
                    :key="item.word"
                    size="x-small"
                    variant="tonal"
                    color="primary"
                    class="freq-chip"
                  >
                    {{ item.word }}
                    <span class="freq-count">{{ item.count }}</span>
                  </v-chip>
                </div>
              </v-col>

              <!-- Translated panel -->
              <v-col cols="12" md="6">
                <div class="panel-header d-flex align-center ga-1 mb-2">
                  <span class="panel-label">Translation</span>
                  <v-spacer />
                  <v-btn
                    icon="mdi-find-replace"
                    size="x-small"
                    variant="text"
                    color="secondary"
                    title="Find & Replace (Ctrl+H)"
                    :disabled="!translatedText.trim()"
                    @click="showFindReplace = !showFindReplace"
                  />
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    color="primary"
                    title="Copy translation"
                    :disabled="!translatedText.trim()"
                    @click="copyTranslatedText"
                  />
                </div>
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
                <p class="meta-copy mt-1 mb-0">
                  Provider: {{ activeProvider }} &bull; {{ translatedCharacters }} chars
                </p>

                <!-- Find & Replace toolbar -->
                <Transition name="fr-slide">
                  <div v-if="showFindReplace" class="find-replace-bar mt-3 pa-3">
                    <div class="d-flex align-center flex-wrap ga-2">
                      <v-text-field
                        v-model="findText"
                        label="Find"
                        density="compact"
                        variant="outlined"
                        rounded="lg"
                        hide-details
                        class="fr-field"
                        @keyup.enter="doFindReplace"
                      />
                      <v-text-field
                        v-model="replaceText"
                        label="Replace with"
                        density="compact"
                        variant="outlined"
                        rounded="lg"
                        hide-details
                        class="fr-field"
                        @keyup.enter="doFindReplace"
                      />
                      <v-btn
                        color="secondary"
                        rounded="lg"
                        size="small"
                        class="text-none"
                        :disabled="!findText"
                        @click="doFindReplace"
                      >
                        Replace All
                      </v-btn>
                      <v-btn
                        icon="mdi-close"
                        variant="text"
                        size="small"
                        @click="closeFindReplace"
                      />
                    </div>
                  </div>
                </Transition>
              </v-col>
            </v-row>

            <!-- ── Action buttons ────────────────────────────────────────── -->
            <div class="d-flex align-center flex-wrap ga-2 mt-4">
              <!-- Normal translate -->
              <v-btn
                v-if="!compareMode"
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

              <!-- Compare translate -->
              <v-btn
                v-else
                color="secondary"
                rounded="lg"
                class="text-none"
                :loading="isComparing"
                :disabled="!sourceText.trim() || isComparing || isOverLimit"
                @click="runComparison"
              >
                <v-icon start icon="mdi-compare" />
                Compare Providers
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

              <v-spacer />
              <span v-if="isOverLimit" class="over-limit-hint">
                <v-icon size="14" color="error">mdi-alert-circle</v-icon>
                {{ sourceCharacters - MAX_CHARS }} chars over limit
              </span>
            </div>
          </v-card>

          <!-- ── Dual-provider comparison results ────────────────────────── -->
          <Transition name="compare-reveal">
            <v-card
              v-if="compareMode && (compareResults.google || compareResults.myMemory)"
              class="compare-card mt-4 pa-4 pa-md-5"
              rounded="xl"
              elevation="0"
            >
              <div class="d-flex align-center mb-4 ga-2">
                <v-icon color="secondary" size="18">mdi-compare</v-icon>
                <span class="compare-heading">Provider Comparison</span>
                <v-spacer />
                <span class="meta-copy">Click "Use this" to apply a result</span>
              </div>
              <v-row>
                <v-col cols="12" md="6">
                  <div class="compare-panel">
                    <div class="compare-panel-header d-flex align-center ga-2 mb-2">
                      <v-icon size="16" color="primary">mdi-google</v-icon>
                      <span class="compare-provider-name">Google Translate</span>
                    </div>
                    <div class="compare-result-text">{{ compareResults.google || "—" }}</div>
                    <v-btn
                      variant="tonal"
                      color="primary"
                      size="small"
                      rounded="lg"
                      class="text-none mt-3"
                      :disabled="!compareResults.google || compareResults.google.startsWith('Error')"
                      @click="useCompareResult('google')"
                    >
                      <v-icon start icon="mdi-check" />
                      Use this
                    </v-btn>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="compare-panel">
                    <div class="compare-panel-header d-flex align-center ga-2 mb-2">
                      <v-icon size="16" color="secondary">mdi-brain</v-icon>
                      <span class="compare-provider-name">MyMemory</span>
                    </div>
                    <div class="compare-result-text">{{ compareResults.myMemory || "—" }}</div>
                    <v-btn
                      variant="tonal"
                      color="secondary"
                      size="small"
                      rounded="lg"
                      class="text-none mt-3"
                      :disabled="!compareResults.myMemory || compareResults.myMemory.startsWith('Error')"
                      @click="useCompareResult('myMemory')"
                    >
                      <v-icon start icon="mdi-check" />
                      Use this
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </Transition>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
/* ── Page shell ────────────────────────────────────────────────────────────── */
.translate-page .hero-shell {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: transparent;
}

/* ── Hero typography ───────────────────────────────────────────────────────── */
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

/* ── Stat cards ────────────────────────────────────────────────────────────── */
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

/* ── Tool card ─────────────────────────────────────────────────────────────── */
.tool-shell {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface), 0.9);
  box-shadow: none;
}

/* ── Language select ───────────────────────────────────────────────────────── */
.lang-select {
  min-width: 180px;
  max-width: 220px;
}

/* ── Panel headers ─────────────────────────────────────────────────────────── */
.panel-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* ── Char bar ──────────────────────────────────────────────────────────────── */
.char-bar {
  transition: all 0.3s ease;
}

/* ── Meta text ─────────────────────────────────────────────────────────────── */
.meta-copy {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.78rem;
}

/* ── Over-limit badge ──────────────────────────────────────────────────────── */
.over-limit-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(var(--v-theme-error));
  letter-spacing: 0.04em;
}

.over-limit-hint {
  font-size: 0.78rem;
  color: rgb(var(--v-theme-error));
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Word frequency ────────────────────────────────────────────────────────── */
.freq-row {
  min-height: 26px;
}

.freq-label {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 600;
  white-space: nowrap;
}

.freq-chip {
  font-size: 0.7rem !important;
}

.freq-count {
  margin-left: 4px;
  opacity: 0.65;
  font-size: 0.65rem;
}

/* ── Find & Replace bar ────────────────────────────────────────────────────── */
.find-replace-bar {
  border: 1px solid rgba(var(--v-theme-secondary), 0.3);
  border-radius: 12px;
  background: rgba(var(--v-theme-secondary), 0.05);
}

.fr-field {
  min-width: 140px;
  flex: 1;
}

/* ── Find & Replace slide transition ───────────────────────────────────────── */
.fr-slide-enter-active,
.fr-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.fr-slide-enter-from,
.fr-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Comparison card ───────────────────────────────────────────────────────── */
.compare-card {
  border: 1px solid rgba(var(--v-theme-secondary), 0.22);
  background: rgba(var(--v-theme-surface), 0.9);
  box-shadow: none;
}

.compare-heading {
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}

.compare-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  padding: 14px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.compare-panel-header {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding-bottom: 8px;
}

.compare-provider-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.compare-result-text {
  font-size: 0.92rem;
  line-height: 1.65;
  color: rgb(var(--v-theme-on-surface));
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  margin-top: 8px;
}

/* ── Compare reveal transition ─────────────────────────────────────────────── */
.compare-reveal-enter-active,
.compare-reveal-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.compare-reveal-enter-from,
.compare-reveal-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .hero-stats-col {
    display: none !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  .lang-select {
    min-width: 100%;
    max-width: 100%;
  }
  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
