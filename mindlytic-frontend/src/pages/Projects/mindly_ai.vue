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
          <v-card
            ref="chatShell"
            :class="[
              'chat-shell',
              {
                'chat-shell-fullscreen': isChatFullscreen,
                'chat-shell-runner-open': runnerPanelOpen,
                'chat-shell-compact': isCompactLayout,
                'runner-resizing': runnerResizing,
              },
            ]"
            rounded="xl"
            elevation="0"
          >
            <div class="chat-head">
              <div class="d-flex align-center ga-2 flex-wrap">
                <v-chip size="small" color="primary">{{ currentModel.label }}</v-chip>
                <v-chip size="small" color="teal" variant="outlined">{{ selectedPersonaLabel }}</v-chip>
              </div>
              <div class="chat-head-actions">
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  rounded="lg"
                  class="text-none"
                  :prepend-icon="isChatFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                  @click="toggleChatFullscreen"
                >
                  {{ isChatFullscreen ? "Exit Full Screen" : "Full Screen" }}
                </v-btn>
                <p class="text-caption mb-0 text-medium-emphasis">Enter to send, Shift+Enter for newline</p>
              </div>
            </div>

            <div ref="chatWorkspace" class="chat-workspace">
              <div class="chat-main">
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
              </div>

              <div
                v-if="runnerPanelOpen && !isCompactLayout"
                class="runner-divider"
                role="separator"
                aria-orientation="vertical"
                title="Resize runner panel"
                @pointerdown.stop.prevent="startRunnerResize"
                @mousedown.stop.prevent="startRunnerResize"
                @touchstart.stop.prevent="startRunnerResize"
              ></div>
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
                      <v-btn size="x-small" variant="tonal" color="primary" class="text-none" @click="setRunnerMode('web')">Web</v-btn>
                      <v-btn size="x-small" variant="tonal" color="primary" class="text-none" @click="setRunnerMode('console')">Console</v-btn>
                      <v-btn size="small" variant="text" color="primary" icon="mdi-close" @click="closeCodeRunner"></v-btn>
                    </div>
                  </div>
                  <div class="runner-panel-body">
                    <iframe
                      :key="runnerFrameKey"
                      :class="['runner-frame', { 'runner-frame-web': runnerMode === 'web' }]"
                      :srcdoc="runnerSrcdoc"
                      sandbox="allow-scripts allow-modals"
                      referrerpolicy="no-referrer"
                    ></iframe>
                  </div>
                </aside>
              </transition>
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
    id: "all-in-one",
    label: "All in One",
    prompt:
      "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first, then add implementation details, edge cases, and simple teaching guidance when useful.",
  },
];

const DEFAULT_TEMPERATURE = 1.5;
const DEFAULT_MAX_OUTPUT_TOKENS = 2000;
const DEFAULT_PERSONA = "all-in-one";
const DEFAULT_MODEL = "gemini";

const selectedModel = ref(DEFAULT_MODEL);
const selectedPersona = ref(DEFAULT_PERSONA);
const temperature = ref(DEFAULT_TEMPERATURE);
const maxOutputTokens = ref(DEFAULT_MAX_OUTPUT_TOKENS);
const userInput = ref("");
const loading = ref(false);
const lastResponseMs = ref(0);

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const chatContainer = ref(null);
const chatShell = ref(null);
const chatWorkspace = ref(null);
const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1280);
const isChatFullscreen = ref(false);
const runnerPanelOpen = ref(false);
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

const currentModel = computed(() => modelCatalog.find((m) => m.id === selectedModel.value) || modelCatalog[0]);
const selectedPersonaData = computed(() => personaOptions.find((p) => p.id === selectedPersona.value) || personaOptions[0]);
const selectedPersonaLabel = computed(() => selectedPersonaData.value.label);
const hasSelectedApiKey = computed(() => Boolean(currentModel.value.available));
const composerPlaceholder = computed(() =>
  hasSelectedApiKey.value ? `Message Mindlytic AI...` : "Set VITE_GEMINI_API_KEY to enable Gemini",
);
const sendDisabled = computed(() => loading.value || !userInput.value.trim() || !hasSelectedApiKey.value);
const canRegenerate = computed(() => messages.value.some((m) => m.role === "user"));
const userMessageCount = computed(() => messages.value.filter((m) => m.role === "user").length);
const assistantMessageCount = computed(() => messages.value.filter((m) => m.role === "assistant").length);
const lastResponseLabel = computed(() => (lastResponseMs.value ? `${(lastResponseMs.value / 1000).toFixed(1)}s` : "--"));
const isCompactLayout = computed(() => viewportWidth.value <= 900);
const runnerPanelStyle = computed(() => (isCompactLayout.value ? {} : { width: `${runnerPanelWidth.value}px` }));

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
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:#05080d;color:#d1e7ff;font-family:'JetBrains Mono',Consolas,monospace}#term{height:100%;overflow:auto;padding:14px;white-space:pre-wrap;line-height:1.55}.line-info{color:#75c1ff}.line-error{color:#ff8b8b}.line-result{color:#8ff5b1}.line-log{color:#d1e7ff}</style></head><body><div id="term"></div><script>const term=document.getElementById("term");const write=(text,type="log")=>{const line=document.createElement("div");line.className="line-"+type;line.textContent=String(text??"");term.appendChild(line);term.scrollTop=term.scrollHeight;};const loadScript=(src)=>new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error("Failed to load runtime"));document.head.appendChild(script);});(async()=>{write("Loading Python runtime...","info");try{await loadScript("https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js");const pyodide=await loadPyodide({stdout:(msg)=>write(msg,"log"),stderr:(msg)=>write(msg,"error")});const result=await pyodide.runPythonAsync(${serializeForScript(
      code,
    )});if(result!==undefined&&result!==null){write(String(result),"result");}write("Execution completed.","info");}catch(error){write(error?.stack||String(error),"error");}})();<\/script></body></html>`;
  }

  if (jsLanguages.has(language)) {
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:#05080d;color:#d1e7ff;font-family:'JetBrains Mono',Consolas,monospace}#term{height:100%;overflow:auto;padding:14px;white-space:pre-wrap;line-height:1.55}.line-info{color:#75c1ff}.line-error{color:#ff8b8b}.line-result{color:#8ff5b1}.line-warn{color:#ffd480}.line-log{color:#d1e7ff}</style></head><body><div id="term"></div><script>const term=document.getElementById("term");const write=(text,type="log")=>{const line=document.createElement("div");line.className="line-"+type;line.textContent=String(text??"");term.appendChild(line);term.scrollTop=term.scrollHeight;};const asText=(value)=>{if(typeof value==="string")return value;try{return JSON.stringify(value);}catch{return String(value);}};const runtimeConsole={log:(...args)=>write(args.map(asText).join(" "),"log"),info:(...args)=>write(args.map(asText).join(" "),"info"),warn:(...args)=>write(args.map(asText).join(" "),"warn"),error:(...args)=>write(args.map(asText).join(" "),"error")};window.addEventListener("error",(event)=>write(event.message||"Runtime error","error"));window.addEventListener("unhandledrejection",(event)=>write("Unhandled: "+asText(event.reason),"error"));(async()=>{try{const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;const runner=new AsyncFunction("console",${serializeForScript(
      code,
    )});const result=await runner(runtimeConsole);if(result!==undefined){write("=> "+asText(result),"result");}}catch(error){write(error?.stack||String(error),"error");}})();<\/script></body></html>`;
  }

  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:#05080d;color:#d1e7ff;font-family:'JetBrains Mono',Consolas,monospace}#term{padding:14px;white-space:pre-wrap;line-height:1.55}</style></head><body><div id="term">Language "${language}" is not executable in this runner.\n\n${code}</div></body></html>`;
};

renderer.code = ({ text, lang }) => {
  const language = (lang || "plaintext").trim();
  const safeLanguage = normalizeCodeLanguage(language);
  const grammar = Prism.languages[safeLanguage] || Prism.languages.plaintext;
  const html = Prism.highlight(text, grammar, safeLanguage);

  return `<div class="code-block-wrapper"><div class="code-header"><div class="code-header-left"><span class="code-dot dot-red"></span><span class="code-dot dot-yellow"></span><span class="code-dot dot-green"></span><span class="lang-label">${language || "plaintext"}</span></div><div class="code-header-actions"><button class="run-btn" aria-label="Run code">Run</button><button class="copy-btn" aria-label="Copy code">Copy</button></div></div><pre class="language-${safeLanguage}"><code class="language-${safeLanguage}">${html}</code></pre></div>`;
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

const closeCodeRunner = () => {
  stopRunnerResize();
  runnerPanelOpen.value = false;
};

const handleWindowResize = () => {
  viewportWidth.value = window.innerWidth;
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

const enterChatFullscreen = async () => {
  const shell = chatShell.value;
  if (!shell) return;
  if (document.fullscreenElement === shell) {
    isChatFullscreen.value = true;
    return;
  }
  if (supportsNativeFullscreen()) {
    try {
      await shell.requestFullscreen();
      return;
    } catch (error) {
      console.error("fullscreen entry failed", error);
    }
  }
  isChatFullscreen.value = true;
};

const openCodeRunner = async (code, language) => {
  const safeLanguage = normalizeCodeLanguage(language);

  await enterChatFullscreen();
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
      chatShell.value &&
      typeof chatShell.value.requestFullscreen === "function",
  );

const handleFullscreenChange = () => {
  if (!chatShell.value) return;
  isChatFullscreen.value = document.fullscreenElement === chatShell.value;
  runnerPanelWidth.value = clampRunnerPanelWidth(runnerPanelWidth.value);
  scrollToBottom();
};

const handleGlobalKeydown = (event) => {
  if (event.key === "Escape" && isChatFullscreen.value && document.fullscreenElement !== chatShell.value) {
    isChatFullscreen.value = false;
  }
};

const toggleChatFullscreen = async () => {
  const shell = chatShell.value;
  if (!shell) return;

  if (supportsNativeFullscreen()) {
    try {
      if (document.fullscreenElement === shell) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
      return;
    } catch (error) {
      console.error("fullscreen toggle failed", error);
    }
  }

  isChatFullscreen.value = !isChatFullscreen.value;
  await scrollToBottom();
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
    selectedModel.value = DEFAULT_MODEL;
    selectedPersona.value = DEFAULT_PERSONA;
    temperature.value = DEFAULT_TEMPERATURE;
    maxOutputTokens.value = DEFAULT_MAX_OUTPUT_TOKENS;
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

watch([messages, selectedModel, selectedPersona, temperature, maxOutputTokens], saveState, { deep: true });

onMounted(async () => {
  if (!restoreState()) messages.value = [createMessage("assistant", buildWelcomeText(), { model: selectedModel.value })];
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
  if (document.fullscreenElement === chatShell.value) {
    document.exitFullscreen().catch(() => {});
  }
  isChatFullscreen.value = false;
  runnerPanelOpen.value = false;
  stopGeneration();
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap");

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

.chat-shell {
  border: 1px solid rgba(13, 79, 66, 0.2);
  background: linear-gradient(165deg, #ffffff, #f1f8f4);
  box-shadow: 0 16px 30px rgba(8, 35, 30, 0.11);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: clamp(520px, 76vh, 920px);
}

.chat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(13, 79, 66, 0.14);
  padding: 14px;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-head-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.chat-shell-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1200;
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  max-width: none;
  border-radius: 0 !important;
  margin: 0 !important;
}

.chat-workspace {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.chat-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-shell-fullscreen .chat-stream {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}

.chat-shell-runner-open .chat-head,
.chat-shell-runner-open .chat-main {
  transform: translateX(-10px);
}

.chat-shell-compact.chat-shell-runner-open .chat-workspace {
  flex-direction: column;
}

.chat-shell-compact.chat-shell-runner-open .chat-head,
.chat-shell-compact.chat-shell-runner-open .chat-main {
  transform: none;
}

.chat-shell-compact.chat-shell-runner-open .runner-panel {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  flex: 0 0 min(46dvh, 420px);
  height: min(46dvh, 420px);
  border-top: 1px solid rgba(13, 79, 66, 0.2);
  box-shadow: 0 -8px 18px rgba(5, 24, 20, 0.16);
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
  height: 100%;
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
  border: 1px solid rgba(13, 79, 66, 0.2);
  border-radius: 12px;
  background: #05080d;
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

.markdown-body :deep(.run-btn) {
  border: 1px solid #409d87;
  border-radius: 6px;
  background: rgba(64, 157, 135, 0.18);
  color: #dff8f1;
  padding: 3px 9px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-body :deep(.copy-btn:hover) {
  background: rgba(213, 237, 231, 0.13);
  border-color: #82b3a7;
}

.markdown-body :deep(.run-btn:hover) {
  background: rgba(64, 157, 135, 0.32);
  border-color: #76ccb8;
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

  .chat-stream {
    max-height: none;
    min-height: 250px;
  }

  .bubble {
    width: 100%;
  }

  .chat-head {
    padding: 12px;
  }

  .chat-head-actions {
    width: 100%;
    justify-content: space-between;
  }

  .chat-head-actions p {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .hero-title {
    font-size: clamp(1.55rem, 8vw, 2.1rem);
    line-height: 1.15;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .chat-head,
  .composer {
    padding: 10px;
  }

  .chat-shell {
    min-height: calc(100dvh - 120px);
  }

  .chat-head-actions :deep(.v-btn) {
    width: 100%;
  }

  .chat-stream {
    min-height: 220px;
    padding: 12px;
  }

  .bubble {
    padding: 10px;
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
</style>
