<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Alerts from "@/components/Alerts.vue";
import { getApiBaseUrl, getRemoteApiBaseUrl, isLocalEnv } from "@/utils/apiBaseUrl";
import { auth, googleProvider, hasRequiredFirebaseConfig } from "@/firebase";

// Specialized Mindlytic AI Components & Utilities
import ExportChatDialog from "@/components/MindlyticAi/ExportChatDialog.vue";
import TextSummarizerTool from "@/components/MindlyticAi/TextSummarizerTool.vue";
import PromptEnhancerTool from "@/components/MindlyticAi/PromptEnhancerTool.vue";
import { QUICK_STARTERS } from "@/utils/mindlyticAiData";
import { generateSmartChatFallback } from "@/utils/aiEngines";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const trimTrailingSlash = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const toApiUrl = (base = "", path = "") => {
  const normalizedBase = trimTrailingSlash(base);
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath) return "";
  if (!normalizedBase)
    return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  return `${normalizedBase}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
};

const collectUnique = (values = []) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

// On localhost: tries local backend first, then deployed backend as fallback.
const API_BASE_CANDIDATES = isLocalEnv()
  ? collectUnique([
    getApiBaseUrl(),
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_API_URL_1,
    getRemoteApiBaseUrl(),
    import.meta.env.VITE_API_URL_2,
  ])
  : collectUnique([
    getApiBaseUrl(),
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_API_URL_2,
    getRemoteApiBaseUrl(),
  ]);

const CHAT_API_URLS = collectUnique(
  API_BASE_CANDIDATES.map((base) => toApiUrl(base, "/api/ai/chat")),
);

const getHistoryUrls = (path = "") =>
  collectUnique(
    API_BASE_CANDIDATES.map((base) => toApiUrl(base, `/api/ai/history${path}`)),
  );

const historyLimit = 30;
const HISTORY_MAX_MESSAGES = 80;
const HISTORY_MAX_MESSAGE_CHARS = 12000;
const HISTORY_MAX_TITLE_CHARS = 120;
const CHAT_CONTEXT_MESSAGE_LIMIT = HISTORY_MAX_MESSAGES;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const HISTORY_CACHE_STORAGE_KEY = "mindlytic-ai-history-cache-v1";
const CONVERSATION_QUERY_KEY = "chat";

const GEMINI_API_KEY = (
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_GOOGLE_API_KEY ||
  ""
).trim();
const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || "").trim();
const GROQ_API_BASE = (
  import.meta.env.VITE_GROQ_API_BASE || "https://api.groq.com/openai/v1"
)
  .trim()
  .replace(/\/+$/, "");
const OPENAI_API_KEY = (import.meta.env.VITE_OPENAI_API_KEY || "").trim();
const OPENAI_BASE_URL = (
  import.meta.env.VITE_OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1"
)
  .trim()
  .replace(/\/+$/, "");
const GEMINI_CHAT_MODEL = (
  import.meta.env.VITE_GEMINI_CHAT_MODEL || "gemini-2.5-flash"
).trim();
const GROQ_CHAT_MODEL = (
  import.meta.env.VITE_GROQ_CHAT_MODEL || "llama-3.3-70b-versatile"
).trim();
const OPENAI_CHAT_MODEL = (
  import.meta.env.VITE_OPENAI_CHAT_MODEL || "meta/llama-3.3-70b-instruct"
).trim();

const ASSISTANT_SYSTEM_PROMPT =
  "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first.";
const REQUEST_MAX_OUTPUT_TOKENS = 2000;
const REQUEST_TEMPERATURE = 1;

// Active Tool State ('chat' | 'summarizer' | 'prompter')
const activeTool = ref("chat");

const AI_TOOLS_LIST = [
  { id: "chat", label: "AI Chat", icon: "mdi-chat-processing-outline", desc: "Interactive conversation & code runner" },
  { id: "summarizer", label: "Summarizer", icon: "mdi-text-box-search-outline", desc: "Executive points & rewriter" },
  { id: "prompter", label: "Prompt Architect", icon: "mdi-auto-fix", desc: "Production system prompt designer" },
];

const activeToolLabel = computed(() => {
  const match = AI_TOOLS_LIST.find((t) => t.id === activeTool.value);
  return match ? match.label : "AI Chat";
});

const GUEST_MODE_STORAGE_KEY = "mindlytic-ai-guest-mode-v1";
const authReady = ref(false);
const signingIn = ref(false);
const isGuestMode = ref(
  typeof window !== "undefined" &&
    window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === "true",
);
const loadingHistory = ref(false);
const loadingConversation = ref(false);
const sending = ref(false);
const isStreaming = ref(false);
const cancelStreaming = ref(false);

const { mobile } = useDisplay();
const sidebarOpen = ref(!mobile.value);
const selectedModel = ref("gemini");
const avatarImageFailed = ref(false);
const historyLoadError = ref("");
const THEME_STORAGE_KEY = "mindlytic-ai-theme";
const pageTheme = ref("light");
const router = useRouter();
const route = useRoute();

const currentUser = ref(null);
const conversations = ref([]);
const activeConversationId = ref("");
const messages = ref([]);
const userInput = ref("");
const chatScrollRef = ref(null);
const composerTextareaRef = ref(null);

const showScrollButton = ref(false);

const editingConversationId = ref("");
const editingTitle = ref("");

// Code Runner State
const runnerPanelOpen = ref(false);
const runnerLanguage = ref("plaintext");
const runnerTitle = ref("Code Runner");
const runnerCode = ref("");
const runnerSrcdoc = ref("");
const runnerFrameKey = ref(0);

// Alert Notification State
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

// Dialog States
const deleteDialog = ref(false);
const isDeleting = ref(false);
const deleteConversationId = ref("");
const deleteDialogMode = ref("single");
const syncingRouteConversationId = ref(false);
const profiledialog = ref(false);
const exportDialogOpen = ref(false);

let removeAuthListener = null;

const startRenaming = (item) => {
  editingConversationId.value = item.id;
  editingTitle.value = item.title;
};

const cancelRenaming = () => {
  editingConversationId.value = "";
  editingTitle.value = "";
};

const sanitizeConversationTitle = (value = "", fallback = "New chat") => {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  const compact = normalized.slice(0, HISTORY_MAX_TITLE_CHARS);
  return compact || fallback;
};

const sanitizeMessagesForStorage = (
  source = [],
  {
    limit = HISTORY_MAX_MESSAGES,
    excludeErrored = false,
  } = {},
) => {
  const safeLimit = Number.isInteger(limit)
    ? Math.max(1, Math.min(HISTORY_MAX_MESSAGES, limit))
    : HISTORY_MAX_MESSAGES;
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      if (excludeErrored && Boolean(item?.error)) return null;
      const text = String(item?.text || "")
        .trim()
        .slice(0, HISTORY_MAX_MESSAGE_CHARS);
      if (!text) return null;
      return {
        role: item?.role === "assistant" ? "assistant" : "user",
        text,
        createdAt:
          typeof item?.createdAt === "string" && item.createdAt.trim()
            ? item.createdAt
            : nowIso(),
      };
    })
    .filter(Boolean)
    .slice(-safeLimit);
};

const applyConversationTitleLocally = (conversationId, title) => {
  const normalizedId = normalizeConversationId(conversationId);
  const normalizedTitle = sanitizeConversationTitle(title);
  if (!normalizedId || !normalizedTitle) return false;

  const existingIndex = conversations.value.findIndex(
    (item) => normalizeConversationId(item.id) === normalizedId,
  );
  if (existingIndex >= 0) {
    conversations.value[existingIndex].title = normalizedTitle;
    conversations.value[existingIndex].updatedAt = nowIso();
  }

  const localConv = readLocalConversation(normalizedId);
  if (localConv) {
    localConv.title = normalizedTitle;
    localConv.updatedAt = nowIso();
    upsertLocalConversation(localConv);
  }

  sortConversations();
  return existingIndex >= 0 || Boolean(localConv);
};

const renameConversation = async (item) => {
  const rawNewTitle = String(editingTitle.value || "").trim();
  if (!rawNewTitle || rawNewTitle === item.title) {
    cancelRenaming();
    return;
  }
  const newTitle = sanitizeConversationTitle(rawNewTitle);

  try {
    let conversationMessages = sanitizeMessagesForStorage(
      readLocalConversation(item.id)?.messages || [],
    );
    if (!conversationMessages.length && currentUser.value) {
      const response = await authorizedFetchHistory(
        `/${encodeURIComponent(item.id)}`,
      );
      if (!response.ok) throw new Error(await readErrorResponse(response));
      const payload = await response.json().catch(() => null);
      const conversation = payload?.data;
      if (!conversation)
        throw new Error("Conversation data is invalid or missing.");
      conversationMessages = sanitizeMessagesForStorage(conversation.messages);
    }
    if (!conversationMessages.length) {
      throw new Error("Cannot rename an empty conversation.");
    }

    if (currentUser.value) {
      const updateResponse = await authorizedFetchHistory(
        `/${encodeURIComponent(item.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            messages: conversationMessages,
          }),
        },
      );
      if (!updateResponse.ok) throw new Error(await readErrorResponse(updateResponse));
    }

    applyConversationTitleLocally(item.id, newTitle);
    cancelRenaming();
    showAlert("Chat renamed.", "success");
  } catch (error) {
    if (shouldUseLocalHistoryFallback(error)) {
      const renamedLocally = applyConversationTitleLocally(item.id, newTitle);
      if (renamedLocally) {
        cancelRenaming();
        showAlert("Chat renamed locally.", "success");
        return;
      }
    }
    showAlert(getFriendlyFetchError(error, "rename chat"), "error");
  }
};

const nowIso = () => new Date().toISOString();
const generateConversationId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  return `conversation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeConversationId = (value = "") => {
  const source = Array.isArray(value) ? value[0] : value;
  return String(source || "").trim();
};

const getRouteConversationId = () =>
  normalizeConversationId(route.query?.[CONVERSATION_QUERY_KEY]);

const isLikelyNetworkError = (error) =>
  /failed to fetch|networkerror|load failed|network request failed|econnrefused|enotfound/i.test(
    String(error?.message || ""),
  );

const getFriendlyFetchError = (error, label) => {
  if (isLikelyNetworkError(error)) {
    return `Failed to connect for ${label}. Operating in offline smart fallback mode.`;
  }
  return String(error?.message || `Unable to fetch ${label}.`);
};

const showAlert = (message, type = "success") => {
  alertMessage.value = String(message || "");
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const normalizeSummary = (item = {}) => ({
  id: String(item.id || ""),
  title: sanitizeConversationTitle(item.title || "New chat"),
  messageCount: Number.isFinite(item.messageCount) ? item.messageCount : 0,
  updatedAt:
    typeof item.updatedAt === "string" && item.updatedAt.trim()
      ? item.updatedAt
      : nowIso(),
});

const normalizeMessage = (item = {}) => ({
  role: item?.role === "assistant" ? "assistant" : "user",
  text: String(item?.text || ""),
  createdAt:
    typeof item?.createdAt === "string" && item.createdAt.trim()
      ? item.createdAt
      : nowIso(),
  error: Boolean(item?.error),
});

const createMessage = (role, text, error = false) =>
  normalizeMessage({
    role,
    text,
    error,
    createdAt: nowIso(),
  });

const normalizeConversationRecord = (item = {}) => {
  const normalizedMessages = sanitizeMessagesForStorage(item?.messages || []).map(
    (message) => normalizeMessage(message),
  );
  return {
    id: String(item?.id || "").trim(),
    title: sanitizeConversationTitle(item?.title || "New chat"),
    updatedAt:
      typeof item?.updatedAt === "string" && item.updatedAt.trim()
        ? item.updatedAt
        : nowIso(),
    messages: normalizedMessages,
  };
};

const getHistoryCacheOwnerKey = () => {
  const uid = String(currentUser.value?.uid || "").trim();
  if (uid) return `uid:${uid}`;
  const email = String(currentUser.value?.email || "")
    .trim()
    .toLowerCase();
  if (email) return `email:${email}`;
  return "guest";
};

const readHistoryCacheRoot = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_CACHE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeHistoryCacheRoot = (root = {}) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_CACHE_STORAGE_KEY, JSON.stringify(root));
  } catch {
    // storage may be unavailable or full
  }
};

const readLocalConversationStore = () => {
  const root = readHistoryCacheRoot();
  const ownerKey = getHistoryCacheOwnerKey();
  const ownerStore = root?.[ownerKey];
  return ownerStore && typeof ownerStore === "object" ? ownerStore : {};
};

const writeLocalConversationStore = (store = {}) => {
  const root = readHistoryCacheRoot();
  const ownerKey = getHistoryCacheOwnerKey();
  root[ownerKey] = store;
  writeHistoryCacheRoot(root);
};

const listLocalConversationSummaries = (limit = historyLimit) => {
  const store = readLocalConversationStore();
  return Object.values(store)
    .map((item) => normalizeConversationRecord(item))
    .sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    )
    .slice(0, limit)
    .map((item) =>
      normalizeSummary({
        id: item.id,
        title: item.title,
        updatedAt: item.updatedAt,
        messageCount: item.messages.length,
      }),
    );
};

const readLocalConversation = (conversationId = "") => {
  const normalizedId = String(conversationId || "").trim();
  if (!normalizedId) return null;
  const store = readLocalConversationStore();
  const item = store[normalizedId];
  if (!item) return null;
  const normalized = normalizeConversationRecord(item);
  return normalized.id ? normalized : null;
};

const upsertLocalConversation = (conversation = {}) => {
  const normalized = normalizeConversationRecord(conversation);
  if (!normalized.id) return null;
  const store = readLocalConversationStore();
  store[normalized.id] = normalized;
  writeLocalConversationStore(store);
  return normalized;
};

const removeLocalConversation = (conversationId = "") => {
  const normalizedId = String(conversationId || "").trim();
  if (!normalizedId) return false;
  const store = readLocalConversationStore();
  if (!store[normalizedId]) return false;
  delete store[normalizedId];
  writeLocalConversationStore(store);
  return true;
};

const shouldUseLocalHistoryFallback = (error) => {
  const message = String(error?.message || "").toLowerCase();
  if (!message) return true;
  if (message.includes("please sign in first") && currentUser.value) return false;
  return true;
};

const getIsoWeight = (value = "") => {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const mergeConversationSummaries = (remoteItems = [], localItems = []) => {
  const map = new Map();
  const combined = [...localItems, ...remoteItems].map((item) =>
    normalizeSummary(item),
  );

  for (const item of combined) {
    if (!item.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }

    const existingWeight = getIsoWeight(existing.updatedAt);
    const candidateWeight = getIsoWeight(item.updatedAt);
    if (candidateWeight > existingWeight) {
      map.set(item.id, item);
      continue;
    }

    if (
      candidateWeight === existingWeight &&
      item.messageCount > existing.messageCount
    ) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values())
    .sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    )
    .slice(0, historyLimit);
};

const sortConversations = () => {
  conversations.value.sort((a, b) =>
    String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
  );
};

const readErrorResponse = async (response) => {
  try {
    const payload = await response.json();
    const message = payload?.error || payload?.message || payload?.details;
    if (typeof message === "string" && message.trim()) return message.trim();
  } catch {
    // ignore json parse errors
  }
  const text = await response.text().catch(() => "");
  return text.trim()
    ? text.trim().slice(0, 500)
    : `Request failed (${response.status})`;
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const decodeHtmlEntities = (value = "") =>
  String(value)
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");

const renderAssistantMessage = (text = "") => {
  const raw = String(text || "");
  if (!raw.trim()) return "";
  try {
    const parsed = marked.parse(raw);
    const html = typeof parsed === "string" ? parsed : raw;
    const codeBlocks = extractCodeBlocks(raw);
    let codeIndex = 0;

    const withInlineRunners = html.replace(
      /<pre><code[\s\S]*?<\/code><\/pre>/gi,
      (codeBlockHtml) => {
        const currentCodeIndex = codeIndex;
        const languageFromHtmlMatch = String(codeBlockHtml || "").match(
          /class="[^"]*language-([a-zA-Z0-9_+#.-]+)[^"]*"/i,
        );
        const languageFromHtml = String(languageFromHtmlMatch?.[1] || "")
          .trim()
          .toLowerCase();

        const codeFromHtml = decodeHtmlEntities(
          String(codeBlockHtml || "")
            .replace(/^<pre><code[^>]*>/i, "")
            .replace(/<\/code><\/pre>$/i, ""),
        );

        const rawBlockLanguage =
          String(
            codeBlocks[currentCodeIndex]?.language || languageFromHtml || "code",
          ).toLowerCase() ||
          "code";
        const rawBlockCode = String(
          codeBlocks[currentCodeIndex]?.code || codeFromHtml || "",
        );

        const blockLanguage = inferRunnerLanguage(
          rawBlockLanguage,
          rawBlockCode,
        );

        const escapedCode = escapeHtml(rawBlockCode);
        const codeHtml = `<pre><code class="code-block-text">${escapedCode}</code></pre>`;

        const runButtonHtml = canRunInRunner(blockLanguage)
          ? `<button type="button" class="code-runner-inline-btn" data-code-index="${currentCodeIndex}" data-code-language="${escapeHtml(blockLanguage)}" data-code-action="run" aria-label="Run code in preview">Run</button>`
          : "";

        const headerHtml = `
        <div class="inline-code-runner-head">
          <span class="inline-code-lang">${escapeHtml(blockLanguage)}</span>
          <div class="inline-code-actions">
            <button type="button" class="code-runner-inline-btn" data-code-index="${currentCodeIndex}" data-code-language="${escapeHtml(blockLanguage)}" data-code-action="copy" aria-label="Copy code">Copy</button>
            <button type="button" class="code-runner-inline-btn" data-code-index="${currentCodeIndex}" data-code-language="${escapeHtml(blockLanguage)}" data-code-action="download" aria-label="Download code">Download</button>
            ${runButtonHtml}
          </div>
        </div>`;

        codeIndex += 1;
        return `<div class="inline-code-runner">${headerHtml}${codeHtml}</div>`;
      },
    );

    return DOMPurify.sanitize(withInlineRunners, {
      ADD_TAGS: ["button", "span"],
      ADD_ATTR: [
        "class",
        "target",
        "rel",
        "type",
        "title",
        "role",
        "tabindex",
        "data-code-index",
        "data-code-language",
        "data-code-action",
        "aria-label",
      ],
    });
  } catch {
    return `<p>${escapeHtml(raw)}</p>`;
  }
};

const CODE_FENCE_REGEX = /```([a-zA-Z0-9_+#.-]*)\r?\n([\s\S]*?)```/g;
const extractCodeBlocks = (text = "") => {
  const source = String(text || "");
  return [...source.matchAll(CODE_FENCE_REGEX)].map((match) => ({
    language:
      String(match[1] || "plaintext")
        .trim()
        .toLowerCase() || "plaintext",
    code: String(match[2] || "").trim(),
  }));
};

const extractFirstCodeBlock = (text = "") => {
  const [firstBlock] = extractCodeBlocks(text);
  return firstBlock || { language: "", code: "" };
};

const buildChatMessages = () =>
  sanitizeMessagesForStorage(messages.value, {
    limit: CHAT_CONTEXT_MESSAGE_LIMIT,
    excludeErrored: true,
  }).map((message) => ({
    role: message.role,
    text: message.text,
  }));

const buildOpenAiMessages = () => [
  { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
  ...buildChatMessages().map((message) => ({
    role: message.role,
    content: message.text,
  })),
];

const readOpenAiStyleText = (payload = {}) => {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
};

const requestBackendChat = async ({ provider = "auto", model = "" } = {}) => {
  if (!CHAT_API_URLS.length) {
    throw new Error("Backend chat API URL is not configured.");
  }

  const body = {
    provider,
    messages: buildChatMessages(),
    systemPrompt: ASSISTANT_SYSTEM_PROMPT,
    temperature: REQUEST_TEMPERATURE,
    maxOutputTokens: REQUEST_MAX_OUTPUT_TOKENS,
  };
  if (model) body.model = model;

  let lastError = null;
  for (let index = 0; index < CHAT_API_URLS.length; index += 1) {
    try {
      const response = await fetch(CHAT_API_URLS[index], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // If 503 indicating specific provider is missing, retry with "auto"
        if (response.status === 503 && provider !== "auto") {
          try {
            const retryRes = await fetch(CHAT_API_URLS[index], {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...body, provider: "auto", model: "" }),
            });
            if (retryRes.ok) {
              const payload = await retryRes.json().catch(() => null);
              const text = String(payload?.text || "").trim();
              if (text) return text;
            }
          } catch {
            // ignore retry error
          }
        }

        const message = await readErrorResponse(response);
        const error = new Error(message);
        lastError = error;
        if (
          index < CHAT_API_URLS.length - 1 &&
          RETRYABLE_STATUSES.has(response.status)
        )
          continue;
        throw error;
      }

      const payload = await response.json().catch(() => null);
      const text = String(payload?.text || "").trim();
      if (!text) throw new Error("Backend returned an empty AI response.");
      return text;
    } catch (error) {
      lastError = error;
      if (!isLikelyNetworkError(error) || index === CHAT_API_URLS.length - 1)
        throw error;
    }
  }

  throw lastError || new Error("Unable to reach backend chat API.");
};

const requestGeminiDirect = async (
  customContents = null,
  systemInstruction = ASSISTANT_SYSTEM_PROMPT,
) => {
  if (!GEMINI_API_KEY)
    throw new Error("Gemini API key is missing in frontend env.");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_CHAT_MODEL,
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const contents =
    customContents ||
    buildChatMessages().map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.text }],
    }));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        temperature: REQUEST_TEMPERATURE,
        maxOutputTokens: REQUEST_MAX_OUTPUT_TOKENS,
      },
    }),
  });

  if (!response.ok) throw new Error(await readErrorResponse(response));

  const payload = await response.json().catch(() => null);
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim() || "";
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
};

const requestGroqDirect = async (customMessages = null) => {
  if (!GROQ_API_KEY)
    throw new Error("Groq API key is missing in frontend env.");

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      messages: customMessages || buildOpenAiMessages(),
      temperature: REQUEST_TEMPERATURE,
      max_tokens: REQUEST_MAX_OUTPUT_TOKENS,
      stream: false,
    }),
  });

  if (!response.ok) throw new Error(await readErrorResponse(response));
  const payload = await response.json().catch(() => null);
  const text = readOpenAiStyleText(payload);
  if (!text) throw new Error("Llama/Groq returned an empty response.");
  return text;
};

const requestOpenAiDirect = async (customMessages = null) => {
  if (!OPENAI_API_KEY)
    throw new Error("OpenAI API key is missing in frontend env.");

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      messages: customMessages || buildOpenAiMessages(),
      temperature: REQUEST_TEMPERATURE,
      max_tokens: REQUEST_MAX_OUTPUT_TOKENS,
      stream: false,
    }),
  });

  if (!response.ok) throw new Error(await readErrorResponse(response));
  const payload = await response.json().catch(() => null);
  const text = readOpenAiStyleText(payload);
  if (!text) throw new Error("OpenAI returned an empty response.");
  return text;
};

const SUPPORTED_MODEL_PROVIDERS = new Set(["gemini", "groq", "openai"]);
const normalizeSelectedProvider = (value) => {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? (value.value ?? value.model ?? value.provider ?? "gemini")
        : "gemini";
  const normalized = String(raw || "")
    .trim()
    .toLowerCase();
  return SUPPORTED_MODEL_PROVIDERS.has(normalized) ? normalized : "gemini";
};

const buildProviderAttempts = (provider = "gemini") => {
  if (provider === "gemini") {
    const attempts = [
      () => requestBackendChat({ provider: "gemini", model: GEMINI_CHAT_MODEL }),
    ];
    if (GEMINI_API_KEY) attempts.push(() => requestGeminiDirect());
    return attempts;
  }

  if (provider === "groq") {
    const attempts = [
      () => requestBackendChat({ provider: "groq", model: GROQ_CHAT_MODEL }),
    ];
    if (GROQ_API_KEY) attempts.push(() => requestGroqDirect());
    return attempts;
  }

  const attempts = [
    () => requestBackendChat({ provider: "openai", model: OPENAI_CHAT_MODEL }),
  ];
  if (OPENAI_API_KEY) attempts.push(() => requestOpenAiDirect());
  return attempts;
};

// Resilient AI Assistant Reply with Smart Offline Fallback
const requestAssistantReply = async () => {
  const selectedProvider = normalizeSelectedProvider(selectedModel.value);
  const attempts = buildProviderAttempts(selectedProvider);

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch {
      // try next attempt
    }
  }

  // If specific provider attempts failed, try 'auto' on backend
  try {
    const autoReply = await requestBackendChat({ provider: "auto" });
    if (autoReply && autoReply.trim()) return autoReply.trim();
  } catch {
    // continue to smart engine
  }

  // Graceful smart local offline fallback engine
  const latestUserMessage =
    [...messages.value].reverse().find((m) => m.role === "user")?.text ||
    userInput.value;
  return generateSmartChatFallback(latestUserMessage);
};

// Universal AI Completion Helper passed to sub-tools
const requestAiReply = async (prompt = "", systemInstruction = ASSISTANT_SYSTEM_PROMPT) => {
  const selectedProvider = normalizeSelectedProvider(selectedModel.value);
  const textPrompt = String(prompt || "").trim();
  if (!textPrompt) return "";

  // 1. Try backend API endpoints
  if (CHAT_API_URLS.length) {
    for (const url of CHAT_API_URLS) {
      try {
        const body = {
          provider: selectedProvider,
          messages: [{ role: "user", text: textPrompt }],
          systemPrompt: systemInstruction,
          temperature: REQUEST_TEMPERATURE,
          maxOutputTokens: REQUEST_MAX_OUTPUT_TOKENS,
        };
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const payload = await res.json().catch(() => null);
          const replyText = String(payload?.text || "").trim();
          if (replyText) return replyText;
        }
      } catch {
        // try next endpoint
      }
    }
  }

  // 2. Try direct provider calls matching user's selected provider first
  const openAiMessages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: textPrompt },
  ];
  const geminiContents = [
    { role: "user", parts: [{ text: textPrompt }] },
  ];

  const directAttempts = [];
  if (selectedProvider === "gemini" && GEMINI_API_KEY) {
    directAttempts.push(() => requestGeminiDirect(geminiContents, systemInstruction));
  } else if (selectedProvider === "groq" && GROQ_API_KEY) {
    directAttempts.push(() => requestGroqDirect(openAiMessages));
  } else if (selectedProvider === "openai" && OPENAI_API_KEY) {
    directAttempts.push(() => requestOpenAiDirect(openAiMessages));
  }

  // Fallback to any other available provider keys
  if (GEMINI_API_KEY && selectedProvider !== "gemini") {
    directAttempts.push(() => requestGeminiDirect(geminiContents, systemInstruction));
  }
  if (GROQ_API_KEY && selectedProvider !== "groq") {
    directAttempts.push(() => requestGroqDirect(openAiMessages));
  }
  if (OPENAI_API_KEY && selectedProvider !== "openai") {
    directAttempts.push(() => requestOpenAiDirect(openAiMessages));
  }

  for (const attempt of directAttempts) {
    try {
      const res = await attempt();
      if (res && res.trim()) return res.trim();
    } catch {
      // try next provider
    }
  }

  // Return null when live AI APIs are unreachable so the sub-tool executes its specialized local engine!
  return null;
};

const getAuthorizationHeader = async (forceRefresh = false) => {
  if (!auth?.currentUser) throw new Error("Please sign in first.");
  const idToken = await auth.currentUser.getIdToken(Boolean(forceRefresh));
  if (!idToken) throw new Error("Unable to retrieve auth token.");
  return `Bearer ${idToken}`;
};

const authorizedFetchHistory = async (path = "", options = {}) => {
  const historyUrls = getHistoryUrls(path);
  if (!historyUrls.length) {
    throw new Error("History API URL is not configured.");
  }

  let authorization = await getAuthorizationHeader();
  let lastError = null;

  for (let index = 0; index < historyUrls.length; index += 1) {
    const url = historyUrls[index];
    try {
      let refreshedToken = false;
      while (true) {
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", authorization);

        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.toLowerCase().includes("application/json")) {
            return response;
          }
          lastError = new Error(
            "Backend returned a non-JSON response (likely HTML).",
          );
          break;
        }

        if (response.status === 401 && !refreshedToken) {
          authorization = await getAuthorizationHeader(true);
          refreshedToken = true;
          continue;
        }

        const errorText = await readErrorResponse(response);
        lastError =
          response.status === 401
            ? new Error(
              "History service rejected your sign-in token for this deployment.",
            )
            : new Error(`API error (${response.status}): ${errorText}`);

        if (
          index < historyUrls.length - 1 &&
          (RETRYABLE_STATUSES.has(response.status) ||
            response.status === 401 ||
            response.status === 404)
        ) {
          break;
        }
        throw lastError;
      }
    } catch (error) {
      lastError = error;
      if (isLikelyNetworkError(error) && index < historyUrls.length - 1) {
        continue;
      }
      if (index === historyUrls.length - 1) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Unable to reach history API.");
};

const hasUser = computed(() => Boolean(currentUser.value || isGuestMode.value));
const isDarkTheme = computed(() => pageTheme.value === "dark");
const themeToggleLabel = computed(() =>
  isDarkTheme.value ? "Switch to light theme" : "Switch to black theme",
);
const themeToggleIcon = computed(() =>
  isDarkTheme.value ? "mdi-weather-sunny" : "mdi-weather-night",
);

const canSend = computed(
  () =>
    hasUser.value &&
    !sending.value &&
    !isStreaming.value &&
    Boolean(userInput.value.trim()),
);

const isEmptyConversation = computed(() => messages.value.length === 0);

const modelOptions = computed(() => [
  { label: "Gemini 2.5 Flash", value: "gemini" },
  { label: "Llama 3.3 70B (Groq)", value: "groq" },
  { label: "OpenAI / Meta Llama", value: "openai" },
]);

const activeConversationTitle = computed(() => {
  const active = conversations.value.find(
    (item) => item.id === activeConversationId.value,
  );
  return active?.title || "New chat";
});

const isDeleteAllMode = computed(() => deleteDialogMode.value === "all");
const deleteDialogTitle = computed(() =>
  isDeleteAllMode.value ? "Delete all chats?" : "Delete conversation?",
);
const deleteDialogCopy = computed(() =>
  isDeleteAllMode.value
    ? "This will permanently remove all your saved chats."
    : "This will permanently remove it.",
);

const userInitial = computed(() => {
  const displayName = String(currentUser.value?.displayName || "").trim();
  if (displayName) return displayName.charAt(0).toUpperCase();
  const email = String(currentUser.value?.email || "").trim();
  if (email) return email.charAt(0).toUpperCase();
  return isGuestMode.value ? "G" : "U";
});

const userAvatarSrc = computed(() => {
  if (avatarImageFailed.value) return "";
  const user = currentUser.value;
  const candidates = [
    String(user?.photoURL || "").trim(),
    ...(Array.isArray(user?.providerData) ? user.providerData : []).map(
      (item) => String(item?.photoURL || "").trim(),
    ),
  ].filter(Boolean);
  return candidates[0] || "";
});

const runnerLanguageLabel = computed(() => {
  const map = {
    html: "HTML",
    javascript: "JavaScript",
    js: "JavaScript",
    css: "CSS",
    json: "JSON",
    plaintext: "Text",
  };
  return map[runnerLanguage.value] || runnerLanguage.value.toUpperCase();
});

const composerMenuProps = computed(() => ({
  maxHeight: 280,
  minWidth: 270,
  maxWidth: 270,
  contentClass: isDarkTheme.value
    ? "composer-model-menu composer-model-menu-dark"
    : "composer-model-menu",
}));

const normalizeTheme = (value) => (value === "dark" ? "dark" : "light");
const pageVuetifyTheme = computed(() =>
  isDarkTheme.value ? "portfolioDark" : "portfolioLight",
);

const applyTheme = (value) => {
  pageTheme.value = normalizeTheme(value);
};
const toggleTheme = () => {
  applyTheme(isDarkTheme.value ? "light" : "dark");
};

const formatDateLabel = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const formatMessageTime = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const getConversationTitleFromMessages = (conversationMessages = []) => {
  const firstUser =
    conversationMessages.find((message) => message.role === "user")?.text || "";
  const normalized = String(firstUser || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!normalized) return "New chat";
  const compact = normalized.slice(0, HISTORY_MAX_TITLE_CHARS);
  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact;
};

const insertOrUpdateConversationSummary = (conversation = {}) => {
  const summary = normalizeSummary({
    id: conversation.id,
    title:
      conversation.title ||
      getConversationTitleFromMessages(conversation.messages || []),
    updatedAt: conversation.updatedAt || nowIso(),
    messageCount: Array.isArray(conversation.messages)
      ? conversation.messages.length
      : 0,
  });
  if (!summary.id) return;

  const existingIndex = conversations.value.findIndex(
    (item) => item.id === summary.id,
  );
  if (existingIndex >= 0) {
    conversations.value[existingIndex] = {
      ...conversations.value[existingIndex],
      ...summary,
    };
  } else {
    conversations.value.push(summary);
  }
  sortConversations();
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatScrollRef.value) {
    chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    showScrollButton.value = false;
  }
};

const handleChatScroll = () => {
  if (!chatScrollRef.value) return;
  const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.value;
  showScrollButton.value = scrollHeight - scrollTop - clientHeight > 250;
};

const copyText = async (value, successMessage = "Copied.") => {
  const text = String(value || "");
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    showAlert(successMessage, "success");
  } catch {
    showAlert("Clipboard permission denied.", "error");
  }
};

const syncConversationRoute = async (conversationId, replace = true) => {
  const normalizedId = normalizeConversationId(conversationId);
  if (getRouteConversationId() === normalizedId) return;

  const nextQuery = { ...route.query };
  if (normalizedId) {
    nextQuery[CONVERSATION_QUERY_KEY] = normalizedId;
  } else {
    delete nextQuery[CONVERSATION_QUERY_KEY];
  }

  syncingRouteConversationId.value = true;
  try {
    await router[replace ? "replace" : "push"]({ query: nextQuery });
  } catch {
    // Route sync error catch
  } finally {
    syncingRouteConversationId.value = false;
  }
};

const copyCurrentConversationLink = async () => {
  const conversationId = normalizeConversationId(activeConversationId.value);
  if (!conversationId) {
    showAlert("No chat link is available yet.", "error");
    return;
  }

  await syncConversationRoute(conversationId, true);
  const fallbackPath = `/projects/mindlytic_ai?${CONVERSATION_QUERY_KEY}=${encodeURIComponent(
    conversationId,
  )}`;
  const resolvedUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${trimTrailingSlash(getApiBaseUrl())}${fallbackPath}`;
  await copyText(resolvedUrl, "Chat link copied.");
};

const copyUserEmail = async () => {
  const email = String(currentUser.value?.email || "").trim();
  if (!email) {
    showAlert(isGuestMode.value ? "Running in Guest Mode." : "No email available.", "error");
    return;
  }
  await copyText(email, "Email copied.");
};

const buildRunnerDoc = ({
  code = "",
  language = "plaintext",
}) => {
  const lang = String(language || "plaintext").toLowerCase();
  const source = String(code || "");

  if (["html", "htm", "markup"].includes(lang)) {
    return /<html[\s>]/i.test(source)
      ? source
      : `<!doctype html><html><body style="font-family:system-ui;padding:16px;">${source}</body></html>`;
  }
  if (["javascript", "js"].includes(lang)) {
    return `<!doctype html><html><body style="font-family:system-ui;padding:16px;"><p>Open console for logs.</p><script>${source}<\/script></body></html>`;
  }
  if (lang === "css") {
    return `<!doctype html><html><head><style>${source}</style></head><body><main style="padding:16px;font-family:system-ui;"><h2>CSS Preview</h2><button>Sample Button</button></main></body></html>`;
  }
  return `<!doctype html><html><body style="font-family:Consolas,monospace;padding:14px;"><pre>${escapeHtml(source)}</pre></body></html>`;
};

const runRunnerPreview = () => {
  runnerSrcdoc.value = buildRunnerDoc({
    code: runnerCode.value,
    language: runnerLanguage.value,
  });
  runnerFrameKey.value += 1;
};

const openRunnerWithCode = async ({
  code = "",
  language = "plaintext",
  title = "Assistant code",
} = {}) => {
  const source = String(code || "").trim();
  if (!source) {
    showAlert("No runnable code block found.", "error");
    return;
  }
  const resolvedLanguage = inferRunnerLanguage(language, source);
  if (!canRunInRunner(resolvedLanguage)) {
    showAlert(
      "Run is disabled for this code type. Use Copy or Download.",
      "error",
    );
    return;
  }
  runnerLanguage.value = resolvedLanguage;
  runnerCode.value = source;
  runnerTitle.value = title;
  runnerPanelOpen.value = true;
  await nextTick();
  runRunnerPreview();
};

function inferRunnerLanguage(language = "", code = "") {
  const normalizedLanguage = String(language || "")
    .trim()
    .toLowerCase();
  if (
    normalizedLanguage &&
    normalizedLanguage !== "plaintext" &&
    normalizedLanguage !== "text"
  ) {
    return normalizedLanguage;
  }

  const source = String(code || "").trim();
  if (!source) return "plaintext";
  if (/<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(source))
    return "html";
  if (/\{[\s\S]*:[^;]+;?[\s\S]*\}/m.test(source)) return "css";
  if (
    /\b(const|let|var|function|=>|console\.|document\.|window\.)\b/.test(source)
  )
    return "javascript";
  if (/\b(def |print\(|import |from .+ import )/.test(source)) return "python";
  if (/<\?php|echo\s+/.test(source)) return "php";
  if (/^\s*[\[{]/.test(source)) return "json";
  return "plaintext";
}

function canRunInRunner(language = "") {
  return ["html", "htm", "markup", "javascript", "js", "css"].includes(
    String(language || "").toLowerCase(),
  );
}

const getCodeFilename = (language = "", index = 0) => {
  const normalized = String(language || "txt").toLowerCase();
  const extMap = {
    javascript: "js",
    js: "js",
    typescript: "ts",
    ts: "ts",
    jsx: "jsx",
    tsx: "tsx",
    html: "html",
    htm: "html",
    css: "css",
    json: "json",
    python: "py",
    py: "py",
    bash: "sh",
    shell: "sh",
    sh: "sh",
    sql: "sql",
    xml: "xml",
    yaml: "yml",
    yml: "yml",
    markdown: "md",
    md: "md",
    plaintext: "txt",
    text: "txt",
  };
  const ext = extMap[normalized] || normalized || "txt";
  return `assistant-code-${index + 1}.${ext}`;
};

const downloadCodeBlock = (code = "", language = "", index = 0) => {
  const source = String(code || "");
  if (!source.trim()) {
    showAlert("No code found to download.", "error");
    return;
  }
  const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = getCodeFilename(language, index);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const handleAssistantMessageClick = (event, message, index) => {
  const eventTarget = event?.target;
  const hasElementType = typeof Element !== "undefined";
  const clickableTarget =
    hasElementType && eventTarget instanceof Element
      ? eventTarget
      : eventTarget?.parentElement || null;
  const button = clickableTarget?.closest?.(".code-runner-inline-btn");
  if (!button) return;
  event.preventDefault();

  const parsedIndex = Number.parseInt(
    button.getAttribute("data-code-index") || "0",
    10,
  );
  const blockIndex =
    Number.isInteger(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 0;
  const inlineContainer = button.closest(".inline-code-runner");
  const codeElement = inlineContainer?.querySelector?.("pre code");
  const inlineCode = String(codeElement?.textContent || "").trim();
  const inlineLanguage =
    String(button.getAttribute("data-code-language") || "")
      .trim()
      .toLowerCase() || "plaintext";

  const codeBlocks = extractCodeBlocks(message?.text || "");
  const matchedBlock = codeBlocks[blockIndex];
  const fallbackCode = String(matchedBlock?.code || "").trim();
  const fallbackLanguage = String(matchedBlock?.language || "plaintext")
    .trim()
    .toLowerCase();

  const blockCode = inlineCode || fallbackCode;
  const blockLanguage = inlineLanguage || fallbackLanguage || "plaintext";
  if (!blockCode) {
    showAlert("No runnable code block found.", "error");
    return;
  }

  const action = String(
    button.getAttribute("data-code-action") || "run",
  ).toLowerCase();
  if (action === "copy") {
    copyText(blockCode, "Code copied.");
    return;
  }
  if (action === "download") {
    downloadCodeBlock(blockCode, blockLanguage, blockIndex);
    return;
  }
  if (!canRunInRunner(blockLanguage)) {
    showAlert(
      "Run is disabled for this code type. Use Copy or Download.",
      "error",
    );
    return;
  }
  void openRunnerWithCode({
    code: blockCode,
    language: blockLanguage,
    title: `Assistant code #${index + 1}.${blockIndex + 1}`,
  });
};

const closeRunnerPanel = () => {
  runnerPanelOpen.value = false;
};

const resetToNewConversation = () => {
  activeConversationId.value = generateConversationId();
  messages.value = [];
  userInput.value = "";
  void syncConversationRoute(activeConversationId.value, true);
};

const loadConversationList = async () => {
  if (!hasUser.value) {
    conversations.value = [];
    historyLoadError.value = "";
    return;
  }

  loadingHistory.value = true;
  historyLoadError.value = "";
  try {
    if (!currentUser.value) {
      conversations.value = listLocalConversationSummaries(historyLimit);
      sortConversations();
      return;
    }

    const response = await authorizedFetchHistory(`?limit=${historyLimit}`);
    if (!response.ok) throw new Error(await readErrorResponse(response));
    const payload = await response.json().catch(() => ({ data: [] }));
    const remoteSummaries = Array.isArray(payload?.data)
      ? payload.data.map(normalizeSummary).filter((item) => item.id)
      : [];
    const localSummaries = listLocalConversationSummaries(historyLimit);
    conversations.value = mergeConversationSummaries(
      remoteSummaries,
      localSummaries,
    );
    sortConversations();
  } catch (error) {
    if (shouldUseLocalHistoryFallback(error)) {
      conversations.value = listLocalConversationSummaries(historyLimit);
      sortConversations();
      return;
    }
    historyLoadError.value = getFriendlyFetchError(error, "chat history");
  } finally {
    loadingHistory.value = false;
  }
};

const openConversation = async (conversationId, closeSidebar = true) => {
  const normalizedId = String(conversationId || "").trim();
  if (!normalizedId || !hasUser.value) return;

  // Immediately render from local cache if available for instant UI responsiveness
  const localCache = readLocalConversation(normalizedId);
  if (localCache) {
    activeConversationId.value = localCache.id;
    messages.value = (localCache.messages || []).map(normalizeMessage);
    insertOrUpdateConversationSummary(localCache);
    if (closeSidebar && mobile.value) sidebarOpen.value = false;
    void syncConversationRoute(activeConversationId.value, true);
    void scrollToBottom();
  }

  if (!currentUser.value) return;

  loadingConversation.value = true;
  try {
    const response = await authorizedFetchHistory(
      `/${encodeURIComponent(normalizedId)}`,
    );
    if (!response.ok) throw new Error(await readErrorResponse(response));

    const payload = await response.json().catch(() => null);
    const conversation = payload?.data;
    if (!conversation?.id) throw new Error("Conversation data is invalid.");

    activeConversationId.value = String(conversation.id);
    messages.value = Array.isArray(conversation.messages)
      ? conversation.messages.map(normalizeMessage)
      : [];
    insertOrUpdateConversationSummary(conversation);
    upsertLocalConversation({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt || nowIso(),
      messages: conversation.messages || [],
    });

    if (closeSidebar && mobile.value) sidebarOpen.value = false;
    await syncConversationRoute(activeConversationId.value, true);
    await scrollToBottom();
  } catch (error) {
    const fallbackConversation = shouldUseLocalHistoryFallback(error)
      ? readLocalConversation(normalizedId)
      : null;
    if (fallbackConversation) {
      activeConversationId.value = fallbackConversation.id;
      messages.value = fallbackConversation.messages.map(normalizeMessage);
      insertOrUpdateConversationSummary({
        id: fallbackConversation.id,
        title: fallbackConversation.title,
        updatedAt: fallbackConversation.updatedAt,
        messages: fallbackConversation.messages,
      });
      if (closeSidebar && mobile.value) sidebarOpen.value = false;
      await syncConversationRoute(activeConversationId.value, true);
      await scrollToBottom();
      // Silently sync local conversation to user's remote database account
      if (currentUser.value && fallbackConversation.messages?.length > 0) {
        void saveConversationHistorySafe();
      }
      return;
    }
    // If conversation not found remotely and not found locally, reset cleanly
    if (String(error?.message || "").includes("404")) {
      resetToNewConversation();
      return;
    }
    showAlert(getFriendlyFetchError(error, "conversation"), "error");
  } finally {
    loadingConversation.value = false;
  }
};

const saveConversationHistory = async () => {
  if (!hasUser.value || !activeConversationId.value || !messages.value.length)
    return;

  const persistedMessages = sanitizeMessagesForStorage(messages.value);
  if (!persistedMessages.length) return;

  const activeConv = conversations.value.find(
    (item) => item.id === activeConversationId.value,
  );
  const currentTitle = activeConv?.title;

  const payload = {
    title: sanitizeConversationTitle(
      currentTitle || getConversationTitleFromMessages(messages.value),
    ),
    messages: persistedMessages,
  };

  const localSavedConversation = upsertLocalConversation({
    id: activeConversationId.value,
    title: payload.title,
    updatedAt: nowIso(),
    messages: payload.messages,
  });
  if (localSavedConversation) {
    insertOrUpdateConversationSummary({
      id: localSavedConversation.id,
      title: localSavedConversation.title,
      updatedAt: localSavedConversation.updatedAt,
      messages: localSavedConversation.messages,
    });
  }

  if (!currentUser.value) return; // Guest mode saves locally

  try {
    const response = await authorizedFetchHistory(
      `/${encodeURIComponent(activeConversationId.value)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) throw new Error(await readErrorResponse(response));
    const body = await response.json().catch(() => null);
    if (body?.data) insertOrUpdateConversationSummary(body.data);
    historyLoadError.value = "";
  } catch (error) {
    if (shouldUseLocalHistoryFallback(error)) {
      return;
    }
    throw error;
  }
};

const saveConversationHistorySafe = async () => {
  try {
    await saveConversationHistory();
  } catch (error) {
    showAlert(getFriendlyFetchError(error, "conversation history"), "error");
  }
};

// Send Message with Streaming Tokens Simulation
const sendMessage = async () => {
  const prompt = String(userInput.value || "")
    .trim()
    .slice(0, HISTORY_MAX_MESSAGE_CHARS);
  if (!prompt || sending.value || isStreaming.value) return;
  if (!hasUser.value) {
    showAlert("Please sign in or continue in Guest mode.", "error");
    return;
  }

  if (!activeConversationId.value)
    activeConversationId.value = generateConversationId();
  if (activeConversationId.value)
    await syncConversationRoute(activeConversationId.value, true);

  messages.value.push(createMessage("user", prompt));
  userInput.value = "";
  sending.value = true;
  await scrollToBottom();

  let assistantText = "";
  try {
    assistantText = String(await requestAssistantReply()).trim();
    if (!assistantText) {
      assistantText = generateSmartChatFallback(prompt);
    }
  } catch (error) {
    assistantText = generateSmartChatFallback(prompt);
  } finally {
    sending.value = false;
  }

  // Token Streaming into Assistant Message
  const assistantMsg = createMessage("assistant", "");
  messages.value.push(assistantMsg);

  isStreaming.value = true;
  cancelStreaming.value = false;

  const chunks = assistantText.match(/\S+\s*/g) || [assistantText];
  let accumulated = "";
  for (let i = 0; i < chunks.length; i++) {
    if (cancelStreaming.value) break;
    accumulated += chunks[i];
    assistantMsg.text = accumulated;
    if (i % 3 === 0) await scrollToBottom();
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  if (cancelStreaming.value) {
    assistantMsg.text = accumulated + "\n\n*(Generation stopped)*";
  } else {
    assistantMsg.text = assistantText;
  }

  isStreaming.value = false;
  cancelStreaming.value = false;

  await saveConversationHistorySafe();
  await scrollToBottom();
};

const stopGenerating = () => {
  cancelStreaming.value = true;
};

const deleteConversation = (conversationId) => {
  if (!hasUser.value || sending.value) return;
  const normalizedId = String(conversationId || "").trim();
  if (!normalizedId) return;

  deleteDialogMode.value = "single";
  deleteConversationId.value = normalizedId;
  deleteDialog.value = true;
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  deleteDialogMode.value = "single";
  deleteConversationId.value = "";
};

const finalizeDeleteAll = () => {
  conversations.value = [];
  writeLocalConversationStore({});
  resetToNewConversation();
  historyLoadError.value = "";
};

const confirmDelete = async () => {
  if (isDeleteAllMode.value) {
    if (isDeleting.value) return;
    isDeleting.value = true;
    try {
      if (currentUser.value) {
        const ids = conversations.value.map((item) => normalizeConversationId(item.id));
        for (const id of ids) {
          if (!id) continue;
          await authorizedFetchHistory(`/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
        }
      }
      finalizeDeleteAll();
    } catch {
      finalizeDeleteAll();
    } finally {
      isDeleting.value = false;
      closeDeleteDialog();
    }
    return;
  }

  const normalizedId = deleteConversationId.value;
  if (!normalizedId || isDeleting.value) return;

  isDeleting.value = true;
  try {
    if (currentUser.value) {
      await authorizedFetchHistory(`/${encodeURIComponent(normalizedId)}`, { method: "DELETE" }).catch(() => {});
    }

    conversations.value = conversations.value.filter(
      (item) => item.id !== normalizedId,
    );
    if (activeConversationId.value === normalizedId) {
      if (conversations.value.length > 0) {
        await openConversation(conversations.value[0].id, false);
      } else {
        resetToNewConversation();
      }
    }
    removeLocalConversation(normalizedId);
  } finally {
    isDeleting.value = false;
    closeDeleteDialog();
  }
};

const deleteActiveConversation = () => {
  if (!conversations.value.length) {
    showAlert("No chats available to delete.", "error");
    return;
  }
  deleteDialogMode.value = "all";
  deleteDialog.value = true;
};

const startNewChat = () => {
  if (!hasUser.value || sending.value || isStreaming.value) return;
  activeTool.value = "chat";
  resetToNewConversation();
  if (mobile.value) sidebarOpen.value = false;
};

const handlePromptKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const signInWithGoogle = async () => {
  if (!auth || !googleProvider || signingIn.value) {
    if (!hasRequiredFirebaseConfig) {
      showAlert(
        "Firebase config not detected in environment. Entering Guest Mode.",
        "success",
      );
      enterGuestMode();
    }
    return;
  }

  signingIn.value = true;
  try {
    if (!getRouteConversationId()) {
      await syncConversationRoute(generateConversationId(), true);
    }
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    showAlert(error?.message || "Google sign-in failed. You can also use Guest Mode.", "error");
  } finally {
    signingIn.value = false;
  }
};

const enterGuestMode = () => {
  isGuestMode.value = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }
  loadConversationList();
  if (!activeConversationId.value) {
    resetToNewConversation();
  }
  showAlert("Entered Guest Mode. All tools and chats are ready!", "success");
};

const signOutUser = async () => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  if (isGuestMode.value && !currentUser.value) {
    isGuestMode.value = false;
    activeConversationId.value = "";
    conversations.value = [];
    messages.value = [];
    return;
  }
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
    isGuestMode.value = false;
    await syncConversationRoute("", true);
  } catch (error) {
    showAlert(error?.message || "Sign out failed.", "error");
  }
};

// Handlers for Tool Interactions
const handleToolSendToChat = (promptText = "") => {
  activeTool.value = "chat";
  userInput.value = promptText;
  nextTick(() => {
    scrollToBottom();
  });
};

const handleQuickStarterClick = (starter) => {
  if (starter.tool === "chat") {
    activeTool.value = "chat";
    userInput.value = starter.prompt;
    nextTick(() => {
      scrollToBottom();
    });
  } else {
    activeTool.value = starter.tool;
  }
};

const setupAuth = () => {
  if (!auth || !hasRequiredFirebaseConfig) {
    authReady.value = true;
    currentUser.value = null;
    if (isGuestMode.value) {
      loadConversationList().then(() => {
        if (!activeConversationId.value) resetToNewConversation();
      });
    }
    return;
  }

  removeAuthListener = onAuthStateChanged(auth, async (user) => {
    authReady.value = false;
    currentUser.value = user;
    avatarImageFailed.value = false;
    conversations.value = [];
    messages.value = [];
    historyLoadError.value = "";
    runnerPanelOpen.value = false;

    if (!user) {
      if (!isGuestMode.value) {
        activeConversationId.value = "";
      } else {
        await loadConversationList();
        const requestedId = getRouteConversationId();
        if (requestedId && (conversations.value.some((c) => c.id === requestedId) || Boolean(readLocalConversation(requestedId)))) {
          await openConversation(requestedId, false);
        } else if (conversations.value.length > 0) {
          await openConversation(conversations.value[0].id, false);
        } else if (!activeConversationId.value) {
          resetToNewConversation();
        }
      }
      authReady.value = true;
      return;
    }

    try {
      await loadConversationList();
      const requestedConversationId = getRouteConversationId();
      const hasRequestedConversation =
        requestedConversationId &&
        (conversations.value.some(
          (item) => item.id === requestedConversationId,
        ) ||
          Boolean(readLocalConversation(requestedConversationId)));

      if (hasRequestedConversation) {
        await openConversation(requestedConversationId, false);
      } else if (conversations.value.length > 0) {
        await openConversation(conversations.value[0].id, false);
      } else {
        resetToNewConversation();
      }
    } catch {
      resetToNewConversation();
    } finally {
      authReady.value = true;
    }
  });
};

watch(
  messages,
  () => {
    void scrollToBottom();
  },
  { deep: true },
);

watch(selectedModel, (value) => {
  const normalized = normalizeSelectedProvider(value);
  if (normalized !== value) selectedModel.value = normalized;
});

watch(
  () => route.query?.[CONVERSATION_QUERY_KEY],
  async (value) => {
    if (syncingRouteConversationId.value) return;

    const nextConversationId = normalizeConversationId(value);
    if (!hasUser.value || !nextConversationId) return;
    if (nextConversationId === normalizeConversationId(activeConversationId.value))
      return;

    const inConversationList = conversations.value.some(
      (item) => item.id === nextConversationId,
    );
    const inLocalCache = Boolean(readLocalConversation(nextConversationId));
    if (!inConversationList && !inLocalCache) return;

    await openConversation(nextConversationId, false);
  },
);

watch(pageTheme, (value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, normalizeTheme(value));
});

onMounted(() => {
  if (typeof window !== "undefined") {
    const savedTheme = normalizeTheme(
      window.localStorage.getItem(THEME_STORAGE_KEY),
    );
    applyTheme(savedTheme);
  }
  setupAuth();
});

onUnmounted(() => {
  if (typeof removeAuthListener === "function") {
    removeAuthListener();
  }
});
</script>

<template>
  <v-theme-provider :theme="pageVuetifyTheme" with-background>
    <div class="mindlytic-page animate-fade-in-up" :class="{ 'theme-dark': isDarkTheme }">
      <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

      <!-- Export Chat Modal Dialog -->
      <ExportChatDialog
        v-model="exportDialogOpen"
        :is-dark-theme="isDarkTheme"
        :conversation-title="activeConversationTitle"
        :messages="messages"
        @show-alert="showAlert"
      />

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="deleteDialog" max-width="360">
        <v-card class="delete-dialog-card rounded-xl elevation-2 pa-5">
          <div class="delete-dialog-title text-subtitle-1 font-weight-medium mb-2">
            {{ deleteDialogTitle }}
          </div>
          <div class="delete-dialog-copy text-body-2 mb-6">
            {{ deleteDialogCopy }}
          </div>
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" class="delete-dialog-cancel" @click="closeDeleteDialog">
              Cancel
            </v-btn>
            <v-btn color="red" variant="flat" class="px-4" :loading="isDeleting" @click="confirmDelete">
              Delete
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- User Profile Dialog -->
      <v-dialog v-model="profiledialog" transition="dialog-bottom-transition" max-width="440" :theme="pageVuetifyTheme">
        <v-card class="profile-dialog-card rounded-xl overflow-hidden" :class="{ 'theme-dark': isDarkTheme }" elevation="10">
          <div class="profile-header-bg">
            <v-btn icon="mdi-close" variant="text" class="profile-dialog-close-btn" size="small" aria-label="Close Profile" @click="profiledialog = false" />
          </div>

          <div class="profile-avatar-container">
            <v-avatar size="110" class="profile-avatar elevation-4" color="surface">
              <img v-if="userAvatarSrc" :src="userAvatarSrc" alt="Profile" class="profile-image" referrerpolicy="no-referrer" @error="avatarImageFailed = true" />
              <div v-else class="profile-avatar-initial">{{ userInitial }}</div>
            </v-avatar>
          </div>

          <v-card-text class="profile-details-content text-center pt-2 pb-2">
            <h2 class="profile-name text-h5 font-weight-bold mb-1">{{ currentUser?.displayName || (isGuestMode ? "Guest Explorer" : "User") }}</h2>
            <p class="profile-email text-body-2 mb-5">{{ currentUser?.email || (isGuestMode ? "Operating in local guest session" : "") }}</p>

            <div class="profile-stats-grid mb-2">
              <div class="profile-stat-box">
                <v-icon icon="mdi-shield-check-outline" color="success" size="28" class="mb-2" />
                <div class="stat-label">Status</div>
                <div class="stat-value text-success font-weight-bold">{{ currentUser ? "Verified" : "Guest Mode" }}</div>
              </div>
              <div class="profile-stat-box">
                <v-icon icon="mdi-brain" color="primary" size="28" class="mb-2" />
                <div class="stat-label">AI Suite</div>
                <div class="stat-value font-weight-bold">5 Tools Active</div>
              </div>
            </div>
          </v-card-text>

          <v-divider class="mx-6 opacity-20 my-2" />

          <v-card-actions class="profile-actions px-6 py-4">
            <v-btn variant="tonal" color="error" prepend-icon="mdi-logout" class="profile-btn-logout rounded-lg text-none px-5 font-weight-medium" @click="signOutUser(); profiledialog = false">
              {{ currentUser ? "Logout" : "Exit Guest Mode" }}
            </v-btn>
            <v-spacer />
            <v-btn variant="flat" color="primary" class="profile-btn-done rounded-lg text-none px-7 font-weight-medium" @click="profiledialog = false">
              Done
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-layout class="mindlytic-layout">
        <!-- Main Sidebar -->
        <v-navigation-drawer
          v-if="hasUser"
          v-model="sidebarOpen"
          class="chat-sidebar"
          :permanent="!mobile"
          :temporary="mobile"
          :scrim="mobile"
          location="left"
          border="0"
          width="270"
        >
          <v-list class="pa-3">
            <!-- New Chat CTA -->
            <v-list-item class="pa-0 mb-3">
              <v-btn
                class="new-chat-btn w-100"
                color="primary"
                variant="outlined"
                rounded="xl"
                size="large"
                prepend-icon="mdi-plus"
                :disabled="!hasUser || sending || isStreaming"
                @click="startNewChat"
              >
                New chat
              </v-btn>
            </v-list-item>

            <!-- AI Tools Suite Selector in Sidebar -->
            <div class="sidebar-tools-group mb-4">
              <p class="history-title px-1 py-1 mb-1">AI Tools Suite</p>
              <div class="d-flex flex-column ga-1">
                <button
                  v-for="tool in AI_TOOLS_LIST"
                  :key="tool.id"
                  class="sidebar-tool-btn"
                  :class="{ active: activeTool === tool.id }"
                  @click="activeTool = tool.id; if (mobile) sidebarOpen = false;"
                >
                  <v-icon :icon="tool.icon" size="18" class="mr-2" />
                  <span class="tool-label flex-grow-1 text-start">{{ tool.label }}</span>
                  <v-icon v-if="activeTool === tool.id" icon="mdi-chevron-right" size="16" />
                </button>
              </div>
            </div>

            <v-divider class="my-2 opacity-15" />

            <!-- Recent Chats List -->
            <div class="history-wrap">
              <div class="d-flex align-center justify-between px-1 py-1">
                <p class="history-title m-0">Recent Chats</p>
                <v-btn
                  v-if="conversations.length > 0"
                  icon="mdi-download-outline"
                  size="x-small"
                  variant="text"
                  aria-label="Export Chat"
                  title="Export Current Chat"
                  @click="exportDialogOpen = true"
                />
              </div>

              <div v-if="loadingHistory" class="history-empty text-center py-4">
                <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-2" />
                <span class="text-caption">Loading history...</span>
              </div>
              <div v-else-if="conversations.length === 0" class="history-empty px-1 py-2">
                No saved chats yet.
              </div>
              <p v-if="historyLoadError" class="history-error px-1">
                {{ historyLoadError }}
              </p>

              <div v-if="conversations.length > 0" class="history-list">
                <div
                  v-for="item in conversations"
                  :key="item.id"
                  class="history-item-container"
                  :class="{
                    'history-item-active': item.id === activeConversationId && activeTool === 'chat',
                  }"
                >
                  <button
                    v-if="editingConversationId !== item.id"
                    class="history-item"
                    :disabled="loadingConversation || sending"
                    @click="activeTool = 'chat'; openConversation(item.id);"
                  >
                    <div class="history-content">
                      <p class="history-item-title">{{ item.title }}</p>
                    </div>

                    <v-menu
                      location="bottom end"
                      offset="5"
                      :content-class="isDarkTheme ? 'history-action-menu history-action-menu-dark' : 'history-action-menu'"
                    >
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-dots-vertical"
                          size="x-small"
                          variant="text"
                          class="history-menu-btn"
                          aria-label="Conversation options"
                          @click.stop
                        />
                      </template>
                      <v-list density="compact" rounded="lg" slim>
                        <v-list-item prepend-icon="mdi-pencil-outline" @click="startRenaming(item)">
                          <v-list-item-title>Rename</v-list-item-title>
                        </v-list-item>
                        <v-list-item prepend-icon="mdi-download-outline" @click="exportDialogOpen = true">
                          <v-list-item-title>Export</v-list-item-title>
                        </v-list-item>
                        <v-list-item prepend-icon="mdi-delete-outline" color="error" @click="deleteConversation(item.id)">
                          <v-list-item-title>Delete</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </button>

                  <div v-else class="history-item history-item-editing">
                    <v-text-field
                      v-model="editingTitle"
                      class="history-rename-input"
                      density="compact"
                      variant="outlined"
                      hide-details
                      @keydown.enter="renameConversation(item)"
                      @keydown.esc="cancelRenaming"
                      @blur="renameConversation(item)"
                      autofocus
                    />
                  </div>
                </div>
              </div>
            </div>
          </v-list>

          <!-- User Profile Bottom Bar in Sidebar -->
          <template v-slot:append>
            <div class="pa-3">
              <div class="user-profile pa-2 rounded-lg border">
                <v-avatar size="36" color="primary" variant="tonal">
                  <img v-if="userAvatarSrc" :src="userAvatarSrc" alt="Profile" class="profile-image" referrerpolicy="no-referrer" @error="avatarImageFailed = true" />
                  <span v-else class="avatar-initial">{{ userInitial }}</span>
                </v-avatar>
                <div class="user-copy">
                  <p class="user-name text-truncate">
                    {{ currentUser?.displayName || (isGuestMode ? "Guest Mode" : "User") }}
                  </p>
                  <p class="user-email text-truncate">
                    {{ currentUser?.email || "Local storage enabled" }}
                  </p>
                </div>
                <v-menu location="top end" offset="13">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      class="profile-menu-trigger"
                      icon="mdi-dots-horizontal"
                      rounded="lg"
                      density="comfortable"
                      variant="text"
                      aria-label="Account Settings"
                    />
                  </template>
                  <v-list density="compact" class="border p-1" rounded="lg" slim :class="isDarkTheme ? 'profile-menu-list-dark' : 'profile-menu-list'">
                    <v-list-item prepend-icon="mdi-account-circle" @click="profiledialog = true">
                      <v-list-item-title>Profile Status</v-list-item-title>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-download-outline" :disabled="!messages.length" @click="exportDialogOpen = true">
                      <v-list-item-title>Export Chat</v-list-item-title>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-content-copy" @click="copyCurrentConversationLink">
                      <v-list-item-title>Copy chat link</v-list-item-title>
                    </v-list-item>
                    <v-list-item :prepend-icon="themeToggleIcon" @click="toggleTheme">
                      <v-list-item-title>{{ themeToggleLabel }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-delete-outline" color="error" :disabled="!conversations.length" @click="deleteActiveConversation">
                      <v-list-item-title>Delete all chats</v-list-item-title>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-logout" color="error" @click="signOutUser">
                      <v-list-item-title>{{ currentUser ? "Logout" : "Exit Guest Mode" }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </template>
        </v-navigation-drawer>

        <!-- Top App Bar -->
        <v-app-bar v-if="hasUser" density="compact" flat border="b">
          <v-app-bar-nav-icon v-if="mobile" aria-label="Toggle Sidebar Navigation" @click="sidebarOpen = !sidebarOpen" />

          <v-app-bar-title class="text-subtitle-1 font-weight-medium">
            <div class="d-flex align-center">
              <img src="/media/Picture/mindlytic.svg" alt="Mindlytic" style="width: 24px; height: 24px;" class="mr-2" />
              <span class="font-weight-bold mr-2 text-truncate">Mindlytic</span>
            </div>
          </v-app-bar-title>

          <!-- Top Navigation Pills for AI Tools Suite (Responsive) -->
          <v-spacer />

          <!-- App Bar Action Buttons -->
          <template v-slot:append>
            <v-btn
              v-if="activeTool === 'chat' && messages.length > 0"
              icon="mdi-download-outline"
              variant="text"
              size="small"
              aria-label="Export Chat"
              title="Export Chat"
              @click="exportDialogOpen = true"
            />
            <v-btn
              :icon="themeToggleIcon"
              variant="text"
              size="small"
              aria-label="Toggle Dark / Light Theme"
              title="Toggle Theme"
              @click="toggleTheme"
            />
            <v-btn
              v-if="mobile && activeTool === 'chat'"
              icon="mdi-plus"
              variant="text"
              size="large"
              aria-label="Start New Chat"
              :disabled="sending || isStreaming"
              @click="startNewChat"
            />
          </template>
        </v-app-bar>

        <!-- Main Workspace Body -->
        <v-main class="chat-main">
          <v-progress-linear v-if="!authReady" class="session-top-loader" indeterminate color="primary" height="3" />

          <div v-if="!authReady" class="session-loader-spacer"></div>

          <!-- Auth Fallback Screen with Guest Mode Button -->
          <div v-else-if="!hasUser" class="state-card-auth">
            <div class="auth-content">
              <div class="auth-header">
                <img src="/media/Picture/mindlytic.svg" alt="Mindlytic" class="auth-logo" />
                <h1 class="auth-title">Mindlytic AI Suite</h1>
                <p class="text-caption text-grey m-0">Enterprise AI Chat, Text Summarizer, and Prompt Architect</p>
              </div>

              <v-btn class="google-auth-btn" :loading="signingIn" :disabled="signingIn" @click="signInWithGoogle">
                <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span class="google-btn-text">Sign in with Google</span>
              </v-btn>

              <div class="d-flex align-center my-2">
                <v-divider class="flex-grow-1" />
                <span class="px-2 text-caption text-grey">OR</span>
                <v-divider class="flex-grow-1" />
              </div>

              <!-- Instant Guest Mode Activation Button -->
              <v-btn
                variant="outlined"
                color="primary"
                prepend-icon="mdi-lightning-bolt-outline"
                class="rounded-lg text-none font-weight-bold py-2"
                @click="enterGuestMode"
              >
                Continue in Guest Mode (Offline Ready)
              </v-btn>

              <p class="auth-secure-text">All AI tools, chat runner, and local persistence fully available.</p>
            </div>
          </div>

          <!-- Authenticated or Guest Workspace -->
          <template v-else>
            <!-- 1. AI CHAT TAB -->
            <template v-if="activeTool === 'chat'">
              <div class="workspace-shell" :class="{ 'workspace-shell-with-runner': runnerPanelOpen }">
                <div class="chat-workspace" :class="{ 'chat-workspace-empty': isEmptyConversation }">
                  <div
                    ref="chatScrollRef"
                    class="chat-scroll"
                    :class="{ 'chat-scroll-empty': isEmptyConversation }"
                    @scroll="handleChatScroll"
                  >
                    <!-- Empty State with Quick Starters -->
                    <div v-if="isEmptyConversation" class="empty-state">
                      <v-container fluid class="fill-height d-flex align-center justify-center">
                        <div class="text-center max-width">
                          <!-- Headline -->
                          <h1 class="headline-text mb-2">
                            Your ideas, powered by AI.
                          </h1>

                          <!-- Subtext -->
                          <p class="sub-text mb-6">
                            Chat, summarize, and architect solutions faster than ever.
                          </p>
                        </div>
                      </v-container>
                    </div>

                    <!-- Message Thread -->
                    <div v-else class="message-thread">
                      <div
                        v-for="(message, index) in messages"
                        :key="`${message.createdAt}-${index}`"
                        class="message-row"
                        :class="message.role === 'assistant' ? 'message-row-ai' : 'message-row-user'"
                      >
                        <div class="message-bubble" :class="message.error ? 'message-bubble-error' : ''">
                          <div
                            v-if="message.role === 'assistant'"
                            class="markdown-body"
                            v-html="renderAssistantMessage(message.text)"
                            @click="handleAssistantMessageClick($event, message, index)"
                          ></div>
                          <p v-else class="message-text">{{ message.text }}</p>
                          <p class="message-time">
                            {{ formatMessageTime(message.createdAt) }}
                          </p>

                          <div v-if="message.role === 'assistant' && message.text" class="message-actions">
                            <v-chip
                              size="small"
                              prepend-icon="mdi-content-copy"
                              variant="outlined"
                              color="primary"
                              @click="copyText(message.text, 'Reply copied.')"
                            >
                              Copy
                            </v-chip>
                          </div>
                        </div>
                      </div>

                      <!-- Thinking Indicator while waiting for initial tokens -->
                      <div v-if="sending" class="message-row message-row-ai">
                        <div class="message-bubble message-bubble-thinking">
                          <div class="thinking-dots">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Scroll to Bottom Button -->
                  <v-fade-transition>
                    <v-btn
                      v-if="showScrollButton"
                      icon="mdi-arrow-down"
                      variant="outlined"
                      class="scroll-bottom-btn border"
                      color="primary"
                      density="comfortable"
                      aria-label="Scroll to newest messages"
                      @click="scrollToBottom"
                    />
                  </v-fade-transition>

                  <!-- Composer Shell -->
                  <div class="composer-shell" :class="{ 'composer-shell-floating': isEmptyConversation }">
                    <!-- Floating Stop Streaming Pill -->
                    <div v-if="isStreaming" class="d-flex justify-center mb-2">
                      <v-btn
                        size="small"
                        variant="flat"
                        color="error"
                        prepend-icon="mdi-stop"
                        class="rounded-pill text-none px-4 shadow"
                        @click="stopGenerating"
                      >
                        Stop generating
                      </v-btn>
                    </div>

                    <div class="composer-panel">
                      <v-textarea
                        ref="composerTextareaRef"
                        v-model="userInput"
                        class="composer-input"
                        placeholder="Message Mindlytic AI... (Shift+Enter for newline)"
                        hide-details
                        rows="1"
                        auto-grow
                        max-rows="4"
                        density="compact"
                        variant="outlined"
                        :disabled="sending || isStreaming || loadingConversation"
                        @keydown="handlePromptKeydown"
                      />
                      <div class="composer-bottom-tools">
                        <div class="d-flex align-center ga-2">
                          <v-select
                            :key="`model-select-${pageTheme}`"
                            v-model="selectedModel"
                            :items="modelOptions"
                            item-title="label"
                            item-value="value"
                            :return-object="false"
                            density="compact"
                            hide-details
                            variant="outlined"
                            :menu-props="composerMenuProps"
                            class="composer-model-select"
                            :disabled="sending || isStreaming || loadingConversation"
                            aria-label="Select AI Engine Model"
                          />
                        </div>

                        <!-- Send or Stop Button -->
                        <v-btn
                          v-if="isStreaming"
                          icon="mdi-stop"
                          density="comfortable"
                          color="error"
                          class="composer-send"
                          aria-label="Stop generation"
                          @click="stopGenerating"
                        />
                        <v-btn
                          v-else
                          icon="mdi-arrow-up"
                          density="comfortable"
                          color="primary"
                          class="composer-send"
                          :disabled="!canSend"
                          :loading="sending"
                          aria-label="Send Message"
                          @click="sendMessage"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Code Runner Side Drawer -->
                <aside v-if="runnerPanelOpen" class="ai-runner-panel">
                  <div class="ai-runner-head">
                    <div class="ai-runner-head-main">
                      <p class="ai-runner-title">{{ runnerTitle }}</p>
                    </div>
                    <div class="ai-runner-head-actions">
                      <v-btn
                        size="small"
                        variant="text"
                        color="primary"
                        icon="mdi-close"
                        class="runner-close-btn"
                        aria-label="Close runner preview"
                        @click="closeRunnerPanel"
                      />
                    </div>
                  </div>
                  <iframe
                    :key="runnerFrameKey"
                    :srcdoc="runnerSrcdoc"
                    class="ai-runner-frame"
                    sandbox="allow-scripts allow-modals"
                    referrerpolicy="no-referrer"
                    title="Code runner preview"
                  ></iframe>
                </aside>
              </div>
            </template>

            <!-- 2. TEXT SUMMARIZER & REWRITER TAB -->
            <template v-else-if="activeTool === 'summarizer'">
              <div class="tool-outer-container">
                <TextSummarizerTool
                  :is-dark-theme="isDarkTheme"
                  :request-ai-reply="requestAiReply"
                  @send-to-chat="handleToolSendToChat"
                  @show-alert="showAlert"
                />
              </div>
            </template>

            <!-- 3. PROMPT ENHANCER TAB -->
            <template v-else-if="activeTool === 'prompter'">
              <div class="tool-outer-container">
                <PromptEnhancerTool
                  :is-dark-theme="isDarkTheme"
                  :request-ai-reply="requestAiReply"
                  @send-to-chat="handleToolSendToChat"
                  @show-alert="showAlert"
                />
              </div>
            </template>
          </template>
        </v-main>
      </v-layout>
    </div>
  </v-theme-provider>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ChatGPT Aesthetic Base */
.mindlytic-page {
  min-height: 100dvh;
  height: 100dvh;
  width: 100%;
  max-width: 100%;
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  transition: background-color 0.2s ease, color 0.2s ease;
  position: relative;
}

.mindlytic-layout {
  height: 100%;
  background-color: transparent !important;
}

/* Sidebar */
.chat-sidebar {
  background-color: rgb(var(--v-theme-surface)) !important;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  display: flex;
  flex-direction: column;
}

.mindlytic-page.theme-dark .chat-sidebar {
  background-color: #171717 !important;
}

/* App Bar Navigation Pills */
.appbar-tools-pills {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 9999px;
  padding: 3px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.appbar-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.76rem;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 9999px;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.appbar-pill:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.appbar-pill.active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
}

/* Sidebar Tools Group */
.sidebar-tools-group {
  display: flex;
  flex-direction: column;
}

.sidebar-tool-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.84rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.sidebar-tool-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.sidebar-tool-btn.active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

/* Tool Outer Scroll Container */
.tool-outer-container {
  flex: 1;
  overflow-y: auto;
  height: 100%;
  padding-bottom: 32px;
}

/* History List */
.history-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.history-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.history-empty {
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: 0.82rem;
}

.history-error {
  margin: 6px 0 10px;
  color: rgb(var(--v-theme-warning));
  font-size: 0.76rem;
  line-height: 1.35;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

.history-item-container {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.history-item {
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  text-align: start;
  padding: 8px 12px;
  background-color: transparent !important;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  width: 100%;
}

.history-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
}

.history-item-container.history-item-active {
  background-color: rgba(var(--v-theme-on-surface), 0.1) !important;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-item-title {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-menu-btn {
  opacity: 0;
  transition: opacity 0.2s;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.history-item:hover .history-menu-btn,
.history-item:focus-within .history-menu-btn,
.history-menu-btn:focus,
.history-menu-btn:focus-visible {
  opacity: 1 !important;
}

.appbar-pill:focus-visible,
.sidebar-tool-btn:focus-visible,
.history-item:focus-visible,
.history-menu-btn:focus-visible,
.quick-starter-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary)) !important;
  outline-offset: 2px !important;
}

.history-item-editing {
  padding: 4px 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
}

.history-rename-input :deep(.v-field__input) {
  min-height: 0 !important;
  font-size: 0.875rem !important;
}

.history-action-menu {
  background-color: rgb(var(--v-theme-surface)) !important;
}

.mindlytic-page.theme-dark .history-action-menu {
  background-color: #2a2b32 !important;
  color: #ececec !important;
}

/* User Profile */
.profile-menu-list {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.profile-menu-list-dark {
  background-color: #2a2b32 !important;
  color: #ececec !important;
}

.profile-menu-list :deep(.v-list-item),
.profile-menu-list-dark :deep(.v-list-item) {
  min-height: 38px;
}

.user-profile {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  background-color: rgba(var(--v-theme-on-surface), 0.03);
  transition: all 0.2s ease;
}

.user-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name {
  font-size: 0.84rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.25;
}

.user-email {
  margin: 2px 0 0;
  font-size: 0.69rem;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.profile-menu-trigger {
  align-self: center;
  flex-shrink: 0;
  width: 32px !important;
  height: 32px !important;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

/* Empty State & Quick Starters */
.max-width {
  max-width: 720px;
  width: 100%;
}

.headline-text {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.sub-text {
  font-size: 15px;
  color: #64748b;
}

.mindlytic-page.theme-dark .headline-text {
  color: #ececec;
}

.mindlytic-page.theme-dark .sub-text {
  color: #9aa0a6;
}

.quick-starters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  width: 100%;
  text-align: left;
}

.quick-starter-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.quick-starter-card:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
  border-color: rgba(var(--v-theme-primary), 0.4);
  transform: translateY(-2px);
}

.starter-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.starter-desc {
  margin: 0;
  font-size: 0.76rem;
  color: rgba(var(--v-theme-on-surface), 0.65);
  line-height: 1.35;
}

.chat-main {
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: transparent !important;
  height: 100%;
}

.workspace-shell {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.chat-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 32px 24px;
}

.chat-scroll-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 24px 16px;
  text-align: center;
}

/* Authentication State */
.state-card-auth {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 24px;
}

.auth-content {
  background: transparent;
  padding: 36px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(100%, 440px);
  min-width: 0;
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.auth-logo {
  width: 48px;
  height: 48px;
  border-radius: 10px;
}

.auth-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.mindlytic-page.theme-dark .auth-title {
  color: #ececec !important;
}

.auth-secure-text {
  font-size: 0.74rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 8px 0 0;
  text-align: center;
}

.google-auth-btn {
  width: 100%;
  height: 48px !important;
  border-radius: 8px !important;
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  text-transform: none !important;
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
  margin: 8px auto 0;
}

.google-auth-btn :deep(.v-btn__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 14px !important;
  width: 100%;
}

.google-icon {
  width: 20px;
  height: 20px;
}

.google-btn-text {
  font-weight: 600;
}

.mindlytic-page.theme-dark .google-auth-btn {
  background-color: #262626 !important;
  color: #e8eaed !important;
  border: 1px solid #3c4043 !important;
}

/* Message Bubbles */
.message-thread {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 768px;
  margin: 0 auto;
  padding-bottom: 24px;
}

.message-row {
  display: flex;
  width: 100%;
  background-color: transparent !important;
}

.message-row-user {
  justify-content: flex-end;
}

.message-row-ai {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 100%;
  padding: 12px 20px;
  font-size: 1rem;
  line-height: 1.6;
}

.message-row-user .message-bubble {
  background-color: rgba(124, 14, 68, 0.15) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgba(124, 14, 68, 0.22) !important;
  border-radius: 20px;
  max-width: 82%;
}

.mindlytic-page.theme-dark .message-row-user .message-bubble {
  background-color: #2f2f2f !important;
  color: #ececec !important;
}

.message-row-ai .message-bubble {
  background-color: transparent !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
  width: 100%;
  max-width: 100%;
}

.mindlytic-page.theme-dark .message-row-ai .message-bubble {
  color: #ececec !important;
}

.message-bubble-error {
  background-color: rgba(248, 81, 73, 0.15) !important;
  color: #ff7b72 !important;
  border: 1px solid rgba(248, 81, 73, 0.25) !important;
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
}

.message-time {
  display: none;
}

.message-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  margin-top: 6px;
}

/* Thinking Indicator */
.message-bubble-thinking {
  padding: 12px 0;
  background-color: transparent !important;
  display: flex;
  align-items: center;
}

.thinking-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.thinking-dots .dot {
  width: 8px;
  height: 8px;
  background-color: #000;
  border-radius: 50%;
  animation: pulseWait 1.4s infinite ease-in-out both;
}

.mindlytic-page.theme-dark .thinking-dots .dot {
  background-color: #fff;
}

.thinking-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes pulseWait {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Composer / Input Area */
.composer-shell {
  padding: 0 24px calc(24px + env(safe-area-inset-bottom));
  background-color: transparent;
  position: relative;
  z-index: 20;
}

.composer-shell-floating {
  padding-top: 8px;
}

.scroll-bottom-btn {
  position: absolute !important;
  bottom: calc(33px + 90px) !important;
  right: 20px !important;
  z-index: 30 !important;
}

@media (max-width: 768px) {
  .scroll-bottom-btn {
    bottom: calc(12px + 100px);
    right: 12px;
  }
}

.composer-panel {
  max-width: 768px;
  margin: 0 auto;
  background-color: rgba(var(--v-theme-surface), 0.9) !important;
  border: 1px solid rgba(124, 14, 68, 0.2) !important;
  backdrop-filter: blur(12px);
  border-radius: 16px !important;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
}

.composer-panel:focus-within {
  border-color: rgba(124, 14, 68, 0.5) !important;
}

.mindlytic-page.theme-dark .composer-panel {
  background-color: #252525 !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.composer-input {
  width: 100%;
}

.composer-input :deep(.v-field) {
  background: transparent !important;
}

.composer-input :deep(.v-field__outline),
.composer-input :deep(.v-field__overlay) {
  display: none !important;
}

.composer-input :deep(textarea) {
  color: rgb(var(--v-theme-on-surface)) !important;
  padding: 4px 0 !important;
}

.mindlytic-page.theme-dark .composer-input :deep(textarea) {
  color: #ececec !important;
}

.composer-bottom-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.composer-model-select {
  width: auto;
  flex: none;
}

.composer-model-select :deep(.v-field) {
  border-radius: 8px !important;
  background-color: transparent !important;
}

.composer-model-select :deep(.v-field__input) {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.composer-send {
  flex-shrink: 0;
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

/* Markdown Customizations */
.markdown-body {
  width: 100%;
  font-size: 1rem;
  line-height: 1.65;
  color: rgb(var(--v-theme-on-surface)) !important;
  background-color: transparent !important;
  overflow-wrap: anywhere;
}

.mindlytic-page.theme-dark .markdown-body {
  color: #ececec !important;
}

.markdown-body :deep(p) {
  margin: 0 0 14px;
}

.markdown-body :deep(pre) {
  background-color: rgba(0, 0, 0, 0.04) !important;
  color: inherit !important;
  padding: 14px 16px !important;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
  box-shadow: inset 0 0 0 1px rgba(124, 14, 68, 0.16);
}

.mindlytic-page.theme-dark .markdown-body :deep(pre) {
  background-color: #020817 !important;
  color: #ececec !important;
}

.markdown-body :deep(:not(pre) > code) {
  background-color: rgba(var(--v-theme-on-surface), 0.08) !important;
  color: rgb(var(--v-theme-primary)) !important;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.88em;
  font-weight: 500;
  font-family: "JetBrains Mono", Consolas, monospace;
}

.markdown-body :deep(pre code.code-block-text) {
  display: block;
  min-width: max-content;
  background-color: transparent !important;
  padding: 0 !important;
  font-size: 0.88rem;
  line-height: 1.7;
  white-space: pre;
  font-family: "JetBrains Mono", Consolas, monospace !important;
}

/* Inline Code Runner Block */
.markdown-body :deep(.inline-code-runner) {
  width: 100%;
  border: 1px solid rgba(124, 14, 68, 0.22);
  border-radius: 12px;
  overflow: hidden;
  margin: 16px 0;
  background-color: rgb(var(--v-theme-surface)) !important;
}

.mindlytic-page.theme-dark .markdown-body :deep(.inline-code-runner) {
  border-color: rgba(148, 163, 184, 0.22);
  background-color: #111827 !important;
}

.markdown-body :deep(.inline-code-runner-head) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(124, 14, 68, 0.16);
}

.markdown-body :deep(.inline-code-actions) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.markdown-body :deep(.inline-code-lang) {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  font-family: "JetBrains Mono", Consolas, monospace;
}

.markdown-body :deep(.code-runner-inline-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  background-color: transparent !important;
  border: 1px solid rgba(124, 14, 68, 0.22) !important;
  border-radius: 6px;
  color: rgb(var(--v-theme-on-surface)) !important;
  cursor: pointer;
}

.markdown-body :deep(.code-runner-inline-btn:hover) {
  background-color: rgba(124, 14, 68, 0.08) !important;
}

/* Runner Panel */
.ai-runner-panel {
  flex: 0 0 clamp(320px, 36vw, 600px);
  min-width: 320px;
  background-color: rgb(var(--v-theme-surface)) !important;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 25;
}

.mindlytic-page.theme-dark .ai-runner-panel {
  background-color: #212121 !important;
}

.ai-runner-head {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-runner-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
}

.ai-runner-frame {
  flex: 1;
  width: 100%;
  border: none;
  background-color: white !important;
}

/* Profile Dialog */
.profile-dialog-card {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.profile-header-bg {
  height: 110px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.8), rgba(var(--v-theme-secondary), 0.6));
  display: flex;
  justify-content: flex-end;
  padding: 12px;
}

.profile-dialog-close-btn {
  color: #fff !important;
  background: rgba(0, 0, 0, 0.2);
}

.profile-avatar-container {
  display: flex;
  justify-content: center;
  margin-top: -50px;
  position: relative;
  z-index: 2;
}

.profile-avatar {
  border: 4px solid rgb(var(--v-theme-surface));
}

.profile-avatar-initial {
  font-size: 2.4rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.profile-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 8px;
}

.profile-stat-box {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.stat-value {
  font-size: 0.9rem;
}

.delete-dialog-card {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

/* Responsive Overrides */
@media (max-width: 1024px) {
  .ai-runner-panel {
    position: absolute;
    inset: 0;
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .chat-sidebar {
    max-width: min(86vw, 320px);
  }

  .chat-scroll {
    padding: 20px 12px;
  }

  .composer-shell {
    padding: 0 12px calc(12px + env(safe-area-inset-bottom));
  }

  .composer-panel {
    border-radius: 20px;
    padding: 8px;
  }
}
</style>

<style>
/* Global Menu Overrides */
.v-overlay__content.composer-model-menu,
.v-overlay__content.history-action-menu {
  border-radius: 8px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  background-color: #fff !important;
}

.v-overlay__content.composer-model-menu-dark,
.v-overlay__content.history-action-menu-dark {
  background-color: #2f2f2f !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ececec !important;
}

.v-overlay__content.composer-model-menu .v-list,
.v-overlay__content.history-action-menu .v-list {
  background-color: transparent !important;
  padding: 4px !important;
}
</style>
