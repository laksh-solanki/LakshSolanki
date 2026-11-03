<script setup>
import { computed, ref } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { generateSmartPromptEnhancement } from "@/utils/aiEngines";

const props = defineProps({
  isDarkTheme: { type: Boolean, default: false },
  requestAiReply: { type: Function, default: null },
});

const emit = defineEmits(["show-alert", "send-to-chat"]);

const rawPrompt = ref("Build a full-stack real-time collaborative document editor with presence indicators and offline persistence.");
const selectedFramework = ref("rtce");
const targetModel = ref("universal");
const isEnhancing = ref(false);
const enhancedResult = ref("");

const frameworkOptions = [
  { label: "Role, Task, Context & Constraints (RTCE)", value: "rtce" },
  { label: "Chain-of-Thought (Step-by-Step)", value: "cot" },
  { label: "Senior Engineer Production Spec", value: "spec" },
];

const modelOptions = [
  { label: "Universal (Works across all models)", value: "universal" },
  { label: "Gemini 2.5 Flash / Pro Optimized", value: "gemini" },
  { label: "OpenAI GPT-4o / Reasoning", value: "openai" },
  { label: "Anthropic Claude 3.5 Sonnet", value: "claude" },
];

const renderedEnhanced = computed(() => {
  if (!enhancedResult.value) return "";
  try {
    return DOMPurify.sanitize(marked.parse(enhancedResult.value));
  } catch {
    return enhancedResult.value;
  }
});

const runEnhance = async () => {
  const prompt = rawPrompt.value.trim();
  if (!prompt) {
    emit("show-alert", "Please enter a prompt or idea to enhance.", "error");
    return;
  }

  isEnhancing.value = true;
  enhancedResult.value = "";

  let success = false;
  if (typeof props.requestAiReply === "function") {
    try {
      const frameworkObj = frameworkOptions.find((f) => f.value === selectedFramework.value);
      const instruction = `Act as an elite Prompt Engineer and AI System Architect.
Transform this raw prompt into a master-grade, production-ready system prompt using the "${frameworkObj?.label || selectedFramework.value}" methodology.
Optimize for: ${targetModel.value}.

Raw Prompt:
"""
${prompt}
"""

Format cleanly with clear markdown sections:
- Role & Persona
- Core Objective & Task
- Context & Assumptions
- Strict Negative Constraints (Hallucination reduction)
- Few-Shot Verification Scenarios & Expected Output Schema`;

      const reply = await props.requestAiReply(instruction, "You are a principal prompt architect.");
      if (reply && reply.trim()) {
        enhancedResult.value = reply;
        success = true;
      }
    } catch {
      success = false;
    }
  }

  if (!success) {
    const local = generateSmartPromptEnhancement(prompt, selectedFramework.value, targetModel.value);
    enhancedResult.value = local.enhanced;
  }

  isEnhancing.value = false;
  emit("show-alert", "Prompt enhanced successfully!", "success");
};

const copyEnhanced = async () => {
  if (!enhancedResult.value) return;
  try {
    await navigator.clipboard.writeText(enhancedResult.value);
    emit("show-alert", "Enhanced prompt copied to clipboard!", "success");
  } catch {
    emit("show-alert", "Failed to copy prompt.", "error");
  }
};

const downloadEnhanced = () => {
  if (!enhancedResult.value) return;
  const blob = new Blob([enhancedResult.value], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `enhanced-prompt-${selectedFramework.value}-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  emit("show-alert", "Enhanced prompt downloaded as .md", "success");
};

const sendToChat = () => {
  if (!enhancedResult.value) return;
  emit("send-to-chat", enhancedResult.value);
};

const clearAll = () => {
  rawPrompt.value = "";
  enhancedResult.value = "";
};
</script>

<template>
  <div class="tool-workspace pa-4 pa-md-6" :class="{ 'theme-dark': isDarkTheme }">
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-between ga-3 mb-5">
      <div>
        <h2 class="text-h6 font-weight-bold d-flex align-center ga-2 mb-1">
          <v-icon icon="mdi-auto-fix" color="primary" />
          Prompt Enhancer & Architect
        </h2>
        <p class="text-body-2 text-grey mb-0">
          Transform raw, ambiguous instructions into structured, hallucination-resistant system prompts with XML tags and constraints.
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
        <div style="min-width: 260px;" class="flex-grow-1">
          <label class="text-caption font-weight-bold mb-1 d-block">Prompting Framework</label>
          <v-select
            v-model="selectedFramework"
            :items="frameworkOptions"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            aria-label="Select Prompting Framework"
          />
        </div>

        <div style="min-width: 220px;" class="flex-grow-1">
          <label class="text-caption font-weight-bold mb-1 d-block">Target Model</label>
          <v-select
            v-model="targetModel"
            :items="modelOptions"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            aria-label="Select Target Model"
          />
        </div>

        <div class="d-flex align-end mt-4 mt-sm-0">
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            prepend-icon="mdi-magic-staff"
            :loading="isEnhancing"
            :disabled="isEnhancing || !rawPrompt.trim()"
            class="text-none font-weight-bold rounded-lg px-6"
            @click="runEnhance"
          >
            Enhance Prompt
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Editors Grid -->
    <div class="tool-split-grid">
      <!-- Input Column -->
      <v-card class="rounded-xl border pa-4 input-card">
        <div class="d-flex align-center justify-between mb-2">
          <span class="text-caption font-weight-bold text-uppercase text-grey">Raw Prompt / Initial Idea</span>
          <span class="text-caption text-grey">{{ rawPrompt.length }} chars</span>
        </div>
        <v-textarea
          v-model="rawPrompt"
          placeholder="e.g. Build an authentication system, write marketing copy for SaaS..."
          variant="outlined"
          rows="14"
          auto-grow
          hide-details
          class="prompt-textarea"
          aria-label="Raw prompt input"
        />
      </v-card>

      <!-- Output Column -->
      <v-card class="rounded-xl border pa-4 output-card">
        <div class="d-flex align-center justify-between mb-2">
          <span class="text-caption font-weight-bold text-uppercase text-primary">Engineered Prompt</span>
          <div class="d-flex ga-1" v-if="enhancedResult">
            <v-btn icon="mdi-content-copy" size="x-small" variant="text" aria-label="Copy Enhanced Prompt" @click="copyEnhanced" />
            <v-btn icon="mdi-download" size="x-small" variant="text" aria-label="Download Enhanced Prompt" @click="downloadEnhanced" />
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-chat-processing-outline"
              class="text-none font-weight-bold ml-1"
              aria-label="Use in Mindlytic Chat"
              @click="sendToChat"
            >
              Send to Chat
            </v-btn>
          </div>
        </div>

        <div v-if="isEnhancing" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="36" class="mb-3" />
          <p class="text-body-2 text-grey">Hardening constraints & structuring system directives...</p>
        </div>

        <div v-else-if="enhancedResult" class="enhanced-output-scroll">
          <div class="markdown-body" v-html="renderedEnhanced"></div>
        </div>

        <div v-else class="text-center py-12 text-grey">
          <v-icon icon="mdi-auto-fix" size="48" class="mb-2 opacity-50" />
          <p class="text-body-2 font-weight-medium">Ready to architect</p>
          <span class="text-caption">Click "Enhance Prompt" to generate an enterprise-grade prompt structure.</span>
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

.enhanced-output-scroll {
  max-height: 480px;
  overflow-y: auto;
}
</style>
