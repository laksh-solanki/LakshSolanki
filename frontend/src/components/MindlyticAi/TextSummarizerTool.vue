<script setup>
import { computed, ref } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { generateSmartSummary } from "@/utils/aiEngines";

const props = defineProps({
  isDarkTheme: { type: Boolean, default: false },
  requestAiReply: { type: Function, default: null },
});

const emit = defineEmits(["show-alert", "send-to-chat"]);

const rawText = ref(`Modern web applications face increasing complexity as distributed architectures, microservices, and asynchronous event streams become standard. While separating services into decoupled modules allows independent team velocity, it introduces operational trade-offs such as network latency, distributed state inconsistency, and complex observability challenges. Engineers must balance the overhead of container orchestration with simple monolithic deployments. Automated CI/CD pipelines, comprehensive integration test suites, and strict API schema contracts (such as OpenAPI or gRPC) are critical prerequisites before splitting a monolith. Without rigorous telemetry and distributed tracing, debugging issues across service boundaries becomes exponentially harder.`);

const selectedMode = ref("bullet_points");
const selectedLength = ref("medium");
const isProcessing = ref(false);
const summaryResult = ref("");
const stats = ref({
  originalWords: 0,
  summaryWords: 0,
  reduction: 0,
  readingTime: 0,
});

const modeOptions = [
  { label: "Key Bullet Points", value: "bullet_points", icon: "mdi-format-list-bulleted" },
  { label: "Executive Summary", value: "executive", icon: "mdi-file-certificate-outline" },
  { label: "Professional Tone", value: "professional", icon: "mdi-tie" },
  { label: "Simplify (ELI5)", value: "simplify", icon: "mdi-emoticon-happy-outline" },
  { label: "Action Items & Next Steps", value: "action_items", icon: "mdi-checkbox-marked-outline" },
];

const lengthOptions = [
  { label: "Short & Punchy", value: "short" },
  { label: "Balanced", value: "medium" },
  { label: "In-Depth", value: "detailed" },
];

const renderedSummary = computed(() => {
  if (!summaryResult.value) return "";
  try {
    return DOMPurify.sanitize(marked.parse(summaryResult.value));
  } catch {
    return summaryResult.value;
  }
});

const runSummarize = async () => {
  const text = rawText.value.trim();
  if (!text) {
    emit("show-alert", "Please paste or enter text to summarize.", "error");
    return;
  }

  isProcessing.value = true;
  summaryResult.value = "";

  const originalWords = text.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(originalWords / 200));

  let aiSuccess = false;
  if (typeof props.requestAiReply === "function") {
    try {
      const modeLabel = modeOptions.find((m) => m.value === selectedMode.value)?.label || selectedMode.value;
      const prompt = `Please process the following text using task: "${modeLabel}", with length: "${selectedLength.value}".

Input Text:
"""
${text}
"""

Format your response cleanly in Markdown with bold headers and clear structure.`;

      const reply = await props.requestAiReply(prompt, "You are an executive editor and text summarization specialist.");
      if (reply && reply.trim()) {
        aiSuccess = true;
        summaryResult.value = reply;
        const sumWords = reply.split(/\s+/).filter(Boolean).length;
        stats.value = {
          originalWords,
          summaryWords: sumWords,
          reduction: Math.max(0, Math.round(((originalWords - sumWords) / originalWords) * 100)),
          readingTime,
        };
      }
    } catch {
      aiSuccess = false;
    }
  }

  if (!aiSuccess) {
    const local = generateSmartSummary(text, selectedMode.value, selectedLength.value);
    summaryResult.value = local.summary;
    stats.value = {
      originalWords: local.wordCountOriginal,
      summaryWords: local.wordCountSummary,
      reduction: local.reductionPercent,
      readingTime: local.readingTimeMin,
    };
  }

  isProcessing.value = false;
  emit("show-alert", "Text summarized successfully!", "success");
};

const copyResult = async () => {
  if (!summaryResult.value) return;
  try {
    await navigator.clipboard.writeText(summaryResult.value);
    emit("show-alert", "Summary copied to clipboard!", "success");
  } catch {
    emit("show-alert", "Failed to copy summary.", "error");
  }
};

const downloadResult = () => {
  if (!summaryResult.value) return;
  const blob = new Blob([summaryResult.value], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mindlytic-summary-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  emit("show-alert", "Summary downloaded as .md", "success");
};

const sendToChat = () => {
  if (!summaryResult.value) return;
  emit("send-to-chat", `Here is a summary I generated:\n\n${summaryResult.value}\n\nPlease expand on the implications of this.`);
};

const clearAll = () => {
  rawText.value = "";
  summaryResult.value = "";
};
</script>

<template>
  <div class="tool-workspace pa-4 pa-md-6" :class="{ 'theme-dark': isDarkTheme }">
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-between ga-3 mb-5">
      <div>
        <h2 class="text-h6 font-weight-bold d-flex align-center ga-2 mb-1">
          <v-icon icon="mdi-text-box-search-outline" color="primary" />
          Text Summarizer & Rewriter
        </h2>
        <p class="text-body-2 text-grey mb-0">
          Transform long-form text, essays, and reports into executive summaries, bullet points, or beginner-friendly insights.
        </p>
      </div>

      <div class="d-flex ga-2">
        <v-btn
          variant="text"
          density="comfortable"
          size="small"
          prepend-icon="mdi-trash-can-outline"
          class="text-none"
          @click="clearAll"
        >
          Clear
        </v-btn>
      </div>
    </div>

    <!-- Controls Row -->
    <v-card class="pa-4 mb-4 rounded-xl border tool-controls-card">
      <div class="d-flex flex-wrap align-center ga-3">
        <div style="min-width: 220px;" class="flex-grow-1">
          <label class="text-caption font-weight-bold mb-1 d-block">Summarization Style</label>
          <v-select
            v-model="selectedMode"
            :items="modeOptions"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            aria-label="Select Summarization Style"
          />
        </div>

        <div style="min-width: 170px;" class="flex-grow-1">
          <label class="text-caption font-weight-bold mb-1 d-block">Target Length</label>
          <v-select
            v-model="selectedLength"
            :items="lengthOptions"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            aria-label="Select Target Length"
          />
        </div>

        <div class="d-flex align-end mt-4 mt-sm-0">
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            prepend-icon="mdi-lightning-bolt"
            :loading="isProcessing"
            :disabled="isProcessing || !rawText.trim()"
            class="text-none font-weight-bold rounded-lg px-6"
            @click="runSummarize"
          >
            Summarize Now
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Stats Banner if summary exists -->
    <v-card v-if="summaryResult" class="pa-3 mb-4 rounded-xl border bg-surface-light d-flex flex-wrap ga-4 justify-space-around align-center text-center">
      <div>
        <span class="text-caption text-grey d-block">Original Length</span>
        <strong class="text-body-2">{{ stats.originalWords }} words (~{{ stats.readingTime }}m read)</strong>
      </div>
      <div>
        <span class="text-caption text-grey d-block">Summary Length</span>
        <strong class="text-body-2 text-primary">{{ stats.summaryWords }} words</strong>
      </div>
      <div>
        <span class="text-caption text-grey d-block">Reduction</span>
        <strong class="text-body-2 text-success">{{ stats.reduction }}% shorter</strong>
      </div>
    </v-card>

    <!-- Editors Grid -->
    <div class="tool-split-grid">
      <!-- Input Column -->
      <v-card class="rounded-xl border pa-4 input-card">
        <div class="d-flex align-center justify-between mb-2">
          <span class="text-caption font-weight-bold text-uppercase text-grey">Input Text</span>
          <span class="text-caption text-grey">{{ rawText.split(/\s+/).filter(Boolean).length }} words</span>
        </div>
        <v-textarea
          v-model="rawText"
          placeholder="Paste articles, documents, notes, or transcripts here..."
          variant="outlined"
          rows="14"
          auto-grow
          hide-details
          class="text-input"
          aria-label="Text input for summarizer"
        />
      </v-card>

      <!-- Output Column -->
      <v-card class="rounded-xl border pa-4 output-card">
        <div class="d-flex align-center justify-between mb-2">
          <span class="text-caption font-weight-bold text-uppercase text-primary">Summary Output</span>
          <div class="d-flex ga-1" v-if="summaryResult">
            <v-btn icon="mdi-content-copy" size="x-small" variant="text" aria-label="Copy Summary" @click="copyResult" />
            <v-btn icon="mdi-download" size="x-small" variant="text" aria-label="Download Summary" @click="downloadResult" />
            <v-btn icon="mdi-chat-processing-outline" size="x-small" variant="text" color="primary" aria-label="Send to Chat" @click="sendToChat" />
          </div>
        </div>

        <div v-if="isProcessing" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="36" class="mb-3" />
          <p class="text-body-2 text-grey">Condensing key points & extracting insights...</p>
        </div>

        <div v-else-if="summaryResult" class="summary-output-scroll">
          <div class="markdown-body" v-html="renderedSummary"></div>
        </div>

        <div v-else class="text-center py-12 text-grey">
          <v-icon icon="mdi-text-box-check-outline" size="48" class="mb-2 opacity-50" />
          <p class="text-body-2 font-weight-medium">Ready to summarize</p>
          <span class="text-caption">Click "Summarize Now" to extract key points and action items.</span>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.tool-workspace {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.tool-controls-card {
  background-color: rgba(var(--v-theme-on-surface), 0.02) !important;
}

.tool-split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .tool-split-grid {
    grid-template-columns: 1fr;
  }
}

.input-card, .output-card {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  display: flex;
  flex-direction: column;
}

.summary-output-scroll {
  max-height: 480px;
  overflow-y: auto;
}
</style>
