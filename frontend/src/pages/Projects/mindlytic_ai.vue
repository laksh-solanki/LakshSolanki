<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { marked } from "marked";
import Prism from "@/utils/prism-languages";
import "prismjs/themes/prism.css";
import DOMPurify from "dompurify";
import Alerts from "@/components/Alerts.vue";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import { auth, googleProvider, hasRequiredFirebaseConfig } from "@/firebase";

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

const API_BASE_CANDIDATES = collectUnique([
  getApiBaseUrl(),
  import.meta.env.VITE_API_URL_1,
  import.meta.env.VITE_API_URL_2,
  import.meta.env.VITE_API_URL,
]);
const CHAT_API_URLS = collectUnique(
  API_BASE_CANDIDATES.map((base) => toApiUrl(base, "/api/ai/chat")),
);
const getHistoryUrls = (path = "") =>
  collectUnique(
    API_BASE_CANDIDATES.map((base) => toApiUrl(base, `/api/ai/history${path}`)),
  );

const historyLimit = 30;
const RETRYABLE_STATUSES = new Set([404, 502, 503, 504]);

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
  import.meta.env.VITE_OPENAI_CHAT_MODEL || "microsoft/phi-3.5-mini-instruct"
).trim();

const ASSISTANT_SYSTEM_PROMPT =
  "You are Mindlytic AI, an all-in-one assistant. Give practical, structured, and concise answers first.";
const REQUEST_MAX_OUTPUT_TOKENS = 2000;
const REQUEST_TEMPERATURE = 1;

const authReady = ref(false);
const signingIn = ref(false);
const loadingHistory = ref(false);
const loadingConversation = ref(false);
const sending = ref(false);
const sidebarOpen = ref(false);
const selectedModel = ref("gemini");
const avatarImageFailed = ref(false);
const historyLoadError = ref("");
const THEME_STORAGE_KEY = "mindlytic-ai-theme";
const pageTheme = ref("light");

const currentUser = ref(null);
const conversations = ref([]);
const activeConversationId = ref("");
const messages = ref([]);
const userInput = ref("");
const chatScrollRef = ref(null);

const runnerPanelOpen = ref(false);
const runnerMode = ref("web");
const runnerLanguage = ref("plaintext");
const runnerTitle = ref("Code Runner");
const runnerCode = ref("");
const runnerSrcdoc = ref("");
const runnerFrameKey = ref(0);

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const deleteDialog = ref(false);
const isDeleting = ref(false);
const deleteConversationId = ref("");

let removeAuthListener = null;

const nowIso = () => new Date().toISOString();
const generateConversationId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  return `conversation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isLikelyNetworkError = (error) =>
  /failed to fetch|networkerror|load failed|network request failed|econnrefused|enotfound/i.test(
    String(error?.message || ""),
  );

const getFriendlyFetchError = (error, label) => {
  if (isLikelyNetworkError(error)) {
    return `Failed to fetch ${label}. Check backend status and VITE_API_URL values.`;
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
  title: String(item.title || "New chat").trim() || "New chat",
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

const PRISM_LANGUAGE_ALIASES = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  ps1: "powershell",
  psql: "sql",
  yml: "yaml",
  md: "markdown",
  html: "markup",
  xml: "markup",
  svg: "markup",
  vue: "markup",
  csharp: "csharp",
  cs: "csharp",
  cplusplus: "cpp",
  plaintext: "text",
  text: "text",
};

const resolvePrismLanguage = (language = "") => {
  const normalized = String(language || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "text";
  const alias = PRISM_LANGUAGE_ALIASES[normalized] || normalized;
  return Prism.languages[alias] ? alias : "text";
};

const highlightCodeForDisplay = (code = "", _language = "") =>
  escapeHtml(String(code || ""));

const renderAssistantMessage = (text = "") => {
  const raw = String(text || "");
  if (!raw.trim()) return "";
  try {
    const parsed = marked.parse(raw);
    const html = typeof parsed === "string" ? parsed : raw;
    const codeBlocks = extractCodeBlocks(raw);
    const renderedCodeBlocks = [];
    let codeIndex = 0;
    const withInlineRunnerPlaceholders = html.replace(
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
        const shouldUseInferredLanguage = [
          "code",
          "text",
          "plaintext",
        ].includes(rawBlockLanguage);
        const prismLanguage = resolvePrismLanguage(
          shouldUseInferredLanguage ? blockLanguage : rawBlockLanguage,
        );
        const highlightedCode = highlightCodeForDisplay(
          rawBlockCode,
          prismLanguage,
        );
        const codeHtml = `<pre><code class="code-block-text">${highlightedCode}</code></pre>`;
        const runButtonHtml = canRunInRunner(blockLanguage)
          ? `<button type="button" class="code-runner-inline-btn" data-code-index="${currentCodeIndex}" data-code-language="${escapeHtml(blockLanguage)}" data-code-action="run" aria-label="Run code">Run</button>`
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
        const renderedBlockHtml = `<div class="inline-code-runner">${headerHtml}${codeHtml}</div>`;
        const placeholder = `__MINDLYTIC_CODE_BLOCK_${currentCodeIndex}__`;
        renderedCodeBlocks.push({
          placeholder,
          html: renderedBlockHtml,
        });
        codeIndex += 1;
        return placeholder;
      },
    );

    const sanitized = DOMPurify.sanitize(withInlineRunnerPlaceholders, {
      ADD_TAGS: ["button", "span"],
      ADD_ATTR: [
        "class",
        "target",
        "rel",
        "data-code-index",
        "data-code-language",
        "data-code-action",
        "aria-label",
      ],
    });

    return renderedCodeBlocks.reduce(
      (output, block) => output.replace(block.placeholder, block.html),
      sanitized,
    );
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

const messageHasCode = (message = {}) =>
  Boolean(extractFirstCodeBlock(message.text).code);
const messageHasRunnableCode = (message = {}) => {
  const firstBlock = extractFirstCodeBlock(message?.text || "");
  if (!firstBlock?.code) return false;
  const resolvedLanguage = inferRunnerLanguage(
    firstBlock.language,
    firstBlock.code,
  );
  return canRunInRunner(resolvedLanguage);
};

const buildChatMessages = () =>
  messages.value.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    text: String(message.text || ""),
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

const requestGeminiDirect = async () => {
  if (!GEMINI_API_KEY)
    throw new Error("Gemini API key is missing in frontend env.");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_CHAT_MODEL,
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: ASSISTANT_SYSTEM_PROMPT }] },
      contents: buildChatMessages().map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.text }],
      })),
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

const requestGroqDirect = async () => {
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
      messages: buildOpenAiMessages(),
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

const requestOpenAiDirect = async () => {
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
      messages: buildOpenAiMessages(),
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

const requestAssistantReply = async () => {
  const selectedProvider = normalizeSelectedProvider(selectedModel.value);
  const attempts = buildProviderAttempts(selectedProvider);
  const failures = [];

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      failures.push(
        `[${selectedProvider}] ${String(error?.message || "Request failed")}`,
      );
    }
  }

  throw new Error(failures.join(" | "));
};

const getAuthorizationHeader = async () => {
  if (!auth?.currentUser) throw new Error("Please sign in first.");
  const idToken = await auth.currentUser.getIdToken();
  if (!idToken) throw new Error("Unable to retrieve auth token.");
  return `Bearer ${idToken}`;
};

const authorizedFetchHistory = async (path = "", options = {}) => {
  const historyUrls = getHistoryUrls(path);
  if (!historyUrls.length)
    throw new Error("History API URL is not configured.");

  const authorization = await getAuthorizationHeader();
  let lastError = null;

  for (let index = 0; index < historyUrls.length; index += 1) {
    try {
      const response = await fetch(historyUrls[index], {
        ...options,
        headers: { ...(options.headers || {}), Authorization: authorization },
      });

      if (response.status === 401) {
        if (auth) await firebaseSignOut(auth).catch(() => { });
        throw new Error("Your session expired. Please sign in again.");
      }

      if (
        index < historyUrls.length - 1 &&
        RETRYABLE_STATUSES.has(response.status)
      ) {
        lastError = new Error(`History API returned ${response.status}.`);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (!isLikelyNetworkError(error) || index === historyUrls.length - 1)
        throw error;
    }
  }

  throw lastError || new Error("Unable to reach history API.");
};

const hasUser = computed(() => Boolean(currentUser.value));
const isDarkTheme = computed(() => pageTheme.value === "dark");
const themeToggleLabel = computed(() =>
  isDarkTheme.value ? "Switch to light theme" : "Switch to black theme",
);
const themeToggleIcon = computed(() =>
  isDarkTheme.value ? "mdi-white-balance-sunny" : "mdi-weather-night",
);
const canSend = computed(
  () => hasUser.value && !sending.value && Boolean(userInput.value.trim()),
);
const isEmptyConversation = computed(() => messages.value.length === 0);
const modelOptions = computed(() => [
  { label: "Gemini (Recommanded)", value: "gemini" },
  { label: "Llama (normal coding)", value: "groq" },
  { label: "Open Ai (higher coding)", value: "openai" },
]);
const activeConversationTitle = computed(() => {
  const active = conversations.value.find(
    (item) => item.id === activeConversationId.value,
  );
  return active?.title || "New chat";
});
const userInitial = computed(() => {
  const displayName = String(currentUser.value?.displayName || "").trim();
  if (displayName) return displayName.charAt(0).toUpperCase();
  const email = String(currentUser.value?.email || "").trim();
  if (email) return email.charAt(0).toUpperCase();
  return "U";
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
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
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
  }
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

const buildRunnerDoc = ({
  code = "",
  language = "plaintext",
  mode = "web",
}) => {
  const lang = String(language || "plaintext").toLowerCase();
  const source = String(code || "");
  if (mode === "console") {
    if (!["javascript", "js"].includes(lang)) {
      return `<!doctype html><html><body style=\"margin:0;background:#0b1020;color:#d5ddf7;font-family:Consolas,monospace;padding:14px;\"><pre>${escapeHtml(source)}</pre></body></html>`;
    }
    return `<!doctype html><html><body style=\"margin:0;background:#0b1020;color:#d5ddf7;font-family:Consolas,monospace;padding:14px;\"><div id=\"out\"></div><script>const out=document.getElementById(\"out\");const log=(...a)=>{const d=document.createElement(\"div\");d.textContent=a.map((x)=>typeof x===\"string\"?x:JSON.stringify(x)).join(\" \");out.appendChild(d);};console.log=log;try{new Function(${JSON.stringify(source)})();}catch(e){log(\"ERROR:\",e?.message||\"unknown\");}<\\/script></body></html>`;
  }
  if (["html", "htm", "markup", "php"].includes(lang)) {
    return /<html[\\s>]/i.test(source)
      ? source
      : `<!doctype html><html><body style=\"font-family:system-ui;padding:16px;\">${source}</body></html>`;
  }
  if (["javascript", "js"].includes(lang)) {
    return `<!doctype html><html><body style=\"font-family:system-ui;padding:16px;\"><p>Open console for logs.</p><script>${source}<\\/script></body></html>`;
  }
  if (lang === "css") {
    return `<!doctype html><html><head><style>${source}</style></head><body><main style=\"padding:16px;font-family:system-ui;\"><h2>CSS Preview</h2><button>Sample Button</button></main></body></html>`;
  }
  return `<!doctype html><html><body style=\"font-family:Consolas,monospace;padding:14px;\"><pre>${escapeHtml(source)}</pre></body></html>`;
};

const runRunnerPreview = () => {
  runnerSrcdoc.value = buildRunnerDoc({
    code: runnerCode.value,
    language: runnerLanguage.value,
    mode: runnerMode.value,
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
      "Run is disabled for CSS snippets. Use Copy or Download.",
      "error",
    );
    return;
  }
  runnerLanguage.value = resolvedLanguage;
  runnerCode.value = source;
  runnerTitle.value = title;
  runnerMode.value = getRunnerModeForLanguage(resolvedLanguage);
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

function isWebRunnerLanguage(language = "") {
  return ["html", "htm", "markup", "php"].includes(
    String(language || "").toLowerCase(),
  );
}

function canRunInRunner(language = "") {
  return String(language || "").toLowerCase() !== "css";
}

function getRunnerModeForLanguage(language = "") {
  return isWebRunnerLanguage(language) ? "web" : "console";
}

const openCodeRunnerForBlock = (message, index, blockIndex = 0) => {
  const codeBlocks = extractCodeBlocks(message?.text || "");
  if (!codeBlocks.length) {
    showAlert("No runnable code block found.", "error");
    return;
  }

  const normalizedIndex =
    Number.isInteger(blockIndex) &&
      blockIndex >= 0 &&
      blockIndex < codeBlocks.length
      ? blockIndex
      : 0;
  const block = codeBlocks[normalizedIndex];

  const title =
    codeBlocks.length > 1
      ? `Assistant code #${index + 1}.${normalizedIndex + 1}`
      : `Assistant code #${index + 1}`;
  void openRunnerWithCode({
    code: block.code,
    language: block.language || "plaintext",
    title,
  });
};

const openCodeRunnerFromMessage = (message, index) => {
  openCodeRunnerForBlock(message, index, 0);
};

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
      "Run is disabled for CSS snippets. Use Copy or Download.",
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
    const response = await authorizedFetchHistory(`?limit=${historyLimit}`);
    if (!response.ok) throw new Error(await readErrorResponse(response));
    const payload = await response.json().catch(() => ({ data: [] }));
    conversations.value = Array.isArray(payload?.data)
      ? payload.data.map(normalizeSummary)
      : [];
    sortConversations();
  } catch (error) {
    historyLoadError.value = getFriendlyFetchError(error, "chat history");
    throw error;
  } finally {
    loadingHistory.value = false;
  }
};

const openConversation = async (conversationId, closeSidebar = true) => {
  const normalizedId = String(conversationId || "").trim();
  if (!normalizedId || !hasUser.value) return;

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

    if (closeSidebar) sidebarOpen.value = false;
    await scrollToBottom();
  } catch (error) {
    showAlert(getFriendlyFetchError(error, "conversation"), "error");
  } finally {
    loadingConversation.value = false;
  }
};

const saveConversationHistory = async () => {
  if (!hasUser.value || !activeConversationId.value || !messages.value.length)
    return;

  const payload = {
    title: getConversationTitleFromMessages(messages.value),
    messages: messages.value.map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      text: String(message.text || ""),
      createdAt: message.createdAt,
    })),
  };

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
};

const saveConversationHistorySafe = async () => {
  try {
    await saveConversationHistory();
  } catch (error) {
    showAlert(getFriendlyFetchError(error, "conversation history"), "error");
  }
};

const sendMessage = async () => {
  const prompt = userInput.value.trim();
  if (!prompt || sending.value) return;
  if (!hasUser.value) {
    showAlert("Please sign in with Google first.", "error");
    return;
  }

  if (!activeConversationId.value)
    activeConversationId.value = generateConversationId();

  messages.value.push(createMessage("user", prompt));
  userInput.value = "";
  sending.value = true;
  await scrollToBottom();

  try {
    const assistantText = String(await requestAssistantReply()).trim();
    if (!assistantText)
      throw new Error("AI provider returned an empty response.");
    messages.value.push(createMessage("assistant", assistantText));
  } catch (error) {
    const userMessage = error?.message || "Unable to generate AI response.";
    messages.value.push(
      createMessage(
        "assistant",
        `Sorry, I could not generate a reply.\n\n${userMessage}`,
        true,
      ),
    );
    showAlert(getFriendlyFetchError(error, "AI response"), "error");
  } finally {
    sending.value = false;
    await saveConversationHistorySafe();
    await scrollToBottom();
  }
};

const deleteConversation = (conversationId) => {
  if (!hasUser.value || sending.value) return;
  const normalizedId = String(conversationId || "").trim();
  if (!normalizedId) return;

  deleteConversationId.value = normalizedId;
  deleteDialog.value = true;
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  deleteConversationId.value = "";
};

const confirmDelete = async () => {
  const normalizedId = deleteConversationId.value;
  if (!normalizedId || isDeleting.value) return;

  isDeleting.value = true;
  try {
    const response = await authorizedFetchHistory(
      `/${encodeURIComponent(normalizedId)}`,
      { method: "DELETE" },
    );
    if (!response.ok) throw new Error(await readErrorResponse(response));

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
  } catch (error) {
    showAlert(getFriendlyFetchError(error, "conversation"), "error");
  } finally {
    isDeleting.value = false;
    closeDeleteDialog();
  }
};

const startNewChat = () => {
  if (!hasUser.value || sending.value) return;
  resetToNewConversation();
  sidebarOpen.value = false;
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
        "Firebase config is missing. Add VITE_FIREBASE_* values first.",
        "error",
      );
    }
    return;
  }

  signingIn.value = true;
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    showAlert(error?.message || "Google sign-in failed.", "error");
  } finally {
    signingIn.value = false;
  }
};

const signOutUser = async () => {
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    showAlert(error?.message || "Sign out failed.", "error");
  }
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const setupAuth = () => {
  if (!auth || !hasRequiredFirebaseConfig) {
    authReady.value = true;
    currentUser.value = null;
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
      activeConversationId.value = "";
      authReady.value = true;
      return;
    }

    try {
      await loadConversationList();
      if (conversations.value.length > 0) {
        await openConversation(conversations.value[0].id, false);
      } else {
        resetToNewConversation();
      }
    } catch (error) {
      resetToNewConversation();
      showAlert(getFriendlyFetchError(error, "your history"), "error");
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

watch(
  () => runnerMode.value,
  () => {
    if (runnerPanelOpen.value && runnerCode.value.trim()) runRunnerPreview();
  },
);

watch(selectedModel, (value) => {
  const normalized = normalizeSelectedProvider(value);
  if (normalized !== value) selectedModel.value = normalized;
});

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
  <div class="mindlytic-page" :class="{ 'theme-dark': isDarkTheme }">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card class="rounded-xl elevation-2 pa-5">

        <!-- Title -->
        <div class="text-subtitle-1 font-weight-medium mb-2">
          Delete conversation?
        </div>

        <!-- Description -->
        <div class="text-body-2 text-medium-emphasis mb-6">
          This will permanently remove it.
        </div>

        <!-- Actions -->
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" class="text-medium-emphasis" @click="closeDeleteDialog">
            Cancel
          </v-btn>

          <v-btn color="red" variant="flat" class="px-4" :loading="isDeleting" @click="confirmDelete">
            Delete
          </v-btn>
        </div>

      </v-card>
    </v-dialog>


    <div class="mindlytic-layout">
      <div v-if="hasUser && sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

      <aside class="chat-sidebar" :class="{ 'chat-sidebar-open': sidebarOpen }" v-if="hasUser">
        <div class="sidebar-brand">
          <img src="/media/Picture/mindlytic.svg" alt="Mindlytic" class="w-8 brand-logo-mark" />
          <div class="brand-copy">
            <p class="brand-name">mindlytic</p>
            <p class="brand-subtitle">AI Workspace</p>
          </div>
          <v-btn class="sidebar-toggle-btn" icon="mdi-close" density="comfortable" size="small" variant="tonal"
            title="Close sidebar" @click="sidebarOpen = false" />
        </div>

        <v-btn class="new-chat-btn text-none" color="primary" variant="flat" rounded="xl" prepend-icon="mdi-plus"
          :disabled="!hasUser || sending" @click="startNewChat">
          New chat
        </v-btn>

        <div class="history-wrap">
          <p class="history-title my-2">Recent Chats</p>

          <div v-if="loadingHistory" class="history-empty">
            Loading history...
          </div>
          <div v-else-if="!hasUser" class="history-empty">
            Sign in to see your chats.
          </div>
          <div v-else-if="conversations.length === 0" class="history-empty">
            No saved chats yet.
          </div>
          <p v-if="historyLoadError" class="history-error">
            {{ historyLoadError }}
          </p>

          <div v-if="conversations.length > 0" class="history-list">
            <button v-for="item in conversations" :key="item.id" class="history-item" :class="{
              'history-item-active': item.id === activeConversationId,
            }" :disabled="loadingConversation || sending" @click="openConversation(item.id)">
              <div class="history-content">
                <p class="history-item-title">{{ item.title }}</p>
              </div>
              <v-btn icon="mdi-delete" size="x-small" variant="outlined" color="error" class="history-delete-btn"
                :disabled="sending" @click.stop="deleteConversation(item.id)" />
            </button>
          </div>
        </div>

        <template v-if="hasUser">
          <div class="user-profile">
            <v-avatar size="32" class="mr-2" color="primary" variant="tonal">
              <img v-if="userAvatarSrc" :src="userAvatarSrc" alt="Profile" class="profile-image"
                referrerpolicy="no-referrer" @error="avatarImageFailed = true" />
              <span v-else class="avatar-initial">{{ userInitial }}</span>
            </v-avatar>
            <div class="user-copy">
              <p class="user-name">
                {{ currentUser?.displayName || "Signed in user" }}
              </p>
            </div>
            <v-menu location="top end" offset="12">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-horizontal" density="comfortable" variant="outlined"
                  class="profile-menu-btn" />
              </template>
              <v-list density="compact" class="profile-menu-list" :class="{ 'profile-menu-list-dark': isDarkTheme }">
                <v-list-item :prepend-icon="themeToggleIcon" @click="toggleTheme">
                  <v-list-item-title>{{ themeToggleLabel }}</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item prepend-icon="mdi-logout" @click="signOutUser">
                  <v-list-item-title>Logout</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
        <template v-else>
          <p class="user-email">Google sign-in is required.</p>
        </template>
      </aside>

      <section class="chat-main">
        <header v-if="hasUser" class="chat-mobile-head">
          <v-btn icon="mdi-menu" size="small" variant="text" @click="toggleSidebar" />
          <span class="chat-mobile-title">{{
            hasUser ? activeConversationTitle : "Mindlytic AI"
          }}</span>

          <v-btn density="comfortable" variant="text" icon="mdi-plus" :disabled="!hasUser || sending"
            @click="startNewChat" />
        </header>

        <v-progress-linear v-if="!authReady" class="session-top-loader" indeterminate color="primary" height="3" />

        <div v-if="!authReady" class="session-loader-spacer"></div>

        <div v-else-if="!hasRequiredFirebaseConfig" class="state-card">
          <h2>Firebase config missing</h2>
          <p>
            Add `VITE_FIREBASE_*` keys in frontend `.env` to enable Google
            sign-in.
          </p>
        </div>

        <div v-else-if="!hasUser" class="state-card-auth">
          <div class="auth-content">
            <div class="auth-header">
              <img src="/media/Picture/mindlytic.svg" alt="Mindlytic" class="auth-logo" />
              <h1 class="auth-title">Mindlytic AI</h1>
            </div>

            <v-btn color="primary" rounded="xl" variant="flat" class="text-none google-auth-btn" :loading="signingIn"
              :disabled="signingIn" prepend-icon="mdi-google" @click="signInWithGoogle">
              Sign in with Google
            </v-btn>
          </div>
        </div>

        <template v-else>
          <div class="workspace-shell" :class="{ 'workspace-shell-with-runner': runnerPanelOpen }">
            <div class="chat-workspace" :class="{ 'chat-workspace-empty': isEmptyConversation }">
              <div ref="chatScrollRef" class="chat-scroll" :class="{ 'chat-scroll-empty': isEmptyConversation }">
                <div v-if="isEmptyConversation" class="empty-state">
                  <p class="empty-title">How can I help you?</p>
                  <p class="empty-subtitle">
                    Ask anything to start a new conversation.
                  </p>
                </div>

                <div v-else class="message-thread">
                  <div v-for="(message, index) in messages" :key="`${message.createdAt}-${index}`" class="message-row"
                    :class="message.role === 'assistant'
                      ? 'message-row-ai'
                      : 'message-row-user'
                      ">
                    <div class="message-bubble" :class="message.error ? 'message-bubble-error' : ''">
                      <div v-if="message.role === 'assistant'" class="markdown-body"
                        v-html="renderAssistantMessage(message.text)" @click="
                          handleAssistantMessageClick($event, message, index)
                          "></div>
                      <p v-else class="message-text">{{ message.text }}</p>
                      <p class="message-time">
                        {{ formatMessageTime(message.createdAt) }}
                      </p>

                      <div v-if="message.role === 'assistant'" class="message-actions">
                        <v-chip size="small" prepend-icon="mdi-content-copy" variant="outlined" color="primary"
                          @click="copyText(message.text, 'Reply copied.')">Copy</v-chip>
                      </div>
                    </div>
                  </div>

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

              <div class="composer-shell" :class="{ 'composer-shell-floating': isEmptyConversation }">
                <div class="composer-panel">
                  <v-textarea v-model="userInput" class="composer-input" placeholder="Message Mindlytic AI" hide-details
                    rows="1" auto-grow max-rows="6" variant="outlined" :disabled="sending || loadingConversation"
                    @keydown="handlePromptKeydown" />
                  <div class="composer-bottom-tools">
                    <v-select :key="`model-select-${pageTheme}`" v-model="selectedModel" :items="modelOptions"
                      item-title="label" item-value="value" :return-object="false" density="compact" hide-details
                      variant="outlined" :menu-props="composerMenuProps" class="composer-model-select"
                      :disabled="sending || loadingConversation" />
                    <v-btn icon color="primary" class="composer-send" :disabled="!canSend" :loading="sending"
                      @click="sendMessage">
                      <v-icon icon="mdi-arrow-up" />
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="runnerPanelOpen" class="runner-backdrop" @click="closeRunnerPanel"></div>
            <aside v-if="runnerPanelOpen" class="ai-runner-panel">
              <div class="ai-runner-head">
                <div class="ai-runner-head-main">
                  <p class="ai-runner-title">{{ runnerTitle }}</p>
                </div>
                <div class="ai-runner-head-actions">
                  <v-btn size="x-small" color="primary" variant="tonal" class="text-none runner-mode-btn"
                    @click="runnerMode = 'web'">Web</v-btn>
                  <v-btn size="x-small" color="primary" variant="tonal" class="text-none runner-mode-btn"
                    @click="runnerMode = 'console'">Console</v-btn>
                  <v-btn size="small" variant="text" color="primary" icon="mdi-close" class="runner-close-btn"
                    @click="closeRunnerPanel" />
                </div>
              </div>
              <iframe :key="runnerFrameKey" :srcdoc="runnerSrcdoc" class="ai-runner-frame"
                sandbox="allow-scripts allow-modals" referrerpolicy="no-referrer" title="Code runner preview"></iframe>
            </aside>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

/* ChatGPT Aesthetic Base */
.mindlytic-page {
  height: 100dvh;
  width: 100vw;
  background-color: #ffffff !important;
  color: #0d0d0d !important;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  transition: background-color 0.2s ease, color 0.2s ease;
  position: relative;
}

.mindlytic-page.theme-dark {
  background-color: #212121 !important;
  color: #ececec !important;
}

.mindlytic-page * {
  border-color: inherit;
}

.mindlytic-layout {
  height: 100%;
  display: flex;
  position: relative;
  z-index: 1;
  background-color: transparent !important;
}

/* Sidebar */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.chat-sidebar {
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  height: 100%;
  background-color: #f9f9f9 !important;
  border-right: none;
  display: flex;
  flex-direction: column;
  padding: 12px;
  position: relative;
  z-index: 50;
  transition: transform 0.3s ease;
}

.mindlytic-page.theme-dark .chat-sidebar {
  background-color: #171717 !important;
}

/* Sidebar Branding */
.sidebar-brand {
  display: none;
}

/* New Chat Button */
.new-chat-btn {
  --v-btn-height: 40px;
  font-weight: 500;
  border-radius: 8px !important;
  background-color: #ececec !important;
  color: #0d0d0d !important;
  box-shadow: none !important;
  text-transform: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  border: none !important;
  padding: 8px 12px !important;
}


.mindlytic-page.theme-dark .new-chat-btn {
  color: #ececec !important;
  background-color: #212121 !important;
}

/* History List */
.history-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}

.history-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  padding: 8px 12px;
  margin-top: 16px;
}

.mindlytic-page.theme-dark .history-title {
  color: #b4b4b4 !important;
}

.history-error {
  margin: 0 12px 8px;
  font-size: 0.8rem;
  color: #ef4444;
}

.history-empty {
  margin: 8px 12px;
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-list::-webkit-scrollbar,
.chat-scroll::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track,
.chat-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.history-list::-webkit-scrollbar-thumb,
.chat-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.mindlytic-page.theme-dark .history-list::-webkit-scrollbar-thumb,
.mindlytic-page.theme-dark .chat-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.history-item {
  display: flex;
  align-items: center;
  text-align: start;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: transparent !important;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.history-item:hover {
  background-color: #ececec !important;
}

.mindlytic-page.theme-dark .history-item:hover {
  background-color: #2a2b32 !important;
}

.history-item-active {
  background-color: #ececec !important;
}

.mindlytic-page.theme-dark .history-item-active {
  background-color: #343541 !important;
}

.history-content,
.history-delete-btn {
  position: relative;
  z-index: 1;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-item-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 400;
  color: #0d0d0d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mindlytic-page.theme-dark .history-item-title {
  color: #ececec !important;
}

.history-delete-btn {
  opacity: 0;
  transform: translateX(5px);
}

.history-item:hover .history-delete-btn {
  opacity: 1;
  transform: translateX(0);
}

/* User Profile */
.user-profile {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background-color: #ececec !important;
  border-radius: 8px;
  border: 0.1px solid #0d0d0d !important;
  margin-top: 12px;
  transition: all 0.2s ease;
}

.mindlytic-page.theme-dark .user-profile {
  background-color: #2a2b32 !important;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-copy {
  flex: 1;
  min-width: 0;
  margin: 0 12px;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0d0d0d;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mindlytic-page.theme-dark .user-name {
  color: #ececec !important;
}

.user-email {
  display: none;
}

.avatar-initial {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.mindlytic-page.theme-dark .user-profile .v-avatar {
  background-color: #10a37f !important;
}

/* Chat Main Area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: transparent !important;
  min-width: 0;
}

.chat-mobile-head {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.mindlytic-page.theme-dark .chat-mobile-head {
  background-color: rgba(33, 33, 33, 0.9) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-mobile-title {
  font-size: 1rem;
  font-weight: 500;
}

.workspace-shell {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  background-color: transparent !important;
}

.chat-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  background-color: transparent !important;
}

.chat-scroll {
  flex: 1;
  padding: 48px 24px;
  overflow-y: auto;
  scroll-behavior: smooth;
  background-color: transparent !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  opacity: 0.8;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #0d0d0d;
}

.mindlytic-page.theme-dark .empty-title {
  color: #ececec !important;
}

.empty-subtitle {
  display: none;
}

/* Authentication State */
.state-card {
  padding: 24px;
  text-align: center;
  color: #ef4444;
}

.state-card-auth {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: transparent;
}

.auth-content {
  background: transparent;
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 380px;
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.auth-logo {
  width: 44px;
  height: 44px;
  border-radius: 8px;
}

.auth-title {
  font-size: 2rem;
  font-weight: 600;
  color: #0d0d0d;
  margin: 0;
}

.mindlytic-page.theme-dark .auth-title {
  color: #ececec !important;
}

.google-auth-btn {
  height: 52px !important;
  font-size: 1rem !important;
  font-weight: 500 !important;
  border-radius: 4px !important;
  background-color: #fff !important;
  color: #0d0d0d !important;
  border: 1px solid #d9d9e3 !important;
  box-shadow: none !important;
  text-transform: none !important;
}

.mindlytic-page.theme-dark .google-auth-btn {
  background-color: #202123 !important;
  color: #ececec !important;
  border-color: #565869 !important;
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
  box-shadow: none;
}

/* User Message */
.message-row-user .message-bubble {
  background-color: #f4f4f4 !important;
  color: #0d0d0d;
  border-radius: 24px;
  max-width: 80%;
}

.mindlytic-page.theme-dark .message-row-user .message-bubble {
  background-color: #2f2f2f !important;
  color: #ececec !important;
}

/* AI Message */
.message-row-ai .message-bubble {
  background-color: transparent !important;
  color: #0d0d0d;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
  max-width: 100%;
}

.mindlytic-page.theme-dark .message-row-ai .message-bubble {
  color: #ececec !important;
}

.message-bubble-error {
  background-color: #fef2f2 !important;
  color: #991b1b !important;
}

.mindlytic-page.theme-dark .message-bubble-error {
  background-color: rgba(127, 29, 29, 0.2) !important;
  color: #fca5a5 !important;
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
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-row:hover .message-actions {
  opacity: 1;
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

.thinking-dots .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes pulseWait {

  0%,
  80%,
  100% {
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
  padding: 0 24px 24px;
  background-color: transparent !important;
  position: relative;
  z-index: 20;
}

.composer-panel {
  max-width: 768px;
  margin: 0 auto;
  background-color: #cccccc !important;
  border: 1px solid black !important;
  border-radius: 10px !important;
  padding: 10px 10px;
  box-shadow: none !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.composer-panel:focus-within {
  border-color: transparent !important;
}

.mindlytic-page.theme-dark .composer-panel {
  background-color: #2f2f2f !important;
}

/* Vuetify Element Overrides to kill unwanted backgrounds */
.composer-input {
  width: 100%;
}

.composer-input :deep(.v-input__control) {
  min-height: unset !important;
  background: transparent !important;
}

.composer-input :deep(.v-field) {
  background: transparent !important;
}

.composer-input :deep(.v-field__overlay),
.composer-input :deep(.v-field__outline),
.composer-input :deep(.v-field__loader) {
  display: none !important;
}
.composer-input :deep(textarea) {
  color: #0d0d0d !important;
}
.mindlytic-page.theme-dark .composer-input :deep(textarea) { color: #ececec !important; }
.mindlytic-page.theme-dark .composer-input :deep(textarea::placeholder) { color: #9b9b9b !important; }

.composer-bottom-tools { display: flex; justify-content: space-between; align-items: center; }

.composer-model-select { width: auto; flex: none;}
.composer-model-select :deep(.v-field) {
  border-radius: 9px !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.composer-model-select :deep(.v-field__input) {
  font-size: 0.875rem;
  font-weight: 500;
  color: #494949 !important;
}

.mindlytic-page.theme-dark .composer-model-select :deep(.v-field__input) {
  color: #f3f3f3 !important;
}

.composer-send {
  background: #000 !important;
  color: #fff !important;
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  box-shadow: none !important;
  margin-right: 4px;
  transition: opacity 0.2s;
}

.mindlytic-page.theme-dark .composer-send {
  background: #fff !important;
  color: #000 !important;
}
.composer-send:disabled { opacity: 0.2; background: #000 !important; color: #fff !important; }
.mindlytic-page.theme-dark .composer-send:disabled { background: #fff !important; color: #000 !important; }

/* Markdown Customizations - Clean */
.markdown-body {
  font-size: 1rem;
  color: #0d0d0d !important;
  background-color: transparent !important;
}

.mindlytic-page.theme-dark .markdown-body {
  color: #ececec !important;
}

.markdown-body p {
  margin-bottom: 16px;
}

.message-row-user .markdown-body p {
  margin-bottom: 0px;
}

.markdown-body pre {
  background-color: #0d0d0d !important;
  color: #ececec !important;
  padding: 16px !important;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  border: none !important;
}

.mindlytic-page.theme-dark .markdown-body pre {
  background-color: #000000 !important;
}

.markdown-body code {
  background-color: rgba(0, 0, 0, 0.05) !important;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.mindlytic-page.theme-dark .markdown-body code {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ececec !important;
}

.markdown-body pre code {
  background-color: transparent !important;
  padding: 0px !important;
  border-radius: 0;
  color: inherit !important;
}

/* Inline Code Runner Block */
.markdown-body :deep(.inline-code-runner) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
  background-color: #fff !important;
}

.mindlytic-page.theme-dark .markdown-body :deep(.inline-code-runner) {
  border-color: rgba(255, 255, 255, 0.1);
  background-color: #212121 !important;
}

.markdown-body :deep(.inline-code-runner-head) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9 !important;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.mindlytic-page.theme-dark .markdown-body :deep(.inline-code-runner-head) {
  background-color: #171717 !important;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.markdown-body :deep(.inline-code-lang) {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666 !important;
  text-transform: uppercase;
}

.mindlytic-page.theme-dark .markdown-body :deep(.inline-code-lang) {
  color: #b4b4b4 !important;
}

.markdown-body :deep(.code-runner-inline-btn) {
  font-size: 0.75rem;
  padding: 4px 8px;
  background-color: transparent !important;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  border-radius: 4px;
  color: #0d0d0d !important;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s;
}

.markdown-body :deep(.code-runner-inline-btn:hover) {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.mindlytic-page.theme-dark .markdown-body :deep(.code-runner-inline-btn) {
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #ececec !important;
}

.mindlytic-page.theme-dark .markdown-body :deep(.code-runner-inline-btn:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Syntax Highlighting */
.markdown-body :deep(pre code .token.comment) {
  color: #6b7280;
}

.markdown-body :deep(pre code .token.string) {
  color: #10b981;
}

.markdown-body :deep(pre code .token.keyword) {
  color: #3b82f6;
}

.markdown-body :deep(pre code .token.function) {
  color: #8b5cf6;
}

.markdown-body :deep(pre code .token.number) {
  color: #f59e0b;
}

.markdown-body :deep(pre code .token.operator) {
  color: #9ca3af;
}

/* Runner Panel */
.ai-runner-panel {
  flex: 0 0 clamp(300px, 35vw, 600px);
  background-color: #fff !important;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 25;
}

.mindlytic-page.theme-dark .ai-runner-panel {
  background-color: #212121 !important;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-runner-head {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mindlytic-page.theme-dark .ai-runner-head {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-runner-title {
  font-weight: 500;
  font-size: 0.875rem;
  color: #0d0d0d !important;
}

.mindlytic-page.theme-dark .ai-runner-title {
  color: #ececec !important;
}

.ai-runner-head-actions {
  display: flex;
  gap: 8px;
}

.ai-runner-frame {
  flex: 1;
  width: 100%;
  border: none;
  background-color: white !important;
}

.mindlytic-page.theme-dark .ai-runner-frame {
  background-color: #ffffff !important;
}

/* Responsive Overrides */
@media (max-width: 1024px) {
  .chat-scroll {
    padding: 32px 16px;
  }

  .composer-shell {
    padding: 0 16px 24px;
  }

  .ai-runner-panel {
    position: absolute;
    inset: 0;
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .chat-sidebar {
    position: absolute;
    left: -260px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }

  .mindlytic-page.theme-dark .chat-sidebar {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  }

  .chat-sidebar-open {
    left: 0;
  }

  .chat-mobile-head {
    display: flex;
  }

  .chat-scroll {
    padding: 24px 12px;
  }

  .composer-shell {
    padding: 0 12px 12px;
  }

  .composer-panel {
    border-radius: 24px;
    padding: 7px 7px;
  }

  .message-bubble {
    padding: 12px 0;
  }

  .message-row-user .message-bubble {
    padding: 10px 16px;
    max-width: 90%;
  }
}
</style>

<style>
/* Global Menu Overrides */
.v-overlay__content.composer-model-menu {
  border-radius: 8px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  background-color: #fff !important;
}

.v-overlay__content.composer-model-menu-dark {
  background-color: #2f2f2f !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
  color: #ececec !important;
}

.v-overlay__content.composer-model-menu .v-list {
  background-color: transparent !important;
  padding: 4px !important;
}

.v-overlay__content.composer-model-menu .v-list-item {
  border-radius: 4px !important;
  margin: 2px 0 !important;
  min-height: 36px !important;
}

.v-overlay__content.composer-model-menu-dark .v-list-item {
  color: #cfcfcf !important;
}

.v-overlay__content.composer-model-menu-dark .v-list-item:hover,
.v-overlay__content.composer-model-menu-dark .v-list-item--active {
  background-color: #424242 !important;
  color: #ececec !important;
}
</style>
