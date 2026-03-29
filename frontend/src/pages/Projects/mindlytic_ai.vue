<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { marked } from "marked";
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

const renderAssistantMessage = (text = "") => {
  const raw = String(text || "");
  if (!raw.trim()) return "";
  try {
    const parsed = marked.parse(raw);
    const html = typeof parsed === "string" ? parsed : raw;
    const codeBlocks = extractCodeBlocks(raw);
    let codeIndex = 0;
    const withInlineRunnerButtons = html.replace(
      /<pre><code[\s\S]*?<\/code><\/pre>/gi,
      (codeBlockHtml) => {
        const rawBlockLanguage =
          String(codeBlocks[codeIndex]?.language || "code").toLowerCase() ||
          "code";
        const rawBlockCode = String(codeBlocks[codeIndex]?.code || "");
        const blockLanguage = inferRunnerLanguage(
          rawBlockLanguage,
          rawBlockCode,
        );
        const runButtonHtml = canRunInRunner(blockLanguage)
          ? `<button type="button" class="code-runner-inline-btn" data-code-index="${codeIndex}" data-code-language="${escapeHtml(blockLanguage)}" data-code-action="run" aria-label="Run code">Run</button>`
          : "";
        const headerHtml = `
        <div class="inline-code-runner-head">
          <span class="inline-code-lang">${escapeHtml(blockLanguage)}</span>
          <div class="inline-code-actions">
            <button type="button" class="code-runner-inline-btn" data-code-index="${codeIndex}" data-code-language="${escapeHtml(blockLanguage)}" data-code-action="copy" aria-label="Copy code">Copy</button>
            <button type="button" class="code-runner-inline-btn" data-code-index="${codeIndex}" data-code-language="${escapeHtml(blockLanguage)}" data-code-action="download" aria-label="Download code">Download</button>
            ${runButtonHtml}
          </div>
        </div>`;
        codeIndex += 1;
        return `<div class="inline-code-runner">${headerHtml}${codeBlockHtml}</div>`;
      },
    );
    return DOMPurify.sanitize(withInlineRunnerButtons, {
      ADD_TAGS: ["button"],
      ADD_ATTR: [
        "target",
        "rel",
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
const canSend = computed(
  () => hasUser.value && !sending.value && Boolean(userInput.value.trim()),
);
const isEmptyConversation = computed(() => messages.value.length === 0);
const modelOptions = computed(() => [
  { label: `Gemini (${GEMINI_CHAT_MODEL})`, value: "gemini" },
  { label: `Llama (${GROQ_CHAT_MODEL})`, value: "groq" },
  { label: `OpenAI (${OPENAI_CHAT_MODEL})`, value: "openai" },
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

const deleteConversation = async (conversationId) => {
  if (!hasUser.value || sending.value) return;
  const normalizedId = String(conversationId || "").trim();
  if (!normalizedId) return;
  if (!window.confirm("Delete this conversation?")) return;

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

onMounted(() => {
  setupAuth();
});

onUnmounted(() => {
  if (typeof removeAuthListener === "function") {
    removeAuthListener();
  }
});
</script>

<template>
  <div class="mindlytic-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

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
          <p class="history-title">Today</p>

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
                <p class="history-item-meta">
                  {{ formatDateLabel(item.updatedAt) }}
                </p>
              </div>
              <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" class="history-delete-btn"
                :disabled="sending" @click.stop="deleteConversation(item.id)" />
            </button>
          </div>
        </div>

        <div class="sidebar-footer">
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
                <p class="user-email">{{ currentUser?.email }}</p>
              </div>
              <v-btn icon="mdi-logout" size="small" variant="text" color="red" @click="signOutUser" />
            </div>
          </template>
          <template v-else>
            <p class="user-email">Google sign-in is required.</p>
          </template>
        </div>
      </aside>

      <section class="chat-main">
        <header class="chat-mobile-head">
          <v-btn v-if="hasUser" icon="mdi-menu" size="small" variant="text" @click="toggleSidebar" />
          <span class="chat-mobile-title">{{
            hasUser ? activeConversationTitle : "Mindlytic AI"
            }}</span>

          <v-btn density="comfortable" variant="text" icon="mdi-plus"
            :disabled="!hasUser || sending" @click="startNewChat" />
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

        <div v-else-if="!hasUser" class="state-card state-card-auth">
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
                        <v-btn size="x-small" variant="tonal" color="primary" class="text-none"
                          @click="copyText(message.text, 'Reply copied.')">Copy</v-btn>
                      </div>
                    </div>
                  </div>

                  <div v-if="sending" class="message-row message-row-ai">
                    <div class="message-bubble message-bubble-thinking">
                      <p class="message-text">Thinking...</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="composer-shell" :class="{ 'composer-shell-floating': isEmptyConversation }">
                <div class="composer-panel">
                  <v-textarea v-model="userInput" class="composer-input" placeholder="Message Mindlytic AI" hide-details
                    rows="1" auto-grow max-rows="6" variant="plain" :disabled="sending || loadingConversation"
                    @keydown="handlePromptKeydown" />
                  <div class="composer-bottom-tools">
                    <v-select v-model="selectedModel" :items="modelOptions" item-title="label" item-value="value"
                      :return-object="false" density="compact" hide-details variant="outlined"
                      :menu-props="{
                        maxHeight: 280,
                        minWidth: 270,
                        maxWidth: 270,
                        contentClass: 'composer-model-menu',
                      }" class="composer-model-select"
                      :disabled="sending || loadingConversation" />
                    <v-btn icon color="primary" class="composer-send" :disabled="!canSend" :loading="sending"
                      @click="sendMessage">
                      <v-icon icon="mdi-arrow-up" />
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>

            <aside v-if="runnerPanelOpen" class="ai-runner-panel">
              <div class="ai-runner-head">
                <div>
                  <p class="ai-runner-title">{{ runnerTitle }}</p>
                </div>
                <div class="ai-runner-head-actions">
                  <v-btn size="x-small" color="primary" variant="tonal" class="text-none"
                    @click="runnerMode = 'web'">Web</v-btn>
                  <v-btn size="x-small" color="primary" variant="tonal" class="text-none"
                    @click="runnerMode = 'console'">Console</v-btn>
                  <v-btn size="small" variant="text" color="primary" icon="mdi-close" @click="closeRunnerPanel" />
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
.mindlytic-page {
  height: 100dvh;
  background: #ffffff;
  overflow: hidden;
}

.mindlytic-layout {
  height: 100%;
  display: flex;
  position: relative;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(13, 18, 34, 0.32);
  z-index: 12;
}

.chat-sidebar {
  width: 286px;
  min-width: 286px;
  max-width: 286px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 14px;
  position: relative;
  z-index: 14;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
}

.brand-logo-mark {
  flex: 0 0 auto;
}

.brand-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.brand-name {
  margin: 0;
  font-size: 1.18rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #000000;
  text-transform: lowercase;
}

.brand-subtitle {
  margin: 0;
  font-size: 0.72rem;
  color: #6b7692;
}

.sidebar-toggle-btn {
  display: none;
}

.new-chat-btn {
  --v-btn-height: 44px;
  width: 100%;
  font-weight: 600;
  min-height: 44px !important;
  height: 44px !important;
  border: 1px solid rgba(109, 126, 167, 0.22) !important;
  background: #ffffff !important;
  color: #2a3552 !important;
  box-shadow: none !important;
}

.history-wrap {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.history-title {
  margin: 6px 6px 8px;
  font-size: 0.72rem;
  color: #7a869f;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.history-empty {
  margin: 8px 6px;
  font-size: 0.86rem;
  color: #7a869f;
}

.history-error {
  margin: 0 6px 8px;
  font-size: 0.77rem;
  color: #a2374c;
  line-height: 1.45;
}

.history-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
}

.history-item {
  width: 100%;
  border: 1px solid rgba(114, 131, 168, 0.2);
  background: #ffffff;
  border-radius: 12px;
  padding: 9px 8px 9px 11px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  cursor: pointer;
}

.history-item-active {
  border-color: rgba(33, 93, 207, 0.62);
  background: rgba(228, 237, 255, 0.7);
}

.history-content {
  min-width: 0;
  flex: 1 1 auto;
}

.history-item-title {
  margin: 0;
  color: #1b253c;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-meta {
  margin: 3px 0 0;
  color: #77829d;
  font-size: 0.72rem;
}

.sidebar-footer {
  border-top: 1px solid rgba(114, 131, 168, 0.2);
  padding-top: 10px;
}

.user-profile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
}

.avatar-initial {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1f65d6;
}

.user-copy {
  min-width: 0;
}

.user-name {
  margin: 0;
  font-size: 0.8rem;
  color: #1b253c;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  margin: 0;
  font-size: 0.75rem;
  color: #6f7a93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-main {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fc;
  min-height: 0;
  overflow: hidden;
}

.chat-mobile-head {
  display: none;
}

.session-top-loader {
  flex: 0 0 auto;
}

.session-loader-spacer {
  flex: 1 1 auto;
}

.state-card {
  margin: auto;
  width: min(92%, 500px);
  border: 1px solid rgba(119, 136, 172, 0.26);
  background: linear-gradient(165deg, #ffffff 0%, #fbfdff 58%, #f6f9ff 100%);
  border-radius: 18px;
  padding: 18px 20px;
  text-align: center;
  box-shadow:
    0 12px 26px rgba(27, 44, 73, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.92) inset;
  position: relative;
  overflow: hidden;
}

.state-card::before {
  content: "";
  position: absolute;
  inset: 0 auto auto 50%;
  width: 300px;
  height: 140px;
  transform: translateX(-50%);
  background: radial-gradient(circle,
      rgba(126, 208, 255, 0.22) 0%,
      rgba(126, 208, 255, 0) 72%);
  pointer-events: none;
}

.state-card h2 {
  margin: 0;
  color: #1d2740;
  font-size: clamp(1.12rem, 1.7vw, 1.32rem);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.state-card p {
  margin: 8px 0 0;
  color: #5f6b88;
  font-size: 0.9rem;
  line-height: 1.4;
}

.state-card-auth {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 62vh;
  text-align: center;
  width: min(92%, 560px);
  padding: clamp(24px, 4vw, 40px);
  border: 1px solid rgba(114, 131, 168, 0.24);
  border-radius: 24px;
  background:
    radial-gradient(120px 100px at 50% 14%,
      rgba(107, 192, 255, 0.2),
      rgba(107, 192, 255, 0)),
    linear-gradient(155deg, #ffffff 0%, #f8fbff 55%, #f1f6ff 100%);
  box-shadow:
    0 16px 36px rgba(23, 40, 68, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.92) inset;
  position: relative;
  overflow: hidden;
}

.state-card-auth::before {
  display: none;
}

.auth-content {
  width: min(100%, 320px);
  margin: 0 auto;
  display: grid;
  justify-items: center;
  gap: 1.12rem;
}

.auth-header {
  margin: 0;
  display: grid;
  justify-items: center;
  gap: 14px;
}

.auth-logo {
  width: 72px;
  height: 72px;
  padding: 10px;
  border-radius: 50%;
  border: 1px solid rgba(123, 145, 189, 0.26);
  background: linear-gradient(170deg, #ffffff 0%, #f5f8ff 100%);
  box-shadow:
    0 10px 22px rgba(62, 93, 146, 0.16),
    0 1px 0 rgba(255, 255, 255, 0.94) inset;
  display: block;
  object-fit: contain;
}

.auth-title {
  font-family: "Space Grotesk", "Manrope", sans-serif;
  font-size: clamp(2rem, 4.2vw, 2.45rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.04;
  color: #12203d;
  margin: 0;
}

.google-auth-btn {
  width: 100%;
  max-width: 292px;
  margin: 0 auto;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  min-height: 50px;
  padding: 0.75rem 1.45rem;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.55) !important;
  box-shadow:
    0 10px 18px rgba(31, 105, 208, 0.22),
    0 2px 8px rgba(30, 122, 72, 0.2);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.google-auth-btn:hover {
  box-shadow:
    0 14px 24px rgba(31, 105, 208, 0.26),
    0 4px 10px rgba(30, 122, 72, 0.22);
  transform: translateY(-2px);
  filter: saturate(1.06);
}

.google-auth-btn:active {
  transform: translateY(0);
}

.workspace-shell {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.chat-workspace {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.workspace-shell-with-runner .chat-workspace {
  border-right: 1px solid rgba(114, 131, 168, 0.2);
}

.workspace-shell-with-runner .message-thread {
  width: min(100%, 820px);
}

.workspace-shell-with-runner .composer-panel {
  width: min(100%, 820px);
}

.chat-workspace-empty {
  justify-content: center;
}

.chat-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 32px clamp(14px, 3vw, 36px) 18px;
}

.chat-scroll-empty {
  overflow-y: hidden;
  flex: 0 0 auto;
  padding: 0 clamp(14px, 3vw, 36px);
}

.empty-state {
  width: min(100%, 760px);
  margin: 0 auto 20px;
  text-align: center;
}

.empty-title {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.2;
  color: #333333;
}

.empty-subtitle {
  margin: 8px 0 0;
  color: #666666;
  font-size: 0.9rem;
}

.message-thread {
  width: min(100%, 900px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
}

.message-row-user {
  justify-content: flex-end;
}

.message-row-ai {
  justify-content: flex-start;
}

.message-bubble {
  max-width: min(100%, 740px);
  border-radius: 16px;
  border: 1px solid #e9ecef;
  background: #ffffff;
  padding: 12px 14px;
}

.message-row-user .message-bubble {
  background: #e3f2fd;
  color: #000000;
  border-color: #bbdefb;
}

.message-bubble-error {
  border-color: rgba(209, 71, 90, 0.42);
  background: #fff3f5;
  color: #852737;
}

.message-bubble-thinking {
  background: #eef3ff;
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.62;
  font-size: 0.96rem;
}

.message-time {
  margin: 7px 0 0;
  font-size: 0.7rem;
  opacity: 0.72;
}

.markdown-body {
  font-size: 0.94rem;
  line-height: 1.62;
  color: #1f2a44;
}

.message-row-user .markdown-body {
  color: #ffffff;
}

.markdown-body :deep(:not(pre) > code) {
  display: inline;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: #0f766e;
  font-size: 0.88em;
  font-family:
    "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
    monospace;
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: underline;
  text-decoration-color: rgba(15, 118, 110, 0.34);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.message-row-user .markdown-body :deep(:not(pre) > code) {
  color: #eef6ff;
  text-decoration-color: rgba(238, 246, 255, 0.56);
}

.markdown-body :deep(.inline-code-runner) {
  border: 1px solid rgba(63, 91, 145, 0.42);
  border-radius: 14px;
  background: linear-gradient(180deg, #121b3a 0%, #0b1530 100%);
  margin: 10px 0;
  box-shadow: inset 0 1px 0 rgba(145, 182, 255, 0.09);
  overflow: hidden;
}

.markdown-body :deep(.inline-code-runner-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(126, 169, 255, 0.16);
}

.markdown-body :deep(.inline-code-lang) {
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  text-transform: lowercase;
  color: rgba(228, 239, 255, 0.92);
  font-weight: 600;
}

.markdown-body :deep(.inline-code-actions) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.markdown-body :deep(.code-runner-inline-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 3px 11px;
  border: 1px solid rgba(126, 169, 255, 0.4);
  border-radius: 999px;
  background: rgba(43, 87, 165, 0.4);
  color: #e8f2ff;
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.markdown-body :deep(.code-runner-inline-btn:hover) {
  background: rgba(56, 108, 198, 0.52);
  border-color: rgba(165, 198, 255, 0.52);
}

.markdown-body :deep(pre) {
  background: rgba(5, 15, 40, 0.82);
  color: #e7f2ff;
  border-radius: 0;
  margin: 0;
  padding: 12px 14px;
  overflow: auto;
  font-size: 0.85rem;
  line-height: 1.62;
  max-height: 360px;
}

.message-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 8px;
}

.composer-shell {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  padding: 10px clamp(10px, 2.2vw, 26px) calc(10px + env(safe-area-inset-bottom, 0px));
  background-color: transparent !important;
}

.composer-shell-floating {
  border-top: none;
  background: transparent !important;
}

.composer-panel {
  width: min(100%, 860px);
  max-width: 860px;
  margin: 0 auto;
  border: 1px solid #e9ecef;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 10px;
}

.composer-input {
  width: 100%;
}

.composer-input :deep(textarea) {
  max-height: 150px;
  min-height: 58px;
  line-height: 1.38;
  padding: 12px 2px 8px;
}

.composer-bottom-tools {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 40px;
}

.composer-model-select {
  flex: 0 0 270px;
  width: 270px;
  max-width: calc(100% - 50px);
  align-self: center;
}

.composer-model-select :deep(.v-field) {
  min-height: 34px !important;
  border-radius: 10px;
  background: transparent !important;
  border: 1px solid rgba(114, 131, 168, 0.28) !important;
  box-shadow: none !important;
}

.composer-model-select :deep(.v-field__input) {
  min-height: 34px !important;
  padding-top: 0;
  padding-bottom: 0;
  padding-inline: 8px 4px;
  font-size: 0.86rem;
}

.composer-model-select :deep(.v-select__selection-text) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.composer-model-select :deep(.v-field__outline) {
  opacity: 0;
}

:deep(.composer-model-menu) {
  border-radius: 14px !important;
  overflow: hidden !important;
  box-shadow: 0 14px 30px rgba(24, 36, 60, 0.2) !important;
}

:deep(.composer-model-menu .v-list) {
  padding: 6px !important;
  background: #ffffff;
}

:deep(.composer-model-menu .v-list-item) {
  min-height: 42px;
  border-radius: 10px;
  margin: 2px 0;
}

:deep(.composer-model-menu .v-list-item-title) {
  font-size: 0.94rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.composer-send {
  width: 40px;
  height: 40px;
  margin-left: auto;
}

.ai-runner-panel {
  flex: 0 0 clamp(360px, 33vw, 520px);
  width: clamp(360px, 33vw, 520px);
  min-width: 360px;
  max-width: 520px;
  background: linear-gradient(180deg, #f6f9ff 0%, #f1f6ff 100%);
  border-left: 1px solid rgba(114, 131, 168, 0.24);
  display: flex;
  gap: 0;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.ai-runner-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: 2px;
  padding: 9px 10px;
}

.ai-runner-title {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  color: #1f2e4e;
  line-height: 1.2;
}

.ai-runner-head-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.ai-runner-frame {
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  display: block;
  border: 1px solid rgba(105, 124, 166, 0.34);
  background: #ffffff;
  min-height: 0;
  box-shadow: 0 8px 16px rgba(18, 40, 80, 0.08);
}

@media (max-width: 1024px) {
  .workspace-shell {
    flex-direction: column;
  }

  .workspace-shell-with-runner .chat-workspace {
    border-right: none;
  }

  .ai-runner-panel {
    flex: 0 0 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    border-top: 1px solid rgba(114, 131, 168, 0.2);
    min-height: min(48dvh, 500px);
    max-height: 52dvh;
  }
}

@media (max-width: 980px) {
  .chat-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: 0 20px 40px rgba(20, 30, 52, 0.24);
  }

  .chat-sidebar-open {
    transform: translateX(0);
  }

  .chat-mobile-head {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(114, 131, 168, 0.2);
    background: #f4f6fc;
    padding: 0 8px;
  }

  .chat-mobile-title {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0 10px;
    color: #1a2440;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }

  .sidebar-toggle-btn {
    display: inline-flex;
  }
}

@media (max-width: 620px) {
  .state-card {
    border-radius: 14px;
    padding: 14px 12px;
  }

  .state-card-auth {
    min-height: min(62vh, 440px);
    width: calc(100% - 16px);
    padding: 24px 16px;
    border-radius: 18px;
  }

  .auth-content {
    width: min(100%, 290px);
    gap: 1rem;
  }

  .auth-logo {
    width: 66px;
    height: 66px;
    padding: 9px;
  }

  .google-auth-btn {
    width: 100%;
    max-width: 100%;
    margin-top: 2px;
  }

  .message-bubble {
    max-width: 100%;
  }

  .composer-shell {
    padding-inline: 8px;
  }

  .composer-panel {
    border-radius: 14px;
    gap: 7px;
    padding: 6px 8px 8px;
  }

  .composer-bottom-tools {
    align-items: center;
  }

  .composer-model-select {
    flex: 1 1 auto;
    width: auto;
    max-width: calc(100% - 50px);
  }

  .composer-send {
    width: 40px;
    height: 40px;
  }

  .ai-runner-head {
    flex-wrap: wrap;
  }

  .ai-runner-head-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
