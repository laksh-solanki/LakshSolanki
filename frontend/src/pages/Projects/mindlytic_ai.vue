<template>
  <div class="ai-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-8">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl"
            class="text-none">
            Back
          </v-btn>
          <v-chip size="small" variant="flat" color="primary">Text Chat</v-chip>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" class="pr-md-8">
            <p class="hero-kicker mb-2">Mindlytic AI Workspace</p>
            <h1 class="hero-title mb-3">Premium AI Chat Studio</h1>
            <p class="hero-subtitle mb-0">
              Focused AI chat with regenerate, stop generation, and markdown/code rendering.
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

    <v-row class="ga-0">
      <v-col cols="12">
        <v-card ref="chatShell" :class="[
          'chat-shell',
          {
            'chat-shell-fullscreen': isChatFullscreen,
            'chat-shell-runner-open': runnerPanelOpen,
            'chat-shell-compact': isCompactLayout,
            'runner-resizing': runnerResizing,
          },
        ]" elevation="0">
          <div class="chat-head-shell">
            <v-toolbar class="chat-toolbar px-2 px-sm-3" density="comfortable" color="transparent">
              <template #prepend>
                <v-avatar size="30" color="primary" variant="tonal" class="mr-2">
                  <v-icon size="18">mdi-robot-outline</v-icon>
                </v-avatar>
                <div class="chat-title-wrap">
                  <p class="chat-title mb-0">Mindlytic AI</p>
                </div>
              </template>
              <div class="chat-toolbar-actions">
                <v-btn :size="showChatActionLabels ? 'small' : 'x-small'" color="primary" variant="tonal" rounded="lg"
                  class="text-none" :icon="!showChatActionLabels" title="New Chat" aria-label="New Chat"
                  @click="resetChat">
                  <v-icon v-if="!showChatActionLabels" icon="mdi-plus" />
                  <template v-else>
                    <v-icon start icon="mdi-plus" />
                    New Chat
                  </template>
                </v-btn>
                <v-btn :size="showChatActionLabels ? 'small' : 'x-small'" color="primary" variant="outlined"
                  rounded="lg" class="text-none" :icon="!showChatActionLabels" :disabled="loading || !canRegenerate"
                  title="Regenerate" aria-label="Regenerate" @click="regenerateLastReply">
                  <v-icon v-if="!showChatActionLabels" icon="mdi-refresh" />
                  <template v-else>
                    <v-icon start icon="mdi-refresh" />
                    Regenerate
                  </template>
                </v-btn>
                <v-btn :size="showChatActionLabels ? 'small' : 'x-small'" variant="tonal" color="primary" rounded="lg"
                  class="text-none" :icon="!showChatActionLabels"
                  :title="isChatFullscreen ? 'Exit Full Screen' : 'Full Screen'"
                  :aria-label="isChatFullscreen ? 'Exit Full Screen' : 'Full Screen'" @click="toggleChatFullscreen">
                  <v-icon v-if="!showChatActionLabels"
                    :icon="isChatFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" />
                  <template v-else>
                    <v-icon start :icon="isChatFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" />
                    {{ isChatFullscreen ? "Exit Full Screen" : "Full Screen" }}
                  </template>
                </v-btn>
                <v-btn density="comfortable" variant="tonal" color="primary" rounded="lg"
                  :title="searchOpen ? 'Close search' : 'Search messages'" @click="toggleSearch">
                  <v-icon size="16">{{ searchOpen ? "mdi-close" : "mdi-magnify" }}</v-icon>
                </v-btn>
              </div>
              <div class="chat-toolbar-model">
                <v-select v-model="selectedModel" :items="availableModels" item-title="label" item-value="value"
                  density="compact" variant="outlined" rounded="lg" hide-details class="model-select"
                  :disabled="loading || !hasSelectedApiKey" title="Select AI model" />
              </div>
            </v-toolbar>
            <v-expand-transition>
              <div v-if="searchOpen" class="search-bar-wrap px-3 py-2">
                <v-text-field v-model="searchQuery" density="compact" variant="outlined" rounded="lg" hide-details
                  placeholder="Search messages..." prepend-inner-icon="mdi-magnify" clearable autofocus
                  @click:clear="searchQuery = ''" />
              </div>
            </v-expand-transition>
          </div>

          <div ref="chatWorkspace" class="chat-workspace">
            <div class="chat-main-shell">
              <v-container class="chat-main pa-0">
                <div ref="chatContainer" class="chat-stream px-2 px-sm-3 py-3" @click="handleChatClick">
                  <div class="chat-inner">
                    <div v-for="msg in messages" :key="msg.id" class="d-flex w-100 mb-2"
                      :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                      <div :class="['message-stack', msg.role === 'user' ? 'message-stack-user' : 'message-stack-ai']">
                        <v-avatar class="message-avatar" size="28" :color="msg.role === 'user' ? 'primary' : 'primary'"
                          :variant="msg.role === 'user' ? 'flat' : 'tonal'" aria-hidden="true">
                          <v-icon size="16">{{ msg.role === "user" ? "mdi-account" : "mdi-robot-outline" }}</v-icon>
                        </v-avatar>

                        <v-card :class="[
                          'message-card',
                          msg.role === 'user' ? 'message-card-user' : 'message-card-ai',
                          msg.error ? 'message-card-error' : '',
                          searchActive && isMessageSearchMatch(msg) ? 'message-card-search-hit' : '',
                          searchActive && !isMessageSearchMatch(msg) ? 'message-card-search-dim' : '',
                          searchActive && msg.id === editingMessageId ? 'message-card-search-focus' : '',
                        ]" rounded="xl" elevation="1">
                          <v-card-text class="message-card-body">
                            <div class="message-meta d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
                              <span>{{ msg.role === "user" ? "You" : "Mindlytic AI" }}</span>
                              <span>{{ formatTime(msg.createdAt) }}</span>
                            </div>

                            <div v-if="msg.role === 'assistant' && msg.kind === 'image'" class="image-message">
                              <div v-if="msg.imageStatus === 'loading'" class="image-skeleton-shell">
                                <v-skeleton-loader type="image" class="image-skeleton"></v-skeleton-loader>
                                <p class="image-caption mb-0">Generating image...</p>
                              </div>
                              <template v-else-if="msg.imageStatus === 'done' && msg.imageUrl">
                                <button type="button" class="generated-image-trigger"
                                  :aria-label="msg.text ? `Open generated image: ${msg.text}` : 'Open generated image preview'"
                                  @click.stop="openGeneratedImagePreview(msg)">
                                  <img :src="msg.imageUrl" class="generated-image" alt="Generated by Mindlytic AI"
                                    loading="lazy" />
                                </button>
                                <p v-if="msg.text" class="image-caption mb-0">{{ msg.text }}</p>
                                <div class="d-flex justify-end mt-2">
                                  <v-btn size="x-small" variant="tonal" color="primary" class="text-none"
                                    @click.stop="downloadGeneratedImage(msg)">
                                    Download image
                                  </v-btn>
                                </div>
                              </template>
                              <p v-else class="mb-0 image-error">{{ msg.text || "Unable to generate image." }}</p>
                            </div>

                            <div v-else-if="msg.role === 'assistant' && msg.text" class="markdown-body"
                              v-html="parseMessage(msg.text)">
                            </div>

                            <p v-if="msg.role === 'user'" class="user-text">{{ replaceEmojiShortcodes(msg.text) }}</p>

                            <div v-if="msg.role === 'assistant' && msg.kind !== 'image' && msg.text"
                              class="d-flex justify-end mt-2">
                              <v-btn size="x-small" variant="tonal" color="primary" class="text-none"
                                @click.stop="copyMessage(msg.text)">
                                Copy reply
                              </v-btn>
                            </div>
                          </v-card-text>
                        </v-card>
                      </div>
                    </div>

                    <div v-if="searchOpen && normalizedSearchQuery && !hasSearchResults"
                      class="search-empty px-2 px-sm-3 py-2">
                      No messages found for "{{ searchQuery }}".
                    </div>

                    <div v-if="loading && activeGenerationMode !== 'image'" class="d-flex w-100 justify-start mb-2">
                      <div class="message-stack message-stack-ai">
                        <v-avatar class="message-avatar" size="28" color="primary" variant="tonal" aria-hidden="true">
                          <v-icon size="16">mdi-robot-outline</v-icon>
                        </v-avatar>
                        <v-card class="message-card message-card-ai" rounded="xl" elevation="1">
                          <v-card-text class="message-card-body">
                            <div class="typing">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </v-card-text>
                        </v-card>
                      </div>
                    </div>
                  </div>
                </div>
              </v-container>

              <div class="composer">
                <v-sheet color="transparent" class="pa-3 pa-sm-4">
                  <div class="composer-inline">
                    <v-textarea v-model="userInput" class="composer-input" :placeholder="composerPlaceholder" auto-grow
                      rows="1" max-rows="5" variant="outlined" rounded="lg" hide-details
                      :disabled="loading || !hasAnyAiProvider" @keydown="handlePromptKeydown"></v-textarea>
                    <v-btn :color="loading ? 'error' : 'primary'" rounded="lg" class="text-none composer-send-btn"
                      :icon="loading ? 'mdi-stop-circle-outline' : 'mdi-arrow-right-thin-circle-outline'"
                      :aria-label="loading ? 'Stop' : 'Send'" :disabled="primaryActionDisabled"
                      @click="handlePrimaryAction" />
                  </div>
                </v-sheet>
              </div>
            </div>

            <div v-if="runnerPanelOpen && !isCompactLayout" class="runner-divider" role="separator"
              aria-orientation="vertical" title="Resize runner panel" @pointerdown.stop.prevent="startRunnerResize"
              @mousedown.stop.prevent="startRunnerResize" @touchstart.stop.prevent="startRunnerResize"></div>
            <transition name="runner-panel-slide">
              <aside v-if="runnerPanelOpen" class="runner-panel" :style="runnerPanelStyle" aria-live="polite">
                <div class="runner-panel-head">
                  <div>
                    <p class="runner-panel-title mb-0">Code Runner</p>
                    <p class="runner-panel-subtitle mb-0">
                      {{ runnerMode === "web" ? "Web Preview" : `${runnerLanguageLabel} Console` }}
                    </p>
                  </div>
                  <div class="runner-panel-controls">
                    <v-btn size="x-small" variant="tonal" color="primary" class="text-none"
                      @click="setRunnerMode('web')">Web</v-btn>
                    <v-btn size="x-small" variant="tonal" color="primary" class="text-none"
                      @click="setRunnerMode('console')">Console</v-btn>
                    <v-btn size="small" variant="text" color="primary" icon="mdi-close"
                      @click="closeCodeRunner"></v-btn>
                  </div>
                </div>
                <div class="runner-panel-body">
                  <iframe :key="runnerFrameKey" :class="['runner-frame', { 'runner-frame-web': runnerMode === 'web' }]"
                    :srcdoc="runnerSrcdoc" sandbox="allow-scripts allow-modals" referrerpolicy="no-referrer"></iframe>
                </div>
              </aside>
            </transition>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <PhotoZoomDialog v-model="generatedImageDialogOpen" :src="generatedImageDialogSrc" :alt="generatedImageDialogAlt"
      :dialog-title="generatedImageDialogTitle" :hide-trigger="true" trigger-variant="image" :max-width="1100" />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Prism from "prismjs";
import Alerts from "@/components/Alerts.vue";
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";

import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || "").trim();
const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || "").trim();
const GROQ_API_BASE = (import.meta.env.VITE_GROQ_API_BASE || "https://api.groq.com/openai/v1").trim().replace(/\/+$/, "");
const IMAGE_API_KEY = (import.meta.env.VITE_IMAGE_API_KEY || "").trim();
const IMAGE_INVOKE_URL = (import.meta.env.VITE_IMAGE_INVOKE_URL || "").trim();
const IMAGE_MODEL = (import.meta.env.VITE_IMAGE_MODEL || "").trim();
const GEMINI_IMAGE_MODEL = (import.meta.env.VITE_GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image").trim();
const IMAGE_SIZE = (import.meta.env.VITE_IMAGE_SIZE || "1024x1024").trim();
const AI_IMAGE_PATH = "/api/ai/image";
const IMAGE_PROXY_URL = (import.meta.env.VITE_IMAGE_PROXY_URL || "").trim();
const IMAGE_USE_PROXY = !["0", "false", "no", "off"].includes(String(import.meta.env.VITE_IMAGE_USE_PROXY || "true").trim().toLowerCase());
const trimTrailingSlash = (value = "") => String(value || "").trim().replace(/\/+$/, "");
const toApiUrl = (base = "", path = "") => {
  const normalizedBase = trimTrailingSlash(base);
  const normalizedPath = String(path || "").trim();
  if (!normalizedBase || !normalizedPath) return "";
  return `${normalizedBase}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
};
const collectUnique = (values = []) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};
const collectApiBaseUrls = () =>
  collectUnique([
    trimTrailingSlash(getApiBaseUrl()),
    trimTrailingSlash(import.meta.env.VITE_API_URL),
    trimTrailingSlash(import.meta.env.VITE_API_URL_1),
    trimTrailingSlash(import.meta.env.VITE_API_URL_2),
  ]);
const API_BASE_URLS = collectApiBaseUrls();
const toImageProxyUrl = (value = "") => {
  const normalized = trimTrailingSlash(value);
  if (!normalized) return "";
  if (/\/api\/ai\/image$/i.test(normalized)) return normalized;
  return toApiUrl(normalized, AI_IMAGE_PATH);
};
const IMAGE_PROXY_URLS = collectUnique([
  toImageProxyUrl(IMAGE_PROXY_URL),
  ...API_BASE_URLS.map((base) => toApiUrl(base, AI_IMAGE_PATH)),
]);
const STORAGE_KEY = "mindlytic_ai_studio_v4";
const MODEL_STORAGE_KEY = "mindlytic_model";
const TEMPERATURE_STORAGE_KEY = "mindlytic_temp";
const GEMINI_CHAT_MODEL = (import.meta.env.VITE_GEMINI_CHAT_MODEL || "gemini-2.5-flash").trim();
const GROQ_CHAT_MODEL = (import.meta.env.VITE_GROQ_CHAT_MODEL || "llama-3.3-70b-versatile").trim();
const ASSISTANT_LABEL = "Mindlytic AI";
const ASSISTANT_SYSTEM_PROMPT =
  "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first, then add implementation details, edge cases, and simple teaching guidance when useful.";
const REQUEST_TEMPERATURE = 1.5;
const REQUEST_MAX_OUTPUT_TOKENS = 2000;
const readStoredValue = (key, fallback = "") => {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
};
const writeStoredValue = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error("localStorage write failed", error);
  }
};

const userInput = ref("");
const loading = ref(false);
const activeGenerationMode = ref(null);
const lastResponseMs = ref(0);
const selectedModel = ref(readStoredValue(MODEL_STORAGE_KEY, "gemini-default"));
const currentTemperature = ref(Number(readStoredValue(TEMPERATURE_STORAGE_KEY, String(REQUEST_TEMPERATURE))) || REQUEST_TEMPERATURE);
const searchOpen = ref(false);
const searchQuery = ref("");
const editingMessageId = ref(null);

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const generatedImageDialogOpen = ref(false);
const generatedImageDialogSrc = ref("");
const generatedImageDialogAlt = ref("Generated by Mindlytic AI");
const generatedImageDialogTitle = ref("Generated Image");
const chatContainer = ref(null);
const chatShell = ref(null);
const chatWorkspace = ref(null);
const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1280);
const viewportHeight = ref(typeof window !== "undefined" ? window.innerHeight : 900);
const isChatFullscreen = ref(false);
const runnerPanelOpen = ref(false);
const runnerUsesFullscreen = ref(false);
const runnerMode = ref("console");
const runnerLanguageLabel = ref("Code");
const runnerSrcdoc = ref("");
const runnerFrameKey = ref(0);
const runnerPanelWidth = ref(460);
const runnerResizing = ref(false);
const runnerCodeRaw = ref("");
const runnerCodeLanguage = ref("plaintext");
let activeResizeHandle = null;
let activePointerId = null;

const messages = ref([]);
let nextId = 1;
let activeController = null;

const resolveModelName = (key) => {
  const map = {
    "gemini-flash": "gemini-2.5-flash",
    "gemini-default": GEMINI_CHAT_MODEL,
    "groq-llama": "llama-3.3-70b-versatile",
    "groq-mixtral": "mixtral-8x7b-32768",
    "groq-default": GROQ_CHAT_MODEL,
  };
  return map[key] || GEMINI_CHAT_MODEL;
};
const resolveModelProvider = (key) => (String(key || "").startsWith("groq-") ? "groq" : "gemini");
const availableModels = computed(() => {
  const models = [];
  if (GEMINI_API_KEY) {
    models.push({ label: "Gemini 2.5 Flash", value: "gemini-flash" });
    if (GEMINI_CHAT_MODEL !== "gemini-2.5-flash") {
      models.push({ label: `Gemini (${GEMINI_CHAT_MODEL})`, value: "gemini-default" });
    }
  }
  if (GROQ_API_KEY) {
    models.push({ label: "Llama 3.3 70B", value: "groq-llama" });
    models.push({ label: "Mixtral 8x7B", value: "groq-mixtral" });
    if (!["llama-3.3-70b-versatile", "mixtral-8x7b-32768"].includes(GROQ_CHAT_MODEL)) {
      models.push({ label: `Groq (${GROQ_CHAT_MODEL})`, value: "groq-default" });
    }
  }
  if (!models.length) {
    models.push({ label: "No model configured", value: "gemini-default", disabled: true });
  }
  return models;
});
const assistantProvider = computed(() => {
  const provider = resolveModelProvider(selectedModel.value);
  const modelName = resolveModelName(selectedModel.value);
  if (provider === "gemini" && GEMINI_API_KEY) return { provider, modelName };
  if (provider === "groq" && GROQ_API_KEY) return { provider, modelName };
  const fallback = availableModels.value.find((item) => !item.disabled);
  if (fallback) {
    return { provider: resolveModelProvider(fallback.value), modelName: resolveModelName(fallback.value) };
  }
  return { provider: "gemini", modelName: GEMINI_CHAT_MODEL };
});
const normalizedTemperature = computed(() => {
  const value = Number(currentTemperature.value);
  if (!Number.isFinite(value)) return REQUEST_TEMPERATURE;
  return Math.min(2, Math.max(0, value));
});
const hasSelectedApiKey = computed(() => Boolean(GEMINI_API_KEY || GROQ_API_KEY));
const hasImageProvider = computed(() => Boolean((IMAGE_API_KEY && IMAGE_INVOKE_URL) || IMAGE_USE_PROXY));
const hasAnyAiProvider = computed(() => hasSelectedApiKey.value || hasImageProvider.value);
const composerPlaceholder = computed(() =>
  hasAnyAiProvider.value
    ? `Message ${ASSISTANT_LABEL}...`
    : "Set VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY (text), and VITE_IMAGE_API_KEY + VITE_IMAGE_INVOKE_URL for custom image providers.",
);
const sendDisabled = computed(() => !userInput.value.trim() || !hasAnyAiProvider.value);
const primaryActionDisabled = computed(() => (loading.value ? false : sendDisabled.value));
const canRegenerate = computed(() => messages.value.some((m) => m.role === "user"));
const userMessageCount = computed(() => messages.value.filter((m) => m.role === "user").length);
const assistantMessageCount = computed(() => messages.value.filter((m) => m.role === "assistant").length);
const lastResponseLabel = computed(() => (lastResponseMs.value ? `${(lastResponseMs.value / 1000).toFixed(1)}s` : "--"));
const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase());
const isMessageSearchMatch = (message) => {
  const query = normalizedSearchQuery.value;
  if (!query) return false;
  return String(message?.text || "").toLowerCase().includes(query);
};
const filteredMessages = computed(() => {
  if (!normalizedSearchQuery.value) return messages.value;
  return messages.value.filter((message) => isMessageSearchMatch(message));
});
const searchActive = computed(() => searchOpen.value && Boolean(normalizedSearchQuery.value));
const hasSearchResults = computed(() => filteredMessages.value.length > 0);
const isShortScreen = computed(() => viewportWidth.value <= 900 || viewportHeight.value <= 820);
const isCompactLayout = computed(() => viewportWidth.value <= 900);
const showChatActionLabels = computed(() => viewportWidth.value > 1024);
const runnerPanelStyle = computed(() => (isCompactLayout.value ? {} : { width: `${runnerPanelWidth.value}px` }));

const goBack = () => window.history.back();
const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};
const toggleSearch = () => {
  searchOpen.value = !searchOpen.value;
  if (!searchOpen.value) {
    searchQuery.value = "";
    editingMessageId.value = null;
  }
};

const createMessage = (role, text, options = {}) => ({
  id: nextId++,
  role,
  text: typeof text === "string" ? text : "",
  kind: options.kind === "image" ? "image" : "text",
  imageUrl: typeof options.imageUrl === "string" ? options.imageUrl : "",
  imageStatus: options.kind === "image" ? (options.imageStatus || "done") : "",
  imageMimeType: typeof options.imageMimeType === "string" ? options.imageMimeType : "",
  error: Boolean(options.error),
  createdAt: new Date().toISOString(),
});

const patchMessage = (id, patch = {}) => {
  const index = messages.value.findIndex((message) => message.id === id);
  if (index === -1) return false;
  messages.value[index] = { ...messages.value[index], ...patch };
  return true;
};

const buildWelcomeText = () => {
  const available = [
    GEMINI_API_KEY ? "Gemini" : "",
    GROQ_API_KEY ? "Groq" : "",
    hasImageProvider.value ? "Image API" : "",
  ].filter(Boolean);
  if (!available.length) {
    return "AI chat is unavailable. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY for text, plus VITE_IMAGE_API_KEY and VITE_IMAGE_INVOKE_URL for custom image endpoints.";
  }
  return `Welcome to ${ASSISTANT_LABEL}. Configured providers: ${available.join(" + ")}. Text chat uses Gemini/Groq and image prompts use your image endpoint or backend image proxy.`;
};

const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
};

marked.setOptions({ breaks: true, gfm: true });
const renderer = new marked.Renderer();
const emojiShortcodeMap = Object.freeze({
  smile: "\u{1F604}",
  smiley: "\u{1F603}",
  grin: "\u{1F601}",
  grinning: "\u{1F600}",
  joy: "\u{1F602}",
  laugh: "\u{1F606}",
  laughing: "\u{1F606}",
  wink: "\u{1F609}",
  blush: "\u{1F60A}",
  heart_eyes: "\u{1F60D}",
  thinking: "\u{1F914}",
  cool: "\u{1F60E}",
  thumbsup: "\u{1F44D}",
  thumbs_up: "\u{1F44D}",
  "+1": "\u{1F44D}",
  thumbsdown: "\u{1F44E}",
  thumbs_down: "\u{1F44E}",
  "-1": "\u{1F44E}",
  clap: "\u{1F44F}",
  wave: "\u{1F44B}",
  ok_hand: "\u{1F44C}",
  muscle: "\u{1F4AA}",
  pray: "\u{1F64F}",
  rocket: "\u{1F680}",
  fire: "\u{1F525}",
  sparkles: "\u{2728}",
  star: "\u{2B50}",
  star2: "\u{1F31F}",
  heart: "\u{2764}\u{FE0F}",
  broken_heart: "\u{1F494}",
  warning: "\u{26A0}\u{FE0F}",
  info: "\u{2139}\u{FE0F}",
  bulb: "\u{1F4A1}",
  check: "\u{2705}",
  x: "\u{274C}",
  tada: "\u{1F389}",
  party: "\u{1F973}",
  cry: "\u{1F622}",
  sob: "\u{1F62D}",
  eyes: "\u{1F440}",
  poop: "\u{1F4A9}",
});
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
const webLanguages = new Set(["html", "htm", "markup", "xml", "xhtml", "svg", "css", "vue", "svelte", "astro"]);
const jsLanguages = new Set(["javascript", "typescript"]);
const pythonLanguages = new Set(["python"]);

const normalizeCodeLanguage = (value = "") => {
  const normalized = value.toLowerCase();
  return languageAlias[normalized] || normalized || "plaintext";
};

const serializeForScript = (value = "") => JSON.stringify(String(value)).replace(/<\/script/gi, "<\\/script");
const looksLikeWebCode = (value = "") =>
  /<!doctype|<html|<head|<body|<main|<section|<div|<style|<script|<\/?[a-z][\w-]*(\s[^>]*)?>/i.test(String(value || ""));
const isWebLanguage = (value = "") => {
  const normalized = normalizeCodeLanguage(value);
  if (webLanguages.has(normalized)) return true;
  return /(^|[\s/_.-])(html?|xhtml|markup|svg|css|vue|svelte|astro)([\s/_.-]|$)/i.test(String(value || ""));
};

const buildWebRunnerDoc = (code, language) => {
  const trimmed = (code || "").trim();
  if (language === "css") {
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${code}</style></head><body><main style="padding:24px;font-family:Segoe UI,sans-serif;"><h2>CSS Preview</h2><p>This preview uses your CSS in a sample page.</p><button style="padding:10px 16px;border-radius:999px;border:0;background:#0f766e;color:#fff;">Button</button></main></body></html>`;
  }
  if (/<!doctype html|<html[\s>]/i.test(trimmed)) return trimmed;
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${code}</body></html>`;
};

const buildConsoleRunnerDoc = (code, language) => {
  if (pythonLanguages.has(language)) {
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:#f8fbfd;color:#11201d;font-family:'JetBrains Mono',Consolas,monospace}#term{height:100%;overflow:auto;padding:14px;white-space:pre-wrap;line-height:1.55}.line-info{color:#0f6a5e}.line-error{color:#c2414e}.line-result{color:#0f8a57}.line-log{color:#11201d}</style></head><body><div id="term"></div><script>const term=document.getElementById("term");const write=(text,type="log")=>{const line=document.createElement("div");line.className="line-"+type;line.textContent=String(text??"");term.appendChild(line);term.scrollTop=term.scrollHeight;};const loadScript=(src)=>new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error("Failed to load runtime"));document.head.appendChild(script);});const requestInput=()=>{try{return window.prompt("Python input:")??null;}catch(error){write("input() is unavailable in this runner.","error");return null;}};(async()=>{write("Loading Python runtime...","info");try{await loadScript("https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js");const pyodide=await loadPyodide({stdout:(msg)=>write(msg,"log"),stderr:(msg)=>write(msg,"error"),stdin:requestInput});if(typeof pyodide.setStdin==="function"){pyodide.setStdin({stdin:requestInput,isatty:true});}const result=await pyodide.runPythonAsync(${serializeForScript(
      code,
    )});if(result!==undefined&&result!==null){write(String(result),"result");}write("Execution completed.","info");}catch(error){write(error?.stack||String(error),"error");}})();<\/script></body></html>`;
  }

  if (jsLanguages.has(language)) {
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:#f8fbfd;color:#11201d;font-family:'JetBrains Mono',Consolas,monospace}#term{height:100%;overflow:auto;padding:14px;white-space:pre-wrap;line-height:1.55}.line-info{color:#0f6a5e}.line-error{color:#c2414e}.line-result{color:#0f8a57}.line-warn{color:#b45309}.line-log{color:#11201d}</style></head><body><div id="term"></div><script>const term=document.getElementById("term");const write=(text,type="log")=>{const line=document.createElement("div");line.className="line-"+type;line.textContent=String(text??"");term.appendChild(line);term.scrollTop=term.scrollHeight;};const asText=(value)=>{if(typeof value==="string")return value;try{return JSON.stringify(value);}catch{return String(value);}};const runtimeConsole={log:(...args)=>write(args.map(asText).join(" "),"log"),info:(...args)=>write(args.map(asText).join(" "),"info"),warn:(...args)=>write(args.map(asText).join(" "),"warn"),error:(...args)=>write(args.map(asText).join(" "),"error")};window.addEventListener("error",(event)=>write(event.message||"Runtime error","error"));window.addEventListener("unhandledrejection",(event)=>write("Unhandled: "+asText(event.reason),"error"));(async()=>{try{const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;const runner=new AsyncFunction("console",${serializeForScript(
      code,
    )});const result=await runner(runtimeConsole);if(result!==undefined){write("=> "+asText(result),"result");}}catch(error){write(error?.stack||String(error),"error");}})();<\/script></body></html>`;
  }

  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:#f8fbfd;color:#11201d;font-family:'JetBrains Mono',Consolas,monospace}#term{padding:14px;white-space:pre-wrap;line-height:1.55}</style></head><body><div id="term">Language "${language}" is not executable in this runner.\n\n${code}</div></body></html>`;
};

renderer.code = ({ text, lang }) => {
  const language = (lang || "plaintext").trim();
  const safeLanguage = normalizeCodeLanguage(language);
  const grammar = Prism.languages[safeLanguage] || Prism.languages.plaintext;
  const html = Prism.highlight(text, grammar, safeLanguage);

  return `<div class="code-block-wrapper"><div class="code-header"><div class="code-header-left"><span class="code-dot dot-red"></span><span class="code-dot dot-yellow"></span><span class="code-dot dot-green"></span><span class="lang-label">${language || "plaintext"}</span></div><div class="code-header-actions"><button class="run-btn" aria-label="Run code">Run</button><button class="copy-btn" aria-label="Copy code">Copy</button></div></div><pre class="language-${safeLanguage}"><code class="language-${safeLanguage}">${html}</code></pre></div>`;
};
marked.use({ renderer });

const replaceEmojiShortcodes = (input = "") =>
  input.replace(/:([a-z0-9_+-]+):/gi, (fullMatch, rawCode) => {
    const normalizedCode = rawCode.toLowerCase().replace(/-/g, "_");
    return emojiShortcodeMap[normalizedCode] || fullMatch;
  });

const prepareAssistantMarkdown = (input = "") => replaceEmojiShortcodes(String(input || ""));

const parseMessage = (rawText) =>
  DOMPurify.sanitize(marked.parse(prepareAssistantMarkdown(rawText)), {
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

const openGeneratedImagePreview = (message) => {
  const imageUrl = String(message?.imageUrl || "").trim();
  if (!imageUrl) return;

  const promptText = String(message?.text || "").trim();
  generatedImageDialogSrc.value = imageUrl;
  generatedImageDialogAlt.value = promptText ? `Generated image: ${promptText}` : "Generated by Mindlytic AI";
  generatedImageDialogTitle.value = "Generated Image Preview";
  generatedImageDialogOpen.value = true;
};

const IMAGE_REQUEST_PREFIX = /^\/(image|imagine)\b/i;
const IMAGE_REQUEST_REGEX =
  /\b(generate|create|make|draw|design|render|illustrate|imagine)\b[\s\S]{0,64}\b(image|photo|picture|art|illustration|logo|avatar|wallpaper|poster)\b/i;
const IMAGE_REQUEST_HINT_REGEX = /\b(text[\s-]*to[\s-]*image|image generation)\b/i;
const transientObjectUrls = new Set();

const releaseTransientImageUrls = () => {
  transientObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  transientObjectUrls.clear();
};

const isImageGenerationPrompt = (input = "") => {
  const value = String(input || "").trim();
  if (!value) return false;
  return IMAGE_REQUEST_PREFIX.test(value) || IMAGE_REQUEST_HINT_REGEX.test(value) || IMAGE_REQUEST_REGEX.test(value);
};

const normalizeImagePrompt = (input = "") => {
  const cleaned = String(input || "").replace(IMAGE_REQUEST_PREFIX, "").trim();
  return cleaned || String(input || "").trim();
};

const isLikelyBase64Image = (value = "") => {
  const normalized = String(value || "").trim().replace(/\s+/g, "");
  return normalized.length > 160 && /^[A-Za-z0-9+/]+=*$/.test(normalized);
};

const toDataImageUrl = (base64 = "", mimeType = "image/png") => `data:${mimeType};base64,${String(base64).replace(/\s+/g, "")}`;

const resolveImagePayload = (payload) => {
  if (!payload) return null;

  if (typeof payload === "string") {
    const value = payload.trim();
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(value)) return { imageUrl: value, mimeType: "" };
    if (isLikelyBase64Image(value)) return { imageUrl: toDataImageUrl(value), mimeType: "image/png" };
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = resolveImagePayload(item);
      if (found?.imageUrl) return found;
    }
    return null;
  }

  if (typeof payload === "object") {
    const mimeType = payload.mime_type || payload.mimeType || payload.type || payload.content_type || "image/png";

    if (typeof payload.url === "string") return { imageUrl: payload.url, mimeType };
    if (typeof payload.image_url === "string") return { imageUrl: payload.image_url, mimeType };
    if (typeof payload.imageUrl === "string") return { imageUrl: payload.imageUrl, mimeType };
    if (typeof payload.image === "string") {
      const image = payload.image.trim();
      if (/^(https?:\/\/|data:image\/|blob:)/i.test(image)) return { imageUrl: image, mimeType };
      if (isLikelyBase64Image(image)) return { imageUrl: toDataImageUrl(image, mimeType), mimeType };
    }
    if (typeof payload.b64_json === "string") return { imageUrl: toDataImageUrl(payload.b64_json, mimeType), mimeType };
    if (typeof payload.base64 === "string") return { imageUrl: toDataImageUrl(payload.base64, mimeType), mimeType };
    if (typeof payload.image_base64 === "string") return { imageUrl: toDataImageUrl(payload.image_base64, mimeType), mimeType };

    const nestedKeys = ["data", "images", "result", "results", "output"];
    for (const key of nestedKeys) {
      if (payload[key] == null) continue;
      const found = resolveImagePayload(payload[key]);
      if (found?.imageUrl) return found;
    }
  }

  return null;
};

const readImageApiError = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    const message = data?.error?.message || data?.error || data?.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  const raw = await response.text().catch(() => "");
  const text = raw.trim();
  if (text) return text.slice(0, 400);
  return `Image request failed (${response.status}).`;
};

const isNvidiaStabilityInvokeUrl = (invokeUrl = "") =>
  /ai\.api\.nvidia\.com\/v1\/genai\/stabilityai\//i.test(invokeUrl);

const buildImageRequestBody = (prompt, { invokeUrl = IMAGE_INVOKE_URL, model = IMAGE_MODEL, size = IMAGE_SIZE } = {}) => {
  if (/huggingface|api-inference\.huggingface/i.test(invokeUrl)) {
    return { inputs: prompt, options: { wait_for_model: true } };
  }
  if (isNvidiaStabilityInvokeUrl(invokeUrl)) {
    return { prompt };
  }
  const payload = { prompt };
  if (model) payload.model = model;
  if (size) payload.size = size;
  return payload;
};

const parseImageResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    transientObjectUrls.add(imageUrl);
    return { imageUrl, mimeType: imageBlob.type || contentType };
  }

  const rawBody = await response.text().catch(() => "");
  let payload = rawBody;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    payload = rawBody;
  }
  const parsed = resolveImagePayload(payload);
  if (!parsed?.imageUrl) {
    throw new Error("Image API response did not include a usable image URL or base64 image.");
  }
  return parsed;
};

const requestGeneratedImageDirect = async (prompt, signal) => {
  if (!IMAGE_INVOKE_URL || !IMAGE_API_KEY) {
    throw new Error("Direct image endpoint is not configured.");
  }
  const headers = { "Content-Type": "application/json" };
  if (IMAGE_API_KEY) {
    headers.Authorization = `Bearer ${IMAGE_API_KEY}`;
    headers["x-api-key"] = IMAGE_API_KEY;
  }

  const response = await fetch(IMAGE_INVOKE_URL, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify(buildImageRequestBody(prompt, { invokeUrl: IMAGE_INVOKE_URL, model: IMAGE_MODEL, size: IMAGE_SIZE })),
  });

  if (!response.ok) {
    throw new Error(await readImageApiError(response));
  }

  return parseImageResponse(response);
};

const requestGeneratedImageProxy = async (prompt, signal) => {
  const proxyInvokeUrl = IMAGE_INVOKE_URL || undefined;
  const proxyApiKey = IMAGE_API_KEY || GEMINI_API_KEY || undefined;
  const proxyModel = IMAGE_MODEL || (!proxyInvokeUrl ? GEMINI_IMAGE_MODEL : "") || undefined;
  const requestBody = JSON.stringify({
    prompt,
    model: proxyModel,
    size: IMAGE_SIZE || undefined,
    invokeUrl: proxyInvokeUrl,
    apiKey: proxyApiKey,
  });
  const failures = [];

  for (const proxyUrl of IMAGE_PROXY_URLS) {
    let response;
    try {
      response = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: requestBody,
      });
    } catch (error) {
      failures.push(`${proxyUrl}: ${String(error?.message || "fetch failed")}`);
      continue;
    }

    if (!response.ok) {
      failures.push(`${proxyUrl}: ${await readImageApiError(response)}`);
      continue;
    }

    return parseImageResponse(response);
  }

  if (!IMAGE_PROXY_URLS.length) {
    throw new Error("No image proxy URL configured.");
  }

  throw new Error(`Proxy request failed (${failures.join(" | ")})`);
};

const requestGeneratedImage = async (prompt, signal) => {
  if (!hasImageProvider.value) {
    throw new Error(
      "Image generation is not configured. Set VITE_IMAGE_API_KEY + VITE_IMAGE_INVOKE_URL, or use VITE_GEMINI_API_KEY with backend proxy.",
    );
  }

  const attempts = [];
  if (IMAGE_USE_PROXY) {
    try {
      return await requestGeneratedImageProxy(prompt, signal);
    } catch (error) {
      attempts.push(`proxy: ${String(error?.message || "failed")}`);
    }
  }

  if (IMAGE_INVOKE_URL && IMAGE_API_KEY) {
    try {
      return await requestGeneratedImageDirect(prompt, signal);
    } catch (error) {
      attempts.push(`direct: ${String(error?.message || "failed")}`);
    }
  }

  if (!attempts.length) {
    throw new Error("No image provider available. Configure proxy or direct image endpoint.");
  }
  throw new Error(`Image generation failed (${attempts.join(" | ")})`);
};

const makeImageFilename = (seed = "mindlytic-image", mimeType = "") => {
  const safeSeed = String(seed || "mindlytic-image")
    .toLowerCase()
    .replace(/[^\w\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48) || "mindlytic-image";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return `${safeSeed}.jpg`;
  if (mimeType.includes("webp")) return `${safeSeed}.webp`;
  if (mimeType.includes("gif")) return `${safeSeed}.gif`;
  return `${safeSeed}.png`;
};

const triggerFileDownload = (href, filename) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadGeneratedImage = async (message) => {
  const imageUrl = String(message?.imageUrl || "").trim();
  if (!imageUrl) return;

  const filename = makeImageFilename(message?.text || "mindlytic-image", message?.imageMimeType || "");
  try {
    if (/^(data:image\/|blob:)/i.test(imageUrl)) {
      triggerFileDownload(imageUrl, filename);
      return;
    }
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Download failed (${response.status}).`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    triggerFileDownload(blobUrl, makeImageFilename(message?.text || "mindlytic-image", blob.type));
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  } catch (error) {
    console.error("image download failed", error);
    window.open(imageUrl, "_blank", "noopener,noreferrer");
    showAlert("Opened image in a new tab. Long-press to save if auto-download is blocked.", "error");
  }
};

const generateImageReply = async (rawPrompt) => {
  const prompt = normalizeImagePrompt(rawPrompt);
  const loadingMessage = createMessage("assistant", prompt, { kind: "image", imageStatus: "loading" });
  messages.value.push(loadingMessage);

  activeController = new AbortController();
  loading.value = true;
  activeGenerationMode.value = "image";
  const started = Date.now();
  await scrollToBottom();

  try {
    const image = await requestGeneratedImage(prompt, activeController.signal);
    lastResponseMs.value = Date.now() - started;
    patchMessage(loadingMessage.id, {
      text: prompt,
      kind: "image",
      imageStatus: "done",
      imageUrl: image.imageUrl,
      imageMimeType: image.mimeType || "",
      error: false,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      patchMessage(loadingMessage.id, {
        text: "Image generation stopped.",
        kind: "image",
        imageStatus: "error",
        error: true,
      });
      showAlert("Generation stopped.", "error");
      return;
    }
    let message = String(error?.message || "Image generation failed.");
    if (/failed to fetch|network error|unable to reach image api/i.test(message)) {
      message += "\n\nTip: Start the backend server and verify /api/ai/image is reachable.";
    }
    patchMessage(loadingMessage.id, {
      text: `Image generation failed.\n\n${message}`,
      kind: "image",
      imageStatus: "error",
      error: true,
    });
  } finally {
    loading.value = false;
    activeGenerationMode.value = null;
    activeController = null;
    await scrollToBottom();
  }
};

const getRunnerPanelMaxWidth = () => {
  const shellWidth = chatWorkspace.value?.clientWidth || chatShell.value?.clientWidth || window.innerWidth;
  if (isCompactLayout.value) return Math.max(280, Math.floor(shellWidth));
  const hardMax = Math.floor(shellWidth * 0.82);
  const mainAreaReserve = shellWidth - 320;
  return Math.max(360, Math.min(hardMax, mainAreaReserve > 0 ? mainAreaReserve : hardMax));
};

const getRunnerPanelMinWidth = () => (isCompactLayout.value ? Math.min(280, getRunnerPanelMaxWidth()) : Math.min(320, getRunnerPanelMaxWidth()));

const getEventClientX = (event) => {
  if (typeof event?.clientX === "number") return event.clientX;
  if (event?.touches?.[0] && typeof event.touches[0].clientX === "number") return event.touches[0].clientX;
  if (event?.changedTouches?.[0] && typeof event.changedTouches[0].clientX === "number") return event.changedTouches[0].clientX;
  return null;
};

const clampRunnerPanelWidth = (value) => {
  const minWidth = getRunnerPanelMinWidth();
  const maxWidth = getRunnerPanelMaxWidth();
  return Math.min(maxWidth, Math.max(minWidth, Math.round(value)));
};

const onRunnerResize = (event) => {
  if (!runnerResizing.value) return;
  if (event.cancelable) event.preventDefault();
  const pointerX = getEventClientX(event);
  if (pointerX === null) return;
  const rect = chatWorkspace.value?.getBoundingClientRect() || chatShell.value?.getBoundingClientRect();
  if (!rect) return;
  const nextWidth = rect.right - pointerX;
  runnerPanelWidth.value = clampRunnerPanelWidth(nextWidth);
};

const stopRunnerResize = () => {
  if (!runnerResizing.value) return;
  runnerResizing.value = false;
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  window.removeEventListener("pointermove", onRunnerResize);
  window.removeEventListener("pointerup", stopRunnerResize);
  window.removeEventListener("pointercancel", stopRunnerResize);
  window.removeEventListener("mousemove", onRunnerResize);
  window.removeEventListener("mouseup", stopRunnerResize);
  window.removeEventListener("touchmove", onRunnerResize);
  window.removeEventListener("touchend", stopRunnerResize);
  window.removeEventListener("touchcancel", stopRunnerResize);
  window.removeEventListener("blur", stopRunnerResize);
  if (activeResizeHandle && activePointerId !== null && typeof activeResizeHandle.hasPointerCapture === "function") {
    if (activeResizeHandle.hasPointerCapture(activePointerId)) {
      activeResizeHandle.releasePointerCapture(activePointerId);
    }
  }
  activeResizeHandle = null;
  activePointerId = null;
};

const startRunnerResize = (event) => {
  if (!runnerPanelOpen.value || isCompactLayout.value) return;
  const pointerX = getEventClientX(event);
  if (pointerX === null) return;
  runnerResizing.value = true;
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
  activeResizeHandle = event.currentTarget || null;
  if (typeof event.pointerId === "number" && activeResizeHandle && typeof activeResizeHandle.setPointerCapture === "function") {
    activePointerId = event.pointerId;
    activeResizeHandle.setPointerCapture(event.pointerId);
  }
  onRunnerResize(event);
  window.addEventListener("pointermove", onRunnerResize);
  window.addEventListener("pointerup", stopRunnerResize);
  window.addEventListener("pointercancel", stopRunnerResize);
  window.addEventListener("mousemove", onRunnerResize);
  window.addEventListener("mouseup", stopRunnerResize);
  window.addEventListener("touchmove", onRunnerResize, { passive: false });
  window.addEventListener("touchend", stopRunnerResize);
  window.addEventListener("touchcancel", stopRunnerResize);
  window.addEventListener("blur", stopRunnerResize);
};

const closeCodeRunner = async () => {
  stopRunnerResize();
  runnerPanelOpen.value = false;
  if (runnerUsesFullscreen.value && document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.error("fullscreen exit failed", error);
    } finally {
      isChatFullscreen.value = false;
      runnerUsesFullscreen.value = false;
    }
    return;
  }
  runnerUsesFullscreen.value = false;
};

const handleWindowResize = () => {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
  if (isCompactLayout.value) {
    stopRunnerResize();
    return;
  }
  runnerPanelWidth.value = clampRunnerPanelWidth(runnerPanelWidth.value);
};

const resolveRunnerMode = (code, language) => (isWebLanguage(language) || looksLikeWebCode(code) ? "web" : "console");

const renderRunnerDocument = (requestedMode = null) => {
  const safeLanguage = normalizeCodeLanguage(runnerCodeLanguage.value);
  const mode = requestedMode || resolveRunnerMode(runnerCodeRaw.value, safeLanguage);
  runnerMode.value = mode;
  runnerSrcdoc.value =
    mode === "web" ? buildWebRunnerDoc(runnerCodeRaw.value, safeLanguage) : buildConsoleRunnerDoc(runnerCodeRaw.value, safeLanguage);
  runnerFrameKey.value += 1;
};

const setRunnerMode = (mode) => {
  if (!runnerPanelOpen.value) return;
  renderRunnerDocument(mode);
};

const getNativeFullscreenTarget = () => {
  if (typeof document === "undefined") return null;
  const target = document.documentElement;
  return target instanceof HTMLElement ? target : null;
};

const enterChatFullscreen = async () => {
  const target = getNativeFullscreenTarget();
  if (!target) return false;
  if (document.fullscreenElement === target) {
    isChatFullscreen.value = true;
    return true;
  }
  if (supportsNativeFullscreen()) {
    try {
      await target.requestFullscreen();
      return document.fullscreenElement === target;
    } catch (error) {
      console.error("fullscreen entry failed", error);
      return false;
    }
  }
  return false;
};

const openCodeRunner = async (code, language) => {
  const safeLanguage = normalizeCodeLanguage(language);
  runnerUsesFullscreen.value = false;

  if (isShortScreen.value) {
    const enteredFullscreen = await enterChatFullscreen();
    if (!enteredFullscreen) {
      showAlert("Code runner opens in fullscreen on short screens.", "error");
      return;
    }
    runnerUsesFullscreen.value = true;
  }

  runnerLanguageLabel.value = (language || safeLanguage || "Code").toUpperCase();
  runnerCodeRaw.value = code;
  runnerCodeLanguage.value = safeLanguage;
  renderRunnerDocument();
  runnerPanelWidth.value = clampRunnerPanelWidth(runnerPanelWidth.value);
  runnerPanelOpen.value = true;
};

const handleChatClick = async (event) => {
  const runButton = event.target.closest(".run-btn");
  if (runButton) {
    const wrapper = runButton.closest(".code-block-wrapper");
    const code = wrapper?.querySelector("code")?.innerText || "";
    const language = wrapper?.querySelector(".lang-label")?.textContent?.trim() || "plaintext";
    if (!code.trim()) {
      showAlert("No code found to run.", "error");
      return;
    }
    await openCodeRunner(code, language);
    return;
  }

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

const supportsNativeFullscreen = () =>
  Boolean(
    typeof document !== "undefined" &&
    document.fullscreenEnabled &&
    getNativeFullscreenTarget() &&
    typeof getNativeFullscreenTarget().requestFullscreen === "function",
  );

const handleFullscreenChange = () => {
  const target = getNativeFullscreenTarget();
  isChatFullscreen.value = Boolean(target && document.fullscreenElement === target);
  if (runnerUsesFullscreen.value && runnerPanelOpen.value && !document.fullscreenElement) {
    runnerPanelOpen.value = false;
    runnerUsesFullscreen.value = false;
  }
  runnerPanelWidth.value = clampRunnerPanelWidth(runnerPanelWidth.value);
  scrollToBottom();
};

const handleGlobalKeydown = (event) => {
  if (event.key === "Escape" && isChatFullscreen.value && !document.fullscreenElement) {
    isChatFullscreen.value = false;
  }
};

const toggleChatFullscreen = async () => {
  const target = getNativeFullscreenTarget();
  if (!target) return;

  if (supportsNativeFullscreen()) {
    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
      return;
    } catch (error) {
      console.error("fullscreen toggle failed", error);
    }
  }

  isChatFullscreen.value = !isChatFullscreen.value;
  await scrollToBottom();
};

const buildConversationHistory = () =>
  messages.value.filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      m.kind !== "image" &&
      typeof m.text === "string" &&
      (m.role !== "user" || !isImageGenerationPrompt(m.text)),
  );

const buildGeminiHistory = () =>
  buildConversationHistory().map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));

const readApiError = async (response) => {
  try {
    const data = await response.json();
    return data?.error?.message || data?.error || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
};

const requestGemini = async (signal) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${assistantProvider.value.modelName}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY,
  )}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      system_instruction: { parts: [{ text: ASSISTANT_SYSTEM_PROMPT }] },
      contents: buildGeminiHistory(),
      generationConfig: { temperature: normalizedTemperature.value, maxOutputTokens: REQUEST_MAX_OUTPUT_TOKENS },
    }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
};

const requestGroq = async (signal) => {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured. Please set VITE_GROQ_API_KEY in your .env file.");
  }

  const endpoint = `${GROQ_API_BASE}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      signal,
      body: JSON.stringify({
        model: assistantProvider.value.modelName,
        messages: buildGroqMessages(),
        temperature: normalizedTemperature.value,
        max_tokens: REQUEST_MAX_OUTPUT_TOKENS,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
      const errorMessage = errorData?.error?.message || `Request failed with status ${response.status}`;

      if (response.status === 401) {
        throw new Error(
          `Groq authentication failed at ${GROQ_API_BASE}. Check VITE_GROQ_API_KEY and VITE_GROQ_API_BASE. Original error: ${errorMessage}`,
        );
      } else if (response.status === 403) {
        throw new Error(`Groq API access denied. Please verify your API key permissions. Original error: ${errorMessage}`);
      } else {
        throw new Error(`Groq API error: ${errorMessage}`);
      }
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content.trim() : Array.isArray(content) ? content.map((part) => part?.text || "").join("").trim() : "";

    if (!text) throw new Error("Groq returned an empty response.");
    return text;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }
    if (String(error?.message || "").toLowerCase().includes("fetch")) {
      throw new Error(`Network error connecting to Groq API. Please check your internet connection and API configuration. Original error: ${error.message}`);
    }
    throw error;
  }
};

const buildGroqMessages = () => [
  { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
  ...buildConversationHistory().map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
];

const requestAssistantReply = async (signal) => {
  if (assistantProvider.value.provider === "gemini") return requestGemini(signal);
  if (assistantProvider.value.provider === "groq") return requestGroq(signal);
  throw new Error(`Unsupported provider: ${assistantProvider.value.provider}`);
};

const generateAssistantReply = async () => {
  if (!hasSelectedApiKey.value) {
    showAlert("Missing API key for AI chat.", "error");
    return;
  }
  activeController = new AbortController();
  loading.value = true;
  activeGenerationMode.value = "text";
  const started = Date.now();
  await scrollToBottom();
  try {
    const reply = await requestAssistantReply(activeController.signal);
    lastResponseMs.value = Date.now() - started;
    messages.value.push(createMessage("assistant", reply));
  } catch (error) {
    if (error?.name === "AbortError") {
      showAlert("Generation stopped.", "error");
      return;
    }
    const errorMessage = String(error?.message || "Unknown error");
    console.error("ai error", error);

    // Handle API-specific error messages
    let userFriendlyMessage = "Sorry, an error occurred.";
    if (errorMessage.toLowerCase().includes("insufficient balance")) {
      userFriendlyMessage = "Your API account balance is insufficient. Please add credits to your account to continue using the service.";
    } else if (errorMessage.toLowerCase().includes("invalid") && errorMessage.toLowerCase().includes("api key")) {
      userFriendlyMessage = "Your API key appears to be invalid. Please check your API key configuration in the .env file.";
    } else if (errorMessage.toLowerCase().includes("authentication")) {
      userFriendlyMessage = "Authentication failed. Please verify your API key is correct and has proper permissions.";
    } else if (errorMessage.toLowerCase().includes("network error")) {
      userFriendlyMessage = "Network connection error. Please check your internet connection and try again.";
    } else if (errorMessage.toLowerCase().includes("api key")) {
      userFriendlyMessage = "There seems to be an issue with your API key configuration. Please check your .env file.";
    } else {
      userFriendlyMessage = `Sorry, an error occurred.\n\n${errorMessage}`;
    }

    messages.value.push(createMessage("assistant", userFriendlyMessage, { error: true }));
  } finally {
    loading.value = false;
    activeGenerationMode.value = null;
    activeController = null;
    await scrollToBottom();
  }
};

const sendMessage = async () => {
  const prompt = userInput.value.trim();
  if (!prompt || loading.value) return;
  messages.value.push(createMessage("user", prompt));
  userInput.value = "";
  if (isImageGenerationPrompt(prompt)) {
    await generateImageReply(prompt);
    return;
  }
  if (!hasSelectedApiKey.value) {
    messages.value.push(
      createMessage(
        "assistant",
        "Text model is not configured. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY, or ask me to generate an image.",
        { error: true },
      ),
    );
    await scrollToBottom();
    return;
  }
  await generateAssistantReply();
};

const stopGeneration = () => {
  if (activeController) activeController.abort();
};

const handlePrimaryAction = () => {
  if (loading.value) {
    stopGeneration();
    return;
  }
  sendMessage();
};

const resetChat = () => {
  stopGeneration();
  generatedImageDialogOpen.value = false;
  generatedImageDialogSrc.value = "";
  releaseTransientImageUrls();
  messages.value = [createMessage("assistant", buildWelcomeText())];
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
  if (isImageGenerationPrompt(lastUser.text || "")) {
    await generateImageReply(lastUser.text || "");
    return;
  }
  await generateAssistantReply();
};

const handlePromptKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const saveState = () => {
  try {
    const persistedMessages = messages.value.slice(-80).map((message) => {
      const base = {
        id: message.id,
        role: message.role,
        text: message.text || "",
        error: Boolean(message.error),
        kind: message.kind === "image" ? "image" : "text",
        createdAt: message.createdAt,
      };
      if (base.kind === "image") {
        const imageUrl = String(message.imageUrl || "");
        return {
          ...base,
          imageStatus: message.imageStatus || "done",
          imageUrl: /^https?:\/\//i.test(imageUrl) ? imageUrl : "",
          imageMimeType: message.imageMimeType || "",
        };
      }
      return base;
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: persistedMessages,
        nextId,
      }),
    );
  } catch (error) {
    console.error("save failed", error);
  }
};

const restoreState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.messages)) {
      messages.value = parsed.messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant"))
        .map((m, index) => ({
          id: typeof m.id === "number" ? m.id : index + 1,
          role: m.role,
          text: typeof m.text === "string" ? m.text : "",
          kind: m.kind === "image" ? "image" : "text",
          imageUrl: typeof m.imageUrl === "string" ? m.imageUrl : "",
          imageStatus: m.kind === "image" ? (m.imageStatus || "done") : "",
          imageMimeType: typeof m.imageMimeType === "string" ? m.imageMimeType : "",
          error: Boolean(m.error),
          createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date().toISOString(),
        }));
    }
    nextId = typeof parsed.nextId === "number" ? parsed.nextId : Math.max(1, ...messages.value.map((m, i) => (m.id || i) + 1));
    return messages.value.length > 0;
  } catch (error) {
    console.error("restore failed", error);
    return false;
  }
};

watch(
  availableModels,
  (models) => {
    const hasCurrent = models.some((model) => model.value === selectedModel.value && !model.disabled);
    if (hasCurrent) return;
    const fallback = models.find((model) => !model.disabled) || models[0];
    selectedModel.value = fallback?.value || "gemini-default";
  },
  { immediate: true },
);
watch(
  selectedModel,
  (value) => {
    writeStoredValue(MODEL_STORAGE_KEY, String(value || "gemini-default"));
  },
  { immediate: true },
);
watch(
  normalizedTemperature,
  (value) => {
    if (value !== currentTemperature.value) currentTemperature.value = value;
    writeStoredValue(TEMPERATURE_STORAGE_KEY, String(value));
  },
  { immediate: true },
);
watch(searchQuery, (value) => {
  if (!String(value || "").trim()) {
    editingMessageId.value = null;
  }
});
watch(filteredMessages, (list) => {
  if (!normalizedSearchQuery.value) return;
  editingMessageId.value = list[0]?.id ?? null;
});

watch(runnerPanelWidth, (value) => {
  const clamped = clampRunnerPanelWidth(value);
  if (clamped !== value) runnerPanelWidth.value = clamped;
});

watch(isCompactLayout, (compact) => {
  if (compact) {
    stopRunnerResize();
    return;
  }
  runnerPanelWidth.value = clampRunnerPanelWidth(runnerPanelWidth.value);
});

watch(isShortScreen, (shortScreen) => {
  if (shortScreen && runnerPanelOpen.value && !runnerUsesFullscreen.value) {
    closeCodeRunner();
  }
});

watch(messages, saveState, { deep: true });
watch(generatedImageDialogOpen, (isOpen) => {
  if (isOpen) return;
  generatedImageDialogSrc.value = "";
  generatedImageDialogAlt.value = "Generated by Mindlytic AI";
  generatedImageDialogTitle.value = "Generated Image";
});

onMounted(async () => {
  if (!restoreState()) messages.value = [createMessage("assistant", buildWelcomeText())];
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  window.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("resize", handleWindowResize);
  runnerPanelWidth.value = clampRunnerPanelWidth(runnerPanelWidth.value);
  await scrollToBottom();
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  window.removeEventListener("keydown", handleGlobalKeydown);
  window.removeEventListener("resize", handleWindowResize);
  stopRunnerResize();
  if (isChatFullscreen.value && document.fullscreenElement) {
    document.exitFullscreen().catch(() => { });
  }
  isChatFullscreen.value = false;
  activeGenerationMode.value = null;
  runnerPanelOpen.value = false;
  generatedImageDialogOpen.value = false;
  generatedImageDialogSrc.value = "";
  releaseTransientImageUrls();
  stopGeneration();
});
</script>

<style scoped>
.ai-page {
  min-height: calc(100vh - 64px);
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 15% 0%, rgba(57, 153, 128, 0.2), transparent 30%),
    radial-gradient(circle at 92% 10%, rgba(247, 178, 103, 0.25), transparent 35%),
    linear-gradient(180deg, #f2f8f5, #e7f4ec);
}

.hero-shell {
  border-bottom: 1px solid rgba(76, 207, 183, 0.12);
  background:
    radial-gradient(circle at 12% 10%, rgba(41, 127, 108, 0.2), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(242, 180, 80, 0.12), transparent 24%),
    linear-gradient(152deg, rgba(15, 34, 30, 0.96), rgba(7, 18, 16, 0.94));
}

.hero-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--portfolio-primary);
  font-weight: 700;
}

.hero-title {
  font-size: clamp(2rem, 3.2vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--portfolio-ink);
}

.hero-subtitle {
  color: var(--portfolio-muted);
  line-height: 1.7;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stat-card {
  border: 1px solid rgba(15, 143, 124, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 8px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--portfolio-ink);
}

.stat-label {
  display: block;
  font-size: 0.72rem;
  color: var(--portfolio-muted);
}

.chat-shell {
  --chat-bubble-max-width: 720px;
  --chat-accent: #1f6feb;
  --chat-accent-strong: #184fae;
  --chat-border: #d5e1ee;
  --chat-surface: #ffffff;
  --chat-surface-alt: #f4f8fd;
  --chat-muted: #4f6279;
  background: linear-gradient(180deg, #fcfdff, #f6f9fd);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: clamp(510px, 76vh, 920px);
}

.chat-head-shell {
  position: sticky;
  z-index: 6;
  border-bottom: 1px solid var(--chat-border);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.chat-head-container {
  width: 100%;
}

.chat-head {
  display: inline-flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-head-identity {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}


.chat-head-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-head-actions::-webkit-scrollbar {
  display: none;
}

.chat-head-actions :deep(.chat-action-btn) {
  min-height: 34px;
  white-space: nowrap;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow: none;
}

.chat-head-subline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 0 14px 10px;
  font-size: 0.72rem;
  color: var(--chat-muted);
  letter-spacing: 0.01em;
}

.chat-head-subline span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  border: 1px solid #d9e4f2;
  background: #f6f9fe;
  padding: 2px 9px;
}

.chat-head-subline span::before {
  display: none;
}

.chat-head-subline code {
  border-radius: 999px;
  border: 1px solid #ccdaf0;
  background: #eef4ff;
  color: #1e4f98;
  padding: 1px 6px;
  font-size: 0.7rem;
  font-family: "JetBrains Mono", monospace;
}

.hero-shell :deep(.v-chip),
.chat-head :deep(.v-chip) {
  border: 1px solid rgba(39, 91, 177, 0.28);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.hero-shell :deep(.v-chip) {
  min-height: 24px;
}

.chat-head :deep(.v-chip) {
  min-height: 23px;
  font-size: 0.7rem;
}

.chat-shell-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1200;
  width: 100vw;
  height: 100dvh;
  max-width: none;
  border-radius: 0 !important;
  margin: 0 !important;
}

.chat-shell-fullscreen .chat-head-shell {
  top: 0;
}

.chat-shell-fullscreen .chat-head-container,
.chat-shell-fullscreen .chat-stream-inner,
.chat-shell-fullscreen .composer-inner {
  width: 100%;
  box-sizing: border-box;
  margin-inline: auto;
  padding-inline: var(--chat-fullscreen-inline-space);
}

.chat-shell-fullscreen .chat-head-container {
  max-width: var(--chat-fullscreen-shell-width);
}

.chat-shell-fullscreen .chat-stream-inner,
.chat-shell-fullscreen .composer-inner {
  max-width: var(--chat-fullscreen-content-width);
}

.chat-workspace {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.chat-main-shell {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 !important;
}

.chat-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  padding: 0 !important;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-shell-fullscreen .chat-stream {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  padding-inline: 10px;
}

.chat-shell-runner-open .chat-head,
.chat-shell-runner-open .chat-main {
  transform: translateX(-10px);
}

.chat-shell-compact.chat-shell-runner-open .chat-workspace {
  display: block;
  height: 100%;
}

.chat-shell-compact.chat-shell-runner-open .chat-main-shell,
.chat-shell-compact.chat-shell-runner-open .chat-head-shell,
.chat-shell-compact.chat-shell-runner-open .chat-head,
.chat-shell-compact.chat-shell-runner-open .chat-main {
  display: none;
}

.chat-shell-compact.chat-shell-runner-open .runner-divider {
  display: none;
}

.chat-shell-compact.chat-shell-runner-open .runner-panel {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 100% !important;
  flex: 1 1 auto;
  border-top: none;
  box-shadow: none;
}

.chat-shell-compact.chat-shell-runner-open .runner-panel-body {
  height: 100%;
}

.runner-divider {
  position: relative;
  z-index: 3;
  flex: 0 0 14px;
  width: 14px;
  cursor: col-resize;
  touch-action: none;
  background: linear-gradient(180deg, rgba(13, 79, 66, 0.08), rgba(13, 79, 66, 0.04));
}

.runner-divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 6px;
  width: 2px;
  height: 62px;
  border-radius: 999px;
  transform: translateY(-50%);
  background: rgba(16, 88, 74, 0.46);
  transition: background 0.2s ease;
}

.runner-divider:hover::before,
.runner-resizing .runner-divider::before {
  background: rgba(16, 88, 74, 0.82);
}

.runner-panel {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  min-width: 320px;
  max-width: 72%;
  height: 100% !important;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #eaf7f1, #dff2ea);
  box-shadow: -8px 0 18px rgba(5, 24, 20, 0.16);
}

.runner-resizing .runner-frame {
  pointer-events: none;
}

.runner-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid rgba(13, 79, 66, 0.18);
}

.runner-panel-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.runner-panel-title {
  color: #15483d;
  font-size: 0.9rem;
  font-weight: 700;
}

.runner-panel-subtitle {
  color: #3b6258;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.runner-size-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(13, 79, 66, 0.14);
}

.runner-size-label {
  font-size: 0.72rem;
  color: #31564d;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.runner-width-range {
  flex: 1 1 auto;
}

.runner-size-value {
  min-width: 56px;
  text-align: right;
  font-size: 0.72rem;
  color: #31564d;
}

.runner-panel-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 12px;
}

.runner-frame {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(15, 143, 124, 0.14);
  border-radius: 12px;
  background: #f8fbfd;
}

.runner-frame-web {
  background: #ffffff;
}

.runner-panel-slide-enter-active,
.runner-panel-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}

.runner-panel-slide-enter-from,
.runner-panel-slide-leave-to {
  transform: translateX(26px);
  opacity: 0;
}

.chat-stream {
  flex: 1 1 auto;
  min-height: 280px;
  max-height: min(62vh, 680px);
  overflow-y: auto;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  scrollbar-gutter: stable both-edges;
  padding: clamp(12px, 2vw, 18px);
}

.chat-stream::-webkit-scrollbar {
  width: 9px;
}

.chat-stream::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background-color: rgba(97, 127, 168, 0.35);
  background-clip: padding-box;
}

.chat-stream::-webkit-scrollbar-track {
  background: transparent;
}

.chat-stream-inner,
.composer-inner {
  width: 100%;
}

.chat-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 8px;
}

.message-row {
  display: flex;
  width: 100%;
  align-items: flex-end;
  gap: 10px;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cdd9e8;
  flex: 0 0 auto;
  box-shadow: none;
}

.avatar-ai {
  background: #edf3ff;
  color: #2a5db8;
}

.avatar-user {
  background: #1f6feb;
  color: #f4f9ff;
}

.bubble {
  width: min(calc(100% - 40px), var(--chat-bubble-max-width));
  max-width: 100%;
  border: 1px solid #d8e3f0;
  border-radius: 16px;
  padding: 12px 13px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  animation: bubble-in 0.2s ease-out both;
  overflow-wrap: anywhere;
}

.bubble-user {
  background: linear-gradient(145deg, var(--chat-accent), var(--chat-accent-strong));
  color: #ffffff;
  border-color: rgba(25, 92, 190, 0.55);
  border-bottom-right-radius: 6px;
}

.bubble-ai {
  background: var(--chat-surface);
  color: #1b2f46;
  border-bottom-left-radius: 6px;
}

.bubble-error {
  background: #fff4f2;
  border-color: rgba(191, 69, 52, 0.4);
}

.bubble-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.69rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--chat-muted);
  opacity: 0.95;
}

.user-text {
  white-space: pre-wrap;
  line-height: 1.66;
  overflow-wrap: anywhere;
}

.image-message {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-skeleton-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-skeleton {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #d5e1ee;
}

.image-skeleton :deep(.v-skeleton-loader__image) {
  min-height: clamp(160px, 36vw, 280px);
}

.generated-image {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #cfdcec;
  background: rgba(46, 90, 144, 0.08);
}

.image-caption {
  font-size: 0.76rem;
  color: #415b79;
  line-height: 1.45;
}

.image-error {
  white-space: pre-wrap;
  line-height: 1.55;
}

.mini-btn {
  border: 1px solid #c6d6ea;
  border-radius: 999px;
  background: #ffffff;
  color: #2f4f72;
  padding: 4px 10px;
  font-size: 0.72rem;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.mini-btn:hover {
  transform: translateY(-1px);
  border-color: #9ab5db;
  background: #f6f9ff;
}

.mini-btn:focus-visible {
  outline: 2px solid rgba(42, 93, 184, 0.45);
  outline-offset: 2px;
}

@keyframes bubble-in {
  from {
    transform: translateY(4px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.typing {
  display: inline-flex;
  gap: 6px;
}

.typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2d62be;
  animation: pulse 1s infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.composer {
  position: sticky;
  bottom: 0;
  flex: 0 0 auto;
  border-top: 1px solid var(--chat-border);
  background: rgba(248, 251, 255, 0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 -6px 16px rgba(15, 23, 42, 0.08);
  padding: 14px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
}

.chat-shell-fullscreen .composer {
  padding-inline: 0;
}

.composer :deep(.v-field) {
  border: 1px solid #d3deeb;
  border-radius: 12px;
  background: #ffffff;
}

.composer :deep(.v-field__input) {
  line-height: 1.55;
}

.composer :deep(textarea) {
  overflow-y: auto !important;
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.composer-button-stack {
  display: flex;
  align-items: center;
  gap: 10px;
}

.composer-send-btn {
  min-width: 122px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.markdown-body {
  font-size: 0.92rem;
  line-height: 1.66;
  color: #1b2f46;
  overflow-wrap: anywhere;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 0.4rem 0 0.35rem;
  line-height: 1.35;
}

.markdown-body :deep(h1) {
  font-size: 1.06rem;
}

.markdown-body :deep(h2) {
  font-size: 1rem;
}

.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-size: 0.95rem;
}

.markdown-body :deep(p) {
  margin: 0 0 0.62rem;
}

.markdown-body :deep(code:not(pre code)) {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.78rem;
  font-weight: bolder;
  line-height: 1.24;
  border-radius: 5px;
  padding: 1px 5px;
  border: 1px solid rgba(33, 71, 120, 0.18);
  background: #f4f8fd;
  color: #1b466e;
  overflow-wrap: anywhere;
}

.markdown-body :deep(.code-block-wrapper) {
  margin: 12px 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dbe5f0;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.markdown-body :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafcff;
  border-bottom: 1px solid #e6edf5;
  color: #2c3f57;
}

.markdown-body :deep(.code-header-actions) {
  display: flex;
  align-items: center;
  gap: 8px;
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
  color: #4a5f78;
  font-weight: 500;
}

.markdown-body :deep(.copy-btn) {
  border-radius: 6px;
  border: 1px solid #ccd9e8;
  background: #ffffff;
  color: #2c4f72;
  padding: 3px 9px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-body :deep(.run-btn) {
  border: 1px solid rgba(15, 143, 124, 0.18);
  border-radius: 6px;
  background: rgba(15, 143, 124, 0.08);
  color: #0f6559;
  padding: 3px 9px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-body :deep(.copy-btn:hover) {
  background: rgba(15, 143, 124, 0.12);
  border-color: rgba(15, 143, 124, 0.28);
}

.markdown-body :deep(.run-btn:hover) {
  background: rgba(15, 143, 124, 0.16);
  border-color: rgba(15, 143, 124, 0.28);
}

.markdown-body :deep(pre[class*="language-"]) {
  margin: 0;
  padding: 14px 15px;
  background: #fcfdff;
  color: #1a2735;
  overflow-x: auto;
}

.markdown-body :deep(pre[class*="language-"] code) {
  color: black;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 0.84rem;
  line-height: 1.65;
}

.markdown-body :deep(.token.comment),
.markdown-body :deep(.token.prolog),
.markdown-body :deep(.token.doctype),
.markdown-body :deep(.token.cdata) {
  color: #6e7781;
}

.markdown-body :deep(.token.punctuation) {
  color: #57606a;
}

.markdown-body :deep(.token.property),
.markdown-body :deep(.token.tag),
.markdown-body :deep(.token.constant),
.markdown-body :deep(.token.symbol),
.markdown-body :deep(.token.deleted) {
  color: #b35900;
}

.markdown-body :deep(.token.boolean),
.markdown-body :deep(.token.number) {
  color: #0a66c2;
}

.markdown-body :deep(.token.selector),
.markdown-body :deep(.token.attr-name),
.markdown-body :deep(.token.string),
.markdown-body :deep(.token.char),
.markdown-body :deep(.token.builtin),
.markdown-body :deep(.token.inserted) {
  color: #0f766e;
}

.markdown-body :deep(.token.operator),
.markdown-body :deep(.token.entity),
.markdown-body :deep(.token.url),
.markdown-body :deep(.token.atrule),
.markdown-body :deep(.token.attr-value),
.markdown-body :deep(.token.keyword) {
  color: #0b5cad;
}

.markdown-body :deep(.token.function),
.markdown-body :deep(.token.class-name) {
  color: #1f4f8f;
}

.markdown-body :deep(.token.regex),
.markdown-body :deep(.token.important),
.markdown-body :deep(.token.variable) {
  color: #be123c;
}

@media (max-width: 1264px) {
  .ai-page :deep(.v-container) {
    padding-left: 16px;
    padding-right: 16px;
  }

  .chat-shell {
    min-height: 70vh;
  }
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chat-shell {
    min-height: min(80dvh, 820px);
    height: auto;
  }

  .chat-stream {
    max-height: none;
    min-height: 240px;
  }

  .bubble {
    width: min(calc(100% - 40px), 620px);
  }

  .chat-head-identity {
    width: auto;
    flex: 0 0 auto;
    justify-content: flex-start;
  }

  .chat-head-actions {
    width: auto;
    flex: 1 1 auto;
    justify-content: flex-end;
  }

  .chat-head-subline {
    gap: 6px 10px;
  }
}

@media (max-width: 760px) {
  .chat-head {
    padding: 11px;
    gap: 8px;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .chat-head-identity {
    flex: 1 1 auto;
  }

  .chat-head-actions {
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .chat-head-actions :deep(.chat-action-btn) {
    min-width: 34px !important;
    width: 34px !important;
    height: 34px;
    padding: 0;
  }

  .chat-head-actions :deep(.chat-action-btn .v-btn__content) {
    justify-content: center;
  }

  .chat-head-subline {
    padding: 0 11px 10px;
    font-size: 0.69rem;
    gap: 6px 8px;
  }

  .chat-head-subline span {
    padding: 2px 7px;
  }

  .bubble {
    width: min(calc(100% - 38px), 100%);
  }

  .bubble-meta {
    flex-wrap: wrap;
  }

  .message-avatar {
    width: 26px;
    height: 26px;
  }

  .composer-send-btn {
    min-width: 104px;
  }

  .composer-hints {
    gap: 6px;
    margin-top: 9px;
  }

  .composer-hints span {
    font-size: 0.68rem;
    padding: 3px 8px;
  }
}

@media (max-width: 600px) {
  .ai-page {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .hero-title {
    font-size: clamp(1.55rem, 8vw, 2.1rem);
    line-height: 1.15;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .composer {
    padding-top: 10px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  }

  .composer-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .composer-button-stack {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .composer-send-btn {
    width: 100%;
  }

  .chat-shell {
    min-height: calc(100dvh - 132px);
    height: auto;
    max-height: none;
    border-radius: 14px;
  }

  .chat-head {
    padding: 10px 10px 8px;
  }

  .chat-head-actions {
    gap: 6px;
  }

  .chat-head-actions :deep(.chat-action-btn) {
    width: 32px !important;
    height: 32px;
  }

  .chat-head-actions :deep(.chat-action-btn .v-icon) {
    font-size: 17px;
  }

  .chat-head-subline {
    padding: 0 10px 9px;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .chat-head-subline::-webkit-scrollbar {
    display: none;
  }

  .chat-stream {
    min-height: 210px;
    padding: 10px;
  }

  .markdown-body {
    font-size: 0.88rem;
  }

  .bubble {
    width: min(calc(100% - 34px), 100%);
    padding: 10px 11px;
    border-radius: 14px;
  }

  .bubble-meta {
    font-size: 0.66rem;
  }

  .message-row {
    gap: 8px;
  }

  .message-avatar {
    width: 24px;
    height: 24px;
  }

  .composer-hints {
    gap: 5px;
  }

  .composer-hints span {
    width: fit-content;
    max-width: 100%;
    font-size: 0.67rem;
    padding: 2px 7px;
  }

  .composer-hints span:nth-child(2) {
    display: none;
  }

  .generated-image {
    max-height: 300px;
  }

  .image-skeleton :deep(.v-skeleton-loader__image) {
    min-height: 180px;
  }

  .runner-divider {
    display: none;
  }

  .runner-panel {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    flex-basis: min(52dvh, 420px);
    height: min(52dvh, 420px);
  }

  .chat-shell-runner-open .chat-head,
  .chat-shell-runner-open .chat-main {
    transform: none;
  }
}

@media (max-width: 420px) {
  .chat-head-subline span:nth-child(2) {
    display: none;
  }

  .composer-hints {
    display: none;
  }
}

@media (max-height: 820px) {

  .chat-shell-fullscreen.chat-shell-runner-open .chat-main-shell,
  .chat-shell-fullscreen.chat-shell-runner-open .chat-head-shell,
  .chat-shell-fullscreen.chat-shell-runner-open .chat-head,
  .chat-shell-fullscreen.chat-shell-runner-open .chat-main,
  .chat-shell-fullscreen.chat-shell-runner-open .runner-divider {
    display: none;
  }

  .chat-shell-fullscreen.chat-shell-runner-open .chat-workspace {
    display: block;
    height: 100%;
  }

  .chat-shell-fullscreen.chat-shell-runner-open .runner-panel {
    width: 100% !important;
    min-width: 0;
    max-width: 100%;
    height: 100% !important;
    flex: 1 1 auto;
    box-shadow: none;
    border-top: none;
  }

  .chat-shell-fullscreen.chat-shell-runner-open .runner-panel-body {
    height: 100%;
  }
}

/* ===== Chatbox Redesign (Vuetify-first) ===== */
.chat-shell {
  --chat-max-width: 760px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
  min-height: clamp(520px, 76vh, 920px);
}

.chat-head-shell {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(8px);
}

.chat-toolbar {
  min-height: 58px;
}

.chat-title-wrap {
  line-height: 1.2;
}

.chat-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.chat-subtitle {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.chat-toolbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.chat-toolbar-actions::-webkit-scrollbar {
  display: none;
}

.chat-toolbar-actions :deep(.v-btn) {
  white-space: nowrap;
}

.chat-toolbar-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chat-toolbar-hints code,
.composer-hints code {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.66rem;
}

.chat-main {
  padding: 0 !important;
}

.chat-stream {
  max-height: none;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
}

.chat-inner {
  gap: 4px;
}

.message-stack {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 100%;
}

.message-stack-user {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-stack-ai {
  flex-direction: row;
}

.message-card {
  width: fit-content;
  max-width: min(var(--chat-max-width), calc(100vw - 130px));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
}

.message-card-body {
  padding: 12px 14px !important;
}

.message-card-ai {
  color: rgb(var(--v-theme-on-surface));
}

.message-card-user {
  background: linear-gradient(155deg,
      rgb(var(--v-theme-primary)),
      rgba(var(--v-theme-primary), 0.8));
  color: #ffffff;
  border-color: rgba(var(--v-theme-primary), 0.58);
}

.message-card-user .message-meta,
.message-card-user .user-text {
  color: rgba(255, 255, 255, 0.9);
}

.message-card-error {
  background: rgba(var(--v-theme-error), 0.16);
  color: rgb(var(--v-theme-on-surface));
  border-color: rgba(var(--v-theme-error), 0.45);
}

.message-meta {
  font-size: 0.68rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.user-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.62;
  overflow-wrap: anywhere;
}

.generated-image {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgba(var(--v-theme-primary), 0.08);
}

.generated-image-trigger {
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: zoom-in;
  display: block;
}

.generated-image-trigger:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.8);
  outline-offset: 2px;
}

.generated-image-trigger .generated-image {
  display: block;
}

.composer {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgba(var(--v-theme-surface), 0.98);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
}

.composer :deep(.v-field) {
  border-color: rgba(var(--v-theme-on-surface), 0.18);
  background: rgba(var(--v-theme-surface), 0.96);
}

.composer-hints {
  gap: 6px;
}

.composer-actions {
  justify-content: flex-end;
}

.composer-send-btn {
  min-width: 124px;
}

.runner-panel {
  background: rgba(var(--v-theme-surface), 0.98);
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.14);
}

.runner-panel-head {
  border-bottom-color: rgba(var(--v-theme-on-surface), 0.14);
}

.runner-panel-title {
  color: rgb(var(--v-theme-on-surface));
}

.runner-panel-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.62);
}

@media (max-width: 960px) {
  .chat-shell {
    min-height: min(80dvh, 860px);
    height: auto;
  }

  .message-card {
    max-width: min(100%, calc(100vw - 116px));
  }
}

@media (max-width: 760px) {
  .chat-toolbar-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
    padding-bottom: 4px;
  }

  .chat-toolbar-hints {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .chat-toolbar-hints::-webkit-scrollbar {
    display: none;
  }

  .message-card {
    max-width: min(100%, calc(100vw - 94px));
  }

  .message-card-body {
    padding: 10px 12px !important;
  }
}

@media (max-width: 600px) {
  .chat-shell {
    min-height: calc(100dvh - 132px);
    height: auto;
    max-height: none;
    border-radius: 16px;
  }

  .message-stack {
    gap: 8px;
  }

  .message-card {
    max-width: min(100%, calc(100vw - 78px));
  }

  .composer-actions {
    display: block;
  }

  .composer-send-btn {
    width: 100%;
  }

  .hint-optional {
    display: none;
  }
}

@media (max-width: 420px) {
  .composer-hints {
    display: none;
  }
}

/* Theme-aware surfaces so dark mode follows Vuetify theme */
.ai-page {
  background: rgb(var(--v-theme-background));
}

.hero-shell {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: linear-gradient(180deg,
      rgba(var(--v-theme-surface), 0.96),
      rgba(var(--v-theme-surface), 0.9));
}

.hero-kicker {
  color: rgb(var(--v-theme-primary));
}

.hero-title {
  color: rgb(var(--v-theme-on-surface));
}

.hero-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.stat-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background: rgba(var(--v-theme-surface), 0.95);
}

.stat-value {
  color: rgb(var(--v-theme-on-surface));
}

.stat-label {
  color: rgba(var(--v-theme-on-surface), 0.62);
}

/* ===== Minimal Vuetify Dark Reset ===== */
.ai-page {
  background: rgb(var(--v-theme-background)) !important;
}

.hero-shell {
  background: transparent !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

.hero-kicker,
.hero-title,
.hero-subtitle {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.hero-subtitle {
  opacity: 0.72;
}

.stat-card {
  background: rgb(var(--v-theme-surface)) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.14) !important;
}

.chat-shell {
  background: rgb(var(--v-theme-surface)) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.14) !important;
  box-shadow: none !important;
}

.chat-workspace,
.chat-main-shell,
.chat-main {
  overflow-y: auto !important;
}

.chat-head-shell {
  background: rgb(var(--v-theme-surface)) !important;
  border-bottom-color: rgba(var(--v-theme-on-surface), 0.12) !important;
}

.chat-title,
.chat-subtitle {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.chat-subtitle {
  opacity: 0.68;
}

.chat-toolbar-hints,
.composer-hints {
  display: none !important;
}

.chat-stream {
  max-height: none !important;
  min-height: 280px;
  padding-bottom: 8px;
}

.message-card {
  background: rgb(var(--v-theme-surface)) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.14) !important;
  box-shadow: none !important;
  max-width: min(780px, calc(100vw - 120px)) !important;
}

.message-card-ai {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.message-card-user {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  border-color: rgba(var(--v-theme-primary), 0.7) !important;
}

.message-meta {
  color: rgba(var(--v-theme-on-surface), 0.64) !important;
}

.message-card-user .message-meta {
  color: rgba(var(--v-theme-on-primary), 0.84) !important;
}

.composer {
  background: rgb(var(--v-theme-surface)) !important;
  border-top-color: rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.chat-toolbar :deep(.v-toolbar__content) {
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 8px;
}

.chat-toolbar :deep(.v-toolbar__prepend) {
  margin-inline-end: 0;
  min-width: 0;
  flex: 1 1 auto;
}

.chat-toolbar :deep(.v-toolbar__prepend .v-avatar) {
  flex: 0 0 auto;
}

.chat-title-wrap {
  min-width: 0;
}

.chat-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-toolbar-actions {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow-x: visible;
  overflow-y: visible;
  flex-wrap: nowrap;
  gap: 6px;
}

.chat-toolbar-actions :deep(.v-btn) {
  flex: 0 0 auto;
}

.chat-toolbar-model {
  flex: 1 1 176px;
  min-width: 132px;
  max-width: 190px;
  margin-left: 8px;
}

.model-select :deep(.v-field) {
  font-size: 0.78rem;
  border-radius: 10px;
}

.model-select {
  width: 100%;
  min-width: 0;
}

.model-select :deep(.v-field__input) {
  padding-top: 4px;
  padding-bottom: 4px;
  min-height: 32px;
}

.search-bar-wrap {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.97);
}

.search-bar-wrap :deep(.v-field) {
  font-size: 0.84rem;
}

.search-empty {
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.66);
}

.message-card-search-hit {
  border-color: rgba(var(--v-theme-primary), 0.54) !important;
}

.message-card-search-focus {
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.52) !important;
}

.message-card-search-dim {
  filter: blur(1.8px) saturate(0.58);
  opacity: 0.42;
  transform: scale(0.994);
  transition: filter 0.18s ease, opacity 0.18s ease, transform 0.18s ease;
}

.composer-inline {
  width: min(560px, 100%);
  margin-inline: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.composer-input {
  flex: 1 1 auto;
}

.composer :deep(.v-sheet) {
  padding: 8px 10px !important;
}

.composer-input :deep(textarea) {
  min-height: 42px;
  line-height: 1.3;
  padding-top: 10px;
  padding-bottom: 10px;
}

.composer :deep(.v-field) {
  background: rgb(var(--v-theme-surface)) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.16) !important;
  min-height: 42px;
}

.composer-actions {
  display: none !important;
}

.composer-send-btn {
  width: 42px !important;
  min-width: 42px !important;
  height: 42px;
  padding: 0 !important;
  flex: 0 0 auto;
}

.runner-panel {
  background: rgb(var(--v-theme-surface)) !important;
  border-left-color: rgba(var(--v-theme-on-surface), 0.14) !important;
}

@media (max-width: 1180px) {
  .chat-toolbar-actions {
    gap: 5px;
  }

  .chat-toolbar-model {
    flex-basis: 156px;
    min-width: 120px;
    max-width: 168px;
  }
}

@media (min-width: 961px) {
  .chat-shell {
    min-height: 864px !important;
    height: calc(100dvh - 210px) !important;
    max-height: 920px !important;
  }

  .chat-workspace {
    height: 100% !important;
    min-height: 0 !important;
    overflow-y: auto !important;
  }
}

@media (max-width: 960px) {
  .message-card {
    max-width: min(100%, calc(100vw - 100px)) !important;
  }
}

@media (max-width: 760px) {
  .chat-head-shell {
    overflow: visible;
  }

  .chat-toolbar {
    min-height: auto;
    height: auto;
    overflow: visible;
  }

  .chat-toolbar :deep(.v-toolbar__content) {
    align-items: center;
    flex-wrap: wrap;
    min-height: 0 !important;
    height: auto !important;
    row-gap: 8px;
    column-gap: 6px;
    padding-top: 8px;
    padding-bottom: 8px;
    overflow: visible;
  }

  .chat-toolbar :deep(.v-toolbar__prepend) {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    margin: 0;
  }

  .chat-toolbar :deep(.v-toolbar__prepend .v-avatar) {
    display: inline-flex;
    width: 22px !important;
    height: 22px !important;
    min-width: 22px !important;
  }

  .chat-title {
    font-size: 0.9rem;
  }

  .chat-toolbar-actions {
    width: auto;
    max-width: calc(100% - 120px);
    margin-left: auto;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 6px;
    row-gap: 0;
    white-space: nowrap;
    overflow-x: auto;
  }

  .chat-toolbar-actions :deep(.v-btn) {
    min-width: 34px;
    height: 34px;
    padding-inline: 10px;
  }

  .chat-toolbar-model {
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    order: 3;
    position: relative;
    z-index: 2;
  }

  .model-select {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .message-avatar {
    display: none !important;
  }

  .message-stack {
    gap: 0;
  }

  .message-card {
    max-width: min(100%, calc(100vw - 36px)) !important;
  }
}

@media (max-width: 600px) {
  .chat-toolbar :deep(.v-toolbar__content) {
    row-gap: 6px;
  }

  .chat-toolbar-actions {
    gap: 5px;
    max-width: calc(100% - 106px);
  }

  .chat-toolbar-actions :deep(.v-btn) {
    min-width: 32px;
    height: 32px;
    padding-inline: 8px;
  }

  .model-select :deep(.v-field__input) {
    min-height: 30px;
  }

  .chat-shell {
    min-height: calc(100dvh - 132px) !important;
    height: calc(100dvh - 132px) !important;
    max-height: calc(100dvh - 132px) !important;
  }

  .chat-workspace {
    height: 100% !important;
    min-height: 0 !important;
    overflow-y: auto !important;
  }

  .message-avatar {
    display: none !important;
  }

  .message-stack {
    gap: 0;
  }

  .message-card {
    max-width: min(100%, calc(100vw - 28px)) !important;
  }

  .composer-inline {
    width: min(100%, 420px);
    gap: 6px;
  }

  .composer-send-btn {
    width: 40px !important;
    min-width: 40px !important;
    height: 40px;
  }
}
</style>
