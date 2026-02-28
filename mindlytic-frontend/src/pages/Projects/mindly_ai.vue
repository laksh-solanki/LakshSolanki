<template>
  <div class="ai-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-8">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl" class="text-none">
            Back
          </v-btn>
          <div class="d-flex align-center ga-2 flex-wrap">
            <v-chip
              v-for="model in modelCatalog"
              :key="model.id"
              size="small"
              variant="flat"
              :color="model.available ? 'teal' : 'grey'"
            >
              {{ model.short }}: {{ model.available ? "Ready" : "No key" }}
            </v-chip>
          </div>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" class="pr-md-8">
            <p class="hero-kicker mb-2">Mindlytic AI Workspace</p>
            <h1 class="hero-title mb-3">Premium AI Chat Studio</h1>
            <p class="hero-subtitle mb-0">
              Gemini-powered chat with richer prompting tools, export, regenerate, stop generation, and markdown/code rendering.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="mt-5 mt-md-0">
            <div class="hero-stats">
              <div class="stat-card">
                <span class="stat-value">{{ userMessageCount }}</span>
                <span class="stat-label">Prompts</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ assistantMessageCount }}</span>
                <span class="stat-label">Replies</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">{{ lastResponseLabel }}</span>
                <span class="stat-label">Last Reply</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-6">
      <v-row class="ga-0">
        <v-col cols="12" lg="4" class="pr-lg-5 mb-6 mb-lg-0">
          <v-card class="panel pa-5 mb-5" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Model</p>
            <v-btn-toggle v-model="selectedModel" class="w-100" mandatory divided>
              <v-btn
                v-for="model in modelCatalog"
                :key="model.id"
                :value="model.id"
                :disabled="!model.available"
                class="text-none"
              >
                <v-icon :icon="model.icon" start />
                {{ model.short }}
              </v-btn>
            </v-btn-toggle>
            <p class="text-body-2 text-medium-emphasis mt-3 mb-0">{{ currentModel.description }}</p>
          </v-card>

          <v-card class="panel pa-5 mb-5" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Controls</p>
            <v-select
              v-model="selectedPersona"
              :items="personaOptions"
              item-title="label"
              item-value="id"
              label="Assistant Mode"
              variant="solo-filled"
              rounded="lg"
              hide-details
              class="mb-4"
            ></v-select>
            <v-slider v-model="temperature" min="0" max="1.5" step="0.1" thumb-label color="primary" class="mb-3">
              <template #label>Creativity</template>
              <template #append><span class="text-caption">{{ temperature.toFixed(1) }}</span></template>
            </v-slider>
            <v-slider v-model="maxOutputTokens" min="300" max="2000" step="100" thumb-label color="primary">
              <template #label>Max Output</template>
              <template #append><span class="text-caption">{{ maxOutputTokens }}</span></template>
            </v-slider>
          </v-card>

          <v-card class="panel pa-5 mb-5" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Quick Prompts</p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip v-for="item in quickPrompts" :key="item.id" label color="teal-lighten-5" class="quick-chip" @click="insertPrompt(item)">
                {{ item.label }}
              </v-chip>
            </div>
          </v-card>

          <v-card class="panel pa-5" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Session</p>
            <div class="d-flex flex-column ga-2">
              <v-btn color="primary" prepend-icon="mdi-plus" class="text-none" rounded="lg" @click="resetChat">New Chat</v-btn>
              <v-btn
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-refresh"
                class="text-none"
                rounded="lg"
                :disabled="loading || !canRegenerate"
                @click="regenerateLastReply"
              >
                Regenerate
              </v-btn>
              <v-btn
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-download"
                class="text-none"
                rounded="lg"
                :disabled="messages.length === 0"
                @click="exportChat"
              >
                Export Markdown
              </v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="8">
          <v-card class="chat-shell" rounded="xl" elevation="0">
            <div class="chat-head">
              <div class="d-flex align-center ga-2">
                <v-chip size="small" color="primary">{{ currentModel.label }}</v-chip>
                <v-chip size="small" color="teal" variant="outlined">{{ selectedPersonaLabel }}</v-chip>
              </div>
              <p class="text-caption mb-0 text-medium-emphasis">Enter to send, Shift+Enter for newline</p>
            </div>

            <div ref="chatContainer" class="chat-stream" @click="handleChatClick">
              <div class="chat-inner">
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  :class="['message-row', msg.role === 'user' ? 'justify-end' : 'justify-start']"
                >
                  <div :class="['bubble', msg.role === 'user' ? 'bubble-user' : 'bubble-ai', msg.error ? 'bubble-error' : '']">
                    <div class="bubble-meta">
                      <span>{{ msg.role === "user" ? "You" : getModelShortName(msg.model || selectedModel) }}</span>
                      <span>{{ formatTime(msg.createdAt) }}</span>
                    </div>
                    <div v-if="msg.role === 'assistant'" class="markdown-body" v-html="parseMessage(msg.text)"></div>
                    <p v-else class="mb-0 user-text">{{ msg.text }}</p>
                    <div v-if="msg.role === 'assistant'" class="d-flex justify-end mt-2">
                      <button class="mini-btn" @click.stop="copyMessage(msg.text)">Copy reply</button>
                    </div>
                  </div>
                </div>

                <div v-if="loading" class="message-row justify-start">
                  <div class="bubble bubble-ai">
                    <div class="typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="composer">
              <v-textarea
                v-model="userInput"
                :placeholder="composerPlaceholder"
                auto-grow
                rows="2"
                max-rows="7"
                variant="solo-filled"
                rounded="lg"
                hide-details
                :disabled="loading || !hasSelectedApiKey"
                @keydown="handlePromptKeydown"
              ></v-textarea>
              <div class="d-flex justify-space-between align-center flex-wrap ga-2 mt-3">
                <div class="d-flex align-center ga-2">
                  <v-btn color="error" variant="tonal" rounded="lg" class="text-none" prepend-icon="mdi-stop" :disabled="!loading" @click="stopGeneration">
                    Stop
                  </v-btn>
                </div>
                <v-btn
                  color="primary"
                  rounded="lg"
                  class="text-none"
                  prepend-icon="mdi-send"
                  :loading="loading"
                  :disabled="sendDisabled"
                  @click="sendMessage"
                >
                  Send
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Prism from "prismjs";
import Alerts from "@/components/Alerts.vue";

import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";

const STORAGE_KEY = "mindlytic_ai_studio_v3";
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || "").trim();

const modelCatalog = [
  {
    id: "gemini",
    short: "Gemini",
    label: "Gemini 2.5 Flash",
    modelName: "gemini-2.5-flash",
    available: Boolean(GEMINI_API_KEY),
    icon: "mdi-google-circles-communities",
    description: "Fast reasoning and strong for coding workflows.",
  },
];

const personaOptions = [
  {
    id: "balanced",
    label: "Balanced Assistant",
    prompt: "You are Mindlytic AI. Give practical, concise, and structured answers with useful steps.",
  },
  {
    id: "builder",
    label: "Engineering Builder",
    prompt: "You are a senior software engineer. Focus on implementation details, edge cases, and testability.",
  },
  {
    id: "mentor",
    label: "Learning Mentor",
    prompt: "You are a patient mentor. Explain simply first, then provide deeper detail and action items.",
  },
];

const quickPrompts = [
  { id: "plan", label: "Sprint Plan", text: "Create a one-week sprint plan with priorities and acceptance criteria for:" },
  { id: "debug", label: "Debug Guide", text: "Help me debug this issue step-by-step. Start by asking for key logs:" },
  { id: "refactor", label: "Refactor", text: "Suggest a safe refactor strategy with concrete before/after examples for:" },
  { id: "pitch", label: "Product Pitch", text: "Turn this into a concise product pitch with problem/solution/value:" },
];

const fallbackModel = modelCatalog.find((m) => m.available)?.id || "gemini";

const selectedModel = ref(fallbackModel);
const selectedPersona = ref("balanced");
const temperature = ref(0.7);
const maxOutputTokens = ref(900);
const userInput = ref("");
const loading = ref(false);
const lastResponseMs = ref(0);

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const chatContainer = ref(null);

const messages = ref([]);
let nextId = 1;
let activeController = null;

const currentModel = computed(() => modelCatalog.find((m) => m.id === selectedModel.value) || modelCatalog[0]);
const selectedPersonaData = computed(() => personaOptions.find((p) => p.id === selectedPersona.value) || personaOptions[0]);
const selectedPersonaLabel = computed(() => selectedPersonaData.value.label);
const hasSelectedApiKey = computed(() => Boolean(currentModel.value.available));
const composerPlaceholder = computed(() =>
  hasSelectedApiKey.value ? `Message ${currentModel.value.short}...` : "Set VITE_GEMINI_API_KEY to enable Gemini",
);
const sendDisabled = computed(() => loading.value || !userInput.value.trim() || !hasSelectedApiKey.value);
const canRegenerate = computed(() => messages.value.some((m) => m.role === "user"));
const userMessageCount = computed(() => messages.value.filter((m) => m.role === "user").length);
const assistantMessageCount = computed(() => messages.value.filter((m) => m.role === "assistant").length);
const lastResponseLabel = computed(() => (lastResponseMs.value ? `${(lastResponseMs.value / 1000).toFixed(1)}s` : "--"));

const goBack = () => window.history.back();
const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const createMessage = (role, text, options = {}) => ({
  id: nextId++,
  role,
  text,
  model: options.model || null,
  error: Boolean(options.error),
  createdAt: new Date().toISOString(),
});

const buildWelcomeText = () => {
  const available = modelCatalog.filter((m) => m.available).map((m) => m.short);
  if (!available.length) {
    return "AI chat is unavailable. Add VITE_GEMINI_API_KEY in your frontend .env file.";
  }
  return `Welcome to Mindlytic AI Studio. Available models: ${available.join(" + ")}.`;
};

const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const getModelShortName = (id) => modelCatalog.find((m) => m.id === id)?.short || "Assistant";

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
};

marked.setOptions({ breaks: true, gfm: true });
const renderer = new marked.Renderer();
const languageAlias = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  html: "markup",
  xml: "markup",
};

const normalizeCodeLanguage = (value = "") => {
  const normalized = value.toLowerCase();
  return languageAlias[normalized] || normalized || "plaintext";
};

renderer.code = ({ text, lang }) => {
  const language = (lang || "plaintext").trim();
  const safeLanguage = normalizeCodeLanguage(language);
  const grammar = Prism.languages[safeLanguage] || Prism.languages.plaintext;
  const html = Prism.highlight(text, grammar, safeLanguage);

  return `<div class="code-block-wrapper"><div class="code-header"><div class="code-header-left"><span class="code-dot dot-red"></span><span class="code-dot dot-yellow"></span><span class="code-dot dot-green"></span><span class="lang-label">${language || "plaintext"}</span></div><button class="copy-btn" aria-label="Copy code">Copy</button></div><pre class="language-${safeLanguage}"><code class="language-${safeLanguage}">${html}</code></pre></div>`;
};
marked.use({ renderer });

const parseMessage = (rawText) =>
  DOMPurify.sanitize(marked.parse(rawText || ""), {
    ADD_TAGS: ["button"],
    ADD_ATTR: ["class", "aria-label"],
  });

const copyMessage = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showAlert("Reply copied.");
  } catch (error) {
    console.error("copy failed", error);
    showAlert("Unable to copy reply.", "error");
  }
};

const handleChatClick = async (event) => {
  const button = event.target.closest(".copy-btn");
  if (!button) return;
  const code = button.closest(".code-block-wrapper")?.querySelector("code");
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code.innerText);
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = "Copy";
    }, 1500);
  } catch (error) {
    console.error("copy code failed", error);
    showAlert("Unable to copy code block.", "error");
  }
};

const buildGeminiHistory = () =>
  messages.value
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));

const readApiError = async (response) => {
  try {
    const data = await response.json();
    return data?.error?.message || data?.error || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
};

const requestGemini = async (signal) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel.value.modelName}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY,
  )}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      system_instruction: { parts: [{ text: selectedPersonaData.value.prompt }] },
      contents: buildGeminiHistory(),
      generationConfig: { temperature: temperature.value, maxOutputTokens: maxOutputTokens.value },
    }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
};

const generateAssistantReply = async () => {
  if (!hasSelectedApiKey.value) {
    showAlert("Missing API key for selected model.", "error");
    return;
  }
  activeController = new AbortController();
  loading.value = true;
  const started = Date.now();
  await scrollToBottom();
  try {
    const reply = await requestGemini(activeController.signal);
    lastResponseMs.value = Date.now() - started;
    messages.value.push(createMessage("assistant", reply, { model: selectedModel.value }));
  } catch (error) {
    if (error?.name === "AbortError") {
      showAlert("Generation stopped.", "error");
      return;
    }
    const errorMessage = String(error?.message || "Unknown error");
    console.error("ai error", error);
    messages.value.push(createMessage("assistant", `Sorry, an error occurred.\n\n${errorMessage}`, { model: selectedModel.value, error: true }));
  } finally {
    loading.value = false;
    activeController = null;
    await scrollToBottom();
  }
};

const sendMessage = async () => {
  const prompt = userInput.value.trim();
  if (!prompt || loading.value) return;
  messages.value.push(createMessage("user", prompt, { model: selectedModel.value }));
  userInput.value = "";
  await generateAssistantReply();
};

const stopGeneration = () => {
  if (activeController) activeController.abort();
};

const resetChat = () => {
  stopGeneration();
  messages.value = [createMessage("assistant", buildWelcomeText(), { model: selectedModel.value })];
  showAlert("New chat started.");
  scrollToBottom();
};

const regenerateLastReply = async () => {
  if (loading.value) return;
  const lastUser = [...messages.value].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    showAlert("No user prompt found.", "error");
    return;
  }
  if (messages.value[messages.value.length - 1]?.role === "assistant") messages.value.pop();
  await generateAssistantReply();
};

const insertPrompt = (item) => {
  const prefix = userInput.value.trim() ? `${userInput.value.trim()}\n\n` : "";
  userInput.value = `${prefix}${item.text}`;
};

const exportChat = () => {
  const lines = [
    "# Mindlytic AI Studio Export",
    `- Exported: ${new Date().toISOString()}`,
    `- Model: ${currentModel.value.label}`,
    `- Persona: ${selectedPersonaLabel.value}`,
    "",
  ];
  messages.value.forEach((m) => {
    const role = m.role === "user" ? "User" : getModelShortName(m.model || selectedModel.value);
    lines.push(`## ${role} (${formatTime(m.createdAt)})`);
    lines.push(m.text);
    lines.push("");
  });
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mindlytic-ai-chat-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showAlert("Chat exported.");
};

const handlePromptKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const saveState = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      selectedModel: selectedModel.value,
      selectedPersona: selectedPersona.value,
      temperature: temperature.value,
      maxOutputTokens: maxOutputTokens.value,
      messages: messages.value.slice(-80),
      nextId,
    }),
  );
};

const restoreState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (modelCatalog.some((m) => m.id === parsed.selectedModel)) selectedModel.value = parsed.selectedModel;
    if (personaOptions.some((p) => p.id === parsed.selectedPersona)) selectedPersona.value = parsed.selectedPersona;
    if (typeof parsed.temperature === "number") temperature.value = Math.min(1.5, Math.max(0, parsed.temperature));
    if (typeof parsed.maxOutputTokens === "number") maxOutputTokens.value = Math.min(2000, Math.max(300, parsed.maxOutputTokens));
    if (Array.isArray(parsed.messages)) {
      messages.value = parsed.messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string");
    }
    nextId = typeof parsed.nextId === "number" ? parsed.nextId : Math.max(1, ...messages.value.map((m, i) => (m.id || i) + 1));
    return messages.value.length > 0;
  } catch (error) {
    console.error("restore failed", error);
    return false;
  }
};

watch([messages, selectedModel, selectedPersona, temperature, maxOutputTokens], saveState, { deep: true });

watch(selectedModel, (value) => {
  const model = modelCatalog.find((item) => item.id === value);
  if (model && !model.available) showAlert(`Missing API key for ${model.short}.`, "error");
});

onMounted(async () => {
  if (!restoreState()) messages.value = [createMessage("assistant", buildWelcomeText(), { model: selectedModel.value })];
  await scrollToBottom();
});

onUnmounted(() => {
  stopGeneration();
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap");

.ai-page {
  min-height: calc(100vh - 64px);
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 15% 0%, rgba(57, 153, 128, 0.2), transparent 30%),
    radial-gradient(circle at 92% 10%, rgba(247, 178, 103, 0.25), transparent 35%),
    linear-gradient(180deg, #f2f8f5, #e7f4ec);
}

.hero-shell {
  border-bottom: 1px solid rgba(13, 79, 66, 0.14);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.92), rgba(235, 247, 241, 0.88));
}

.hero-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #147a66;
  font-weight: 700;
}

.hero-title {
  font-size: clamp(2rem, 3.2vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #11362e;
}

.hero-subtitle {
  color: #47635c;
  line-height: 1.7;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stat-card {
  border: 1px solid rgba(13, 79, 66, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  padding: 10px 8px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
}

.stat-label {
  display: block;
  font-size: 0.72rem;
  color: #607972;
}

.panel {
  border: 1px solid rgba(13, 79, 66, 0.16);
  background: linear-gradient(165deg, #ffffff, #f4faf7);
  box-shadow: 0 14px 28px rgba(8, 35, 30, 0.1);
}

.panel-kicker {
  color: #11725f;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  font-weight: 700;
}

.quick-chip {
  cursor: pointer;
}

.chat-shell {
  border: 1px solid rgba(13, 79, 66, 0.2);
  background: linear-gradient(165deg, #ffffff, #f1f8f4);
  box-shadow: 0 16px 30px rgba(8, 35, 30, 0.11);
  overflow: hidden;
}

.chat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(13, 79, 66, 0.14);
  padding: 14px;
}

.chat-stream {
  height: min(62vh, 680px);
  overflow-y: auto;
  padding: 16px;
}

.chat-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.message-row {
  display: flex;
  width: 100%;
}

.bubble {
  width: min(92%, 700px);
  border: 1px solid rgba(13, 79, 66, 0.15);
  border-radius: 15px;
  padding: 12px;
}

.bubble-user {
  background: linear-gradient(140deg, #1a866f, #116955);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.bubble-ai {
  background: #f7fcf9;
  color: #153730;
  border-bottom-left-radius: 4px;
}

.bubble-error {
  background: #fff2f0;
  border-color: rgba(191, 69, 52, 0.4);
}

.bubble-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.73rem;
  opacity: 0.8;
}

.user-text {
  white-space: pre-wrap;
  line-height: 1.7;
}

.mini-btn {
  border: 1px solid rgba(13, 79, 66, 0.25);
  border-radius: 999px;
  background: #ffffff;
  color: #165246;
  padding: 3px 8px;
  font-size: 0.72rem;
  cursor: pointer;
}

.typing {
  display: inline-flex;
  gap: 6px;
}

.typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2f7a6b;
  animation: pulse 1s infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes pulse {
  0%, 100% { opacity: 0.35; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-4px); }
}

.composer {
  border-top: 1px solid rgba(13, 79, 66, 0.14);
  background: rgba(255, 255, 255, 0.85);
  padding: 14px;
}

.composer :deep(.v-field) {
  border: 1px solid rgba(13, 79, 66, 0.15);
  border-radius: 12px;
  background: #f8fcfa;
}

.markdown-body {
  line-height: 1.72;
  color: #153730;
  overflow-wrap: anywhere;
}

.markdown-body :deep(code:not(pre code)) {
  font-family: "JetBrains Mono", monospace;
  border-radius: 6px;
  padding: 2px 7px;
  border: 1px solid rgba(13, 79, 66, 0.15);
  background: rgba(14, 95, 78, 0.09);
}

.markdown-body :deep(.code-block-wrapper) {
  margin: 12px 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #33544e;
  box-shadow: 0 12px 22px rgba(6, 24, 20, 0.28);
}

.markdown-body :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 12px;
  background: linear-gradient(180deg, #1e322f, #172625);
  color: #c5e7de;
}

.markdown-body :deep(.code-header-left) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.markdown-body :deep(.code-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.markdown-body :deep(.dot-red) {
  background: #ff6b6b;
}

.markdown-body :deep(.dot-yellow) {
  background: #ffd166;
}

.markdown-body :deep(.dot-green) {
  background: #06d6a0;
}

.markdown-body :deep(.lang-label) {
  margin-left: 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}

.markdown-body :deep(.copy-btn) {
  border: 1px solid #527f74;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #d5ede7;
  padding: 3px 9px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-body :deep(.copy-btn:hover) {
  background: rgba(213, 237, 231, 0.13);
  border-color: #82b3a7;
}

.markdown-body :deep(pre[class*="language-"]) {
  margin: 0;
  padding: 14px 15px;
  background: #101918;
  overflow-x: auto;
}

.markdown-body :deep(pre[class*="language-"] code) {
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 0.84rem;
  line-height: 1.65;
}

.markdown-body :deep(.token.comment),
.markdown-body :deep(.token.prolog),
.markdown-body :deep(.token.doctype),
.markdown-body :deep(.token.cdata) {
  color: #6f8b85;
}

.markdown-body :deep(.token.punctuation) {
  color: #d4e2de;
}

.markdown-body :deep(.token.property),
.markdown-body :deep(.token.tag),
.markdown-body :deep(.token.constant),
.markdown-body :deep(.token.symbol),
.markdown-body :deep(.token.deleted) {
  color: #f78c6c;
}

.markdown-body :deep(.token.boolean),
.markdown-body :deep(.token.number) {
  color: #f6bd60;
}

.markdown-body :deep(.token.selector),
.markdown-body :deep(.token.attr-name),
.markdown-body :deep(.token.string),
.markdown-body :deep(.token.char),
.markdown-body :deep(.token.builtin),
.markdown-body :deep(.token.inserted) {
  color: #95d5b2;
}

.markdown-body :deep(.token.operator),
.markdown-body :deep(.token.entity),
.markdown-body :deep(.token.url),
.markdown-body :deep(.token.atrule),
.markdown-body :deep(.token.attr-value),
.markdown-body :deep(.token.keyword) {
  color: #7ad7bf;
}

.markdown-body :deep(.token.function),
.markdown-body :deep(.token.class-name) {
  color: #8ecae6;
}

.markdown-body :deep(.token.regex),
.markdown-body :deep(.token.important),
.markdown-body :deep(.token.variable) {
  color: #ffb4a2;
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .chat-stream {
    height: 54vh;
  }

  .bubble {
    width: 100%;
  }
}
</style>
