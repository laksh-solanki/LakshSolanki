<template>
  <div class="chat-page-container">
    <!-- 1. Header Bar -->
    <v-toolbar flat class="bg-transparent d-flex justify-center align-center">
      <v-btn @click="goBack" variant="flat" icon="mdi-arrow-left" class="rounded-te rounded-ts rounded-bs"
        color="primary"></v-btn>
      <v-spacer></v-spacer>
      <v-btn variant="elevated" border rounded="lg" prepend-icon="mdi-plus" @click="resetChat">
        New Chat
      </v-btn>
    </v-toolbar>

    <!-- 2. Chat Messages Area -->
    <div ref="chatContainer" class="chat-messages-area" @click="handleChatClick">
      <div class="chat-messages-wrapper">
        <div v-for="msg in messages" :key="msg.id"
          :class="['d-flex w-100', msg.role === 'user' ? 'justify-end' : 'justify-start']">
          <div :class="['message-bubble border', msg.role === 'user' ? 'user-bubble' : 'model-bubble']">
            <div v-if="msg.role === 'model'" v-html="parseMessage(msg.text)" class="markdown-body"></div>
            <p v-else class="whitespace-pre-wrap">{{ msg.text }}</p>
          </div>
        </div>
        <!-- Loading indicator for model response -->
        <div v-if="loading" class="d-flex w-100 justify-start">
          <div class="message-bubble model-bubble d-flex align-center pa-3">
            <v-progress-circular indeterminate color="indigo-lighten-2" size="24" width="2"></v-progress-circular>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. User Input Area -->
    <div class="chat-input-area border">
      <div class="input-wrapper">
        <div class="input-field-container d-flex align-center justify-center border">
          <v-textarea v-model="userInput" placeholder="Ask me anything..." auto-grow rows="1" max-rows="5"
            variant="solo" flat hide-details bg-color="transparent" class="chat-textarea" rounded="lg"
            @keydown.enter.prevent="sendMessage"></v-textarea>
          <v-btn icon="mdi-send" variant="flat" :color="userInput.trim() ? 'indigo-accent-3' : 'indigo-lighten-1'"
            elevation="3" :loading="loading" :disabled="!userInput.trim()" @click="sendMessage"
            class="send-btn"></v-btn>
        </div>
        <p class="powered-by-text">
          Powered by Mindlyic Ai Studio
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
// Import the VS Code-like dark theme
import 'prismjs/themes/prism-tomorrow.css';
// Import languages you want to support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // for HTML
import 'prismjs/components/prism-bash';

let nextId = 0;
const goBack = () => window.history.back();
const userInput = ref('');
const loading = ref(false);
const messages = ref([
  { id: nextId++, role: 'model', text: 'Hello! How can I assist you today with the power of Mindly?' }
]);
const chatContainer = ref(null);

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderer = new marked.Renderer();

renderer.code = ({ text, lang }) => {
  const language = lang || 'plaintext';

  // Use Prism to highlight the code string
  const highlightedCode = Prism.highlight(
    text,
    Prism.languages[language] || Prism.languages.plaintext,
    language
  );

  return `
    <div class="code-block-wrapper">
      <div class="code-header">
        <span class="lang-label">${language}</span>
        <button class="copy-btn" aria-label="Copy code">
          <span class="copy-icon">Copy</span>
        </button>
      </div>
      <pre><code class="language-${language}">${highlightedCode}</code></pre>
    </div>
  `;
};

marked.use({ renderer });

const parseMessage = (rawText) => {
  // Parse markdown to HTML
  const html = marked.parse(rawText);
  // Sanitize, but ALLOW the specific classes and tags we just added
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['button'],
    ADD_ATTR: ['class', 'aria-label']
  });
};

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

  messages.value.push({ id: nextId++, role: 'user', text: prompt });
  userInput.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const model = genAI.getGenerativeModel(
      {
        model: "gemini-2.5-flash",
      },
    );
    const apiHistory = messages.value
      .filter((m, index) => !(index === 0 && m.role === 'model'))
      .slice(0, -1)
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

    const chat = model.startChat({ history: apiHistory });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    messages.value.push({ id: nextId++, role: 'model', text: text });
  }
  catch (error) {
    console.error("Gemini Error:", error);
    messages.value.push({ id: nextId++, role: 'model', text: "Sorry, I encountered an error: " + error.message });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

const resetChat = () => {
  messages.value = [{ id: nextId++, role: 'model', text: 'New session started. How can I help?' }];
};
</script>
<style>
.chat-page-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  /* Full viewport height minus header */
  background-color: #2b3351;
  /* slate-950 */
  overflow: hidden;
}

.chat-messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
}

.chat-messages-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 56rem;
  margin: 0 auto;
  width: 100%;
}

.message-bubble {
  max-width: 90%;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  line-height: 1.6;
  font-size: 0.95rem;
  word-wrap: break-word;
}

.user-bubble {
  background-color: #4f46e5;
  color: white;
  border-bottom-right-radius: 0;
}

.model-bubble {
  background-color: #202122;
  color: #e2e8f0;
  border-bottom-left-radius: 0;
}

.chat-input-area {
  flex-shrink: 0;
  padding: 1rem;
  background: transparent;
}

.input-wrapper {
  max-width: 56rem;
  margin: 0 auto;
}

.input-field-container {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  background-color: #202122;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  border-radius: 1.2rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.input-field-container:focus-within {
  border-color: #6366f1;
  /* indigo-500 */
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3), 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.chat-textarea .v-field__input {
  color: #e2e8f0;
}

.send-btn {
  transition: background-color 0.2s ease-in-out !important;
  border-radius: 12px 12px 12px 12px;
}

.powered-by-text {
  text-align: center;
  font-size: 0.625rem;
  color: #64748b;
  margin-top: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* --- MARKDOWN AND CODE STYLES --- */
.markdown-body {
  font-size: 1rem;
  line-height: 1.7;
}

.markdown-body p {
  margin-bottom: 1rem;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  color: white;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.5rem;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-body li {
  margin-bottom: 0.5rem;
}

.markdown-body p>code {
  background-color: #0f172a;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid #334155;
  color: #ffffff;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
}

/* Background and container for the code area */
.markdown-body pre[class*="language-"] {
  background: #1e1e1e !important;
  /* VS Code's Dark Background */
  margin: 0;
  padding: 1.5rem;
  border-radius: 0 0 8px 8px;
  font-family: 'Consolas', 'Monaco', 'Andale Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

/* Specific VS Code token colors */
.token.comment {
  color: #6a9955;
}

.token.keyword {
  color: #569cd6;
}

.token.string {
  color: #ce9178;
}

.token.function {
  color: #dcdcaa;
}

.token.boolean,
.token.number {
  color: #b5cea8;
}

.token.operator,
.token.punctuation {
  color: #d4d4d4;
}

.token.tag {
  color: #3688cb;
}

.token.attr-name {
  color: #9cdcfe;
}

.token.attr-value {
  color: #ce9178;
}

/* Custom Scrollbar for Code Blocks */
pre::-webkit-scrollbar {
  height: 8px;
}

pre::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

.code-block-wrapper {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid #334155;
  background-color: #0f172a;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1e293b;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #334155;
}

.lang-label {
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
}

.copy-btn {
  border: 1px solid;
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  padding: 4px 8px;
  border-radius: 6px;
}

.copy-btn:hover {
  background-color: #334155;
  color: white;
}

.copy-btn.copied {
  color: #4ade80;
  border-color: #4ade80;
}

.code-block-wrapper pre {
  margin: 0 !important;
  padding: 1rem;
  background-color: transparent !important;
  border: none !important;
  overflow-x: auto;
}

.code-block-wrapper code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
  color: #ffffff;
  background: none !important;
}
</style>
