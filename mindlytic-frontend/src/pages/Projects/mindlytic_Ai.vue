<template>
  <v-container fluid class="flex flex-col max-h-[89vh] overflow-hidden bg-slate-950">
    <v-app-bar flat class="bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
      <v-app-bar-title class="text-transparent d-flex align-center justify-start">
        <mainsvgicon />
      </v-app-bar-title>
      <v-btn color="indigo" variant="tonal" prepend-icon="mdi-plus" @click="resetChat">
        New Chat
      </v-btn>
    </v-app-bar>
    <v-container class="grow overflow-y-auto text-wrap space-y-6 pt-20 max-h-[60vh] " id="chat-container"
      @click="handleChatClick" fluid>
      <div v-for="(msg, index) in messages" :key="index"
        :class="['flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start']">

        <div
          :class="['max-w-full pa-4 rounded-2xl shadow-xl overflow-hidden ma-2 ',
            msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none ' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700']">

          <div v-if="msg.role === 'model'" v-html="parseMessage(msg.text)" class="markdown-body text-m leading-relaxed">
          </div>

          <p v-else class="text-sm leading-relaxed whitespace-pre-wrap text-wrap">{{ msg.text }}</p>

        </div>
      </div>
    </v-container>

    <div class="shrink-0 pa-3 bg-linear-to-t from-slate-950 via-slate-950 to-transparent">
      <div
        class="max-w-4xl mx-auto flex items-end ga-3 bg-slate-800 pa-1 rounded-lg border border-slate-700 shadow-2xl">
        <v-textarea v-model="userInput" placeholder="Ask me anything..." auto-grow rows="1" max-rows="5"
          variant="outlined" hide-details class="text-slate-100" rounded="lg"
          @keydown.enter.prevent="sendMessage"></v-textarea>

        <v-btn icon="mdi-send" variant="flat" color="indigo-accent-3" elevation="0" :loading="loading"
          @click="sendMessage" class="rounded-lg"></v-btn>
      </div>
      <p class="text-center text-[10px] text-slate-500 mt-3 uppercase tracking-widest">
        Powered by Gemini 1.5 Flash
      </p>
    </div>
  </v-container>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'dompurify/dist/purify.min.js';
import mainsvgicon from '@/assets/mainsvgicon.vue';

const userInput = ref('');
const loading = ref(false);
const messages = ref([
  { role: 'model', text: 'Hello! How can I assist you today with the power of Gemini?' }
]);

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const scrollToBottom = async () => {
  await nextTick();
  const container = document.getElementById('chat-container');
  container.scrollTop = container.scrollHeight;
};

marked.setOptions({
  breaks: true, // Auto-convert line breaks to <br>
  gfm: true,    // GitHub Flavored Markdown
});

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderer = new marked.Renderer();

renderer.code = ({ text, lang }) => {
  const language = lang || 'plaintext';

  // ESCAPE THE TEXT HERE!
  const safeCode = escapeHtml(text);

  return `
    <div class="code-block-wrapper">
      <div class="code-header">
        <span class="lang-label">${language}</span>
        <button class="copy-btn" aria-label="Copy code">
          <span class="copy-icon">Copy</span>
        </button>
      </div>
      <pre><code class="language-${language}">${safeCode}</code></pre>
    </div>
  `;
};

marked.use({ renderer });

// --- 2. PARSE FUNCTION ---
const parseMessage = (rawText) => {
  // Parse markdown to HTML
  const html = marked.parse(rawText);
  // Sanitize, but ALLOW the specific classes and tags we just added
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['button'],
    ADD_ATTR: ['class', 'aria-label']
  });
};

// --- 3. COPY TO CLIPBOARD LOGIC (Event Delegation) ---
// We attach this to the parent Chat Container
const handleChatClick = async (event) => {
  // Check if the clicked element is our copy button
  const btn = event.target.closest('.copy-btn');
  if (!btn) return;

  // Find the code block associated with this button
  const wrapper = btn.closest('.code-block-wrapper');
  const codeElement = wrapper.querySelector('code');

  if (codeElement) {
    try {
      // Copy text to clipboard
      await navigator.clipboard.writeText(codeElement.innerText);

      // Visual Feedback: Change button text temporarily
      const originalContent = btn.innerHTML;
      btn.innerHTML = '<span class="copy-icon">Copied!</span>';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return;

  const prompt = userInput.value;

  // 1. Add the user message to the UI
  messages.value.push({ role: 'user', text: prompt });
  userInput.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    // 2. Prepare the history for the API
    // We filter out the initial "Welcome" message and ensure it starts with 'user'
    const apiHistory = messages.value
      .filter((m, index) => {
        // Skip the very first message if it's from the model
        if (index === 0 && m.role === 'model') return false;
        return true;
      })
      .slice(0, -1) // Exclude the current prompt we just added (it's sent via sendMessage)
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

    const chat = model.startChat({
      history: apiHistory,
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    messages.value.push({ role: 'model', text });
  } catch (error) {
    console.error("Gemini Error:", error);
    messages.value.push({ role: 'model', text: "Chat error: " + error.message });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const resetChat = () => {
  messages.value = [{ role: 'model', text: 'New session started. How can I help?' }];
};
</script>
<style>
/* --- PREMIUM CODE CONTAINER STYLES --- */

/* 1. The Container for the Code Block */
.markdown-body pre {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
  position: relative;
  box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.5);
}

/* 2. The Code Text Itself */
.markdown-body code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 15px;
  color: #a5b4fc;
  /* Indigo 300 */
}

/* 3. Inline Code (like `variable`) */
.markdown-body p code {
  background-color: #1e293b;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid #334155;
  color: #e2e8f0;
}

/* 4. Headings inside the response */
.markdown-body h3 {
  color: #ffffff;
  font-weight: 700;
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.markdown-body ul {
  list-style-type: disc;
  padding-left: 20px;
  margin-bottom: 10px;
}

.code-block-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  /* Ensures the header corners are rounded */
  border: 1px solid #334155;
  /* Slate 700 */
  background-color: #0f172a;
  /* Slate 900 */
}

/* --- HEADER BAR (Where the button lives) --- */
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1e293b;
  /* Slate 800 - slightly lighter than code bg */
  padding: 8px 16px;
  border-bottom: 1px solid #334155;
  font-family: sans-serif;
}

.lang-label {
  color: #94a3b8;
  /* Slate 400 */
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
}

/* --- THE COPY BUTTON --- */
.copy-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  /* Slate 300 */
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  padding: 4px 8px;
  border-radius: 4px;
}

.copy-btn:hover {
  background-color: #334155;
  /* Hover effect */
  color: white;
}

.copy-btn.copied {
  color: #4ade80;
  /* Green color when copied */
}

/* --- THE ACTUAL CODE AREA --- */
.code-block-wrapper pre {
  margin: 0 !important;
  /* Remove default margin to fit wrapper */
  padding: 16px;
  background-color: transparent !important;
  /* Let wrapper bg show through */
  border: none !important;
  overflow-x: auto;
}

.code-block-wrapper code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: #e2e8f0;
}
</style>
