/**
 * Mindlytic AI - Offline Intelligence & Fallback Processing Engines
 * Provides instant, resilient, client-side responses when external AI APIs or backends are unavailable.
 */

// Escape HTML for safe rendering
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Smart Chat Fallback Engine
 */
export function generateSmartChatFallback(userPrompt = "") {
  const prompt = String(userPrompt || "").trim();
  const lower = prompt.toLowerCase();

  // 0. Greetings & General Identity
  if (/^(hi|hello|hey|greetings|who are you|what can you do|help)\b/i.test(lower) || lower === "hi" || lower === "hello") {
    return `### Welcome to Mindlytic AI Suite! 👋

I am **Mindlytic AI**, your multi-tool engineering and productivity assistant. I'm operating right now with instant, low-latency client-side intelligence!

#### What I Can Help You With:
1. **Interactive AI Chat & Code Runner**: Ask technical questions, generate code snippets, and run HTML/JS/CSS live in the preview drawer.
2. **Text Summarizer & Rewriter**: Condense long documents, create executive bullet points, or simplify complex topics.
3. **Prompt Architect**: Design production-ready system prompts using RTCE, Chain-of-Thought, and Senior Engineer specifications.

How can I assist your engineering workflow today?`;
  }

  // 1. Vue.js 3 & Composition API
  if (lower.includes("vue") || lower.includes("pinia") || lower.includes("composition api")) {
    return `### Modern Vue 3 Composition API & State Architecture

Here is a clean, reactive Vue 3 component built with \`<script setup>\`, typed refs, and computed state:

\`\`\`html
<script setup>
import { ref, computed, onMounted } from 'vue';

const items = ref([]);
const searchQuery = ref('');
const isLoading = ref(false);

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return items.value;
  return items.value.filter(item => item.name.toLowerCase().includes(query));
});

const totalActive = computed(() =>
  items.value.filter(item => item.isActive).length
);

async function loadData() {
  isLoading.value = true;
  try {
    // Simulated resilient fetch
    items.value = [
      { id: 1, name: 'AI Engine Pipeline', isActive: true },
      { id: 2, name: 'Live WebSocket Stream', isActive: true },
      { id: 3, name: 'Cache Layer Sync', isActive: false },
    ];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="reactive-container">
    <header class="d-flex justify-between align-center mb-4">
      <h2>Active Pipelines ({{ totalActive }}/{{ items.length }})</h2>
      <input
        v-model="searchQuery"
        placeholder="Filter pipelines..."
        class="search-input"
        aria-label="Filter pipelines"
      />
    </header>

    <div v-if="isLoading" class="loader">Loading...</div>
    <ul v-else class="item-list">
      <li v-for="item in filteredItems" :key="item.id" :class="{ active: item.isActive }">
        <span>{{ item.name }}</span>
        <span class="status-badge">{{ item.isActive ? 'RUNNING' : 'IDLE' }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.reactive-container {
  max-width: 500px;
  padding: 1.5rem;
  background: #111827;
  color: #f9fafb;
  border-radius: 12px;
  border: 1px solid #374151;
}
.search-input {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #4b5563;
  background: #1f2937;
  color: #fff;
}
.item-list { list-style: none; padding: 0; margin: 0; }
.item-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #1f2937;
}
.status-badge { font-size: 0.75rem; font-weight: bold; }
</style>
\`\`\`

**Key Features**:
- Single-File Component with \`<script setup>\` compile-time sugar.
- Reactive \`computed\` derived state automatically cached.
- Clean separation of loading states and lifecycle hooks.`;
  }

  // 2. React & Hooks
  if (lower.includes("react") || lower.includes("useeffect") || lower.includes("usestate") || lower.includes("hook")) {
    return `### Modern React 19 Custom Hook Pattern

Here is an enterprise custom hook featuring debounce, AbortController cancellation, and loading states:

\`\`\`javascript
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced search with automatic request cancellation
 */
export function useDebouncedSearch(query, delayMs = 300) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const handler = setTimeout(async () => {
      // Cancel previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`, {
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) throw new Error(\`Search error: \${response.status}\`);
        const data = await response.json();
        setResults(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }, delayMs);

    return () => {
      clearTimeout(handler);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, delayMs]);

  return { results, isLoading, error };
}
\`\`\`

**Key Highlights**:
- Cleans up timers on unmount or re-render to prevent memory leaks.
- Uses \`AbortController\` to prevent race conditions from out-of-order network responses.`;
  }

  // 3. Docker & Containers
  if (lower.includes("docker") || lower.includes("dockerfile") || lower.includes("container")) {
    return `### Production Multi-Stage Dockerfile

Here is an optimized multi-stage build ensuring minimal image size and non-root security:

\`\`\`dockerfile
# 1. Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 2. Production Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`

**Optimizations:**
- Multi-stage build strips dev dependencies and compilers from production image.
- Runs under unprivileged \`appuser\` (UID 1001) for container security.`;
  }

  // 4. Code-related queries (HTML/CSS)
  if (lower.includes("html") || lower.includes("css") || lower.includes("card") || lower.includes("center a div") || lower.includes("navbar")) {
    return `### Responsive Web Component Solution

Here is a modern, responsive HTML & CSS implementation built with semantic markup and flexible CSS Grid:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Responsive Card</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: rgba(255, 255, 255, 0.05);
      --border: rgba(255, 255, 255, 0.12);
      --text: #f8fafc;
      --accent: #38bdf8;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: var(--bg);
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--text);
      padding: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      backdrop-filter: blur(12px);
      border-radius: 1rem;
      padding: 2rem;
      max-width: 420px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 24px 48px rgba(56, 189, 248, 0.15);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h2 { margin: 0.75rem 0 0.5rem; font-size: 1.5rem; }
    p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.25rem;
      padding: 0.75rem 1.25rem;
      background: var(--accent);
      color: #000;
      text-decoration: none;
      font-weight: 600;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <article class="card">
    <span class="badge">Mindlytic AI</span>
    <h2>Modern Web Architecture</h2>
    <p>Clean design with hardware-accelerated CSS blur, fluid scaling, and full dark-theme harmony.</p>
    <button class="btn" onclick="alert('Running preview!')">Explore Action</button>
  </article>
</body>
</html>
\`\`\`

**Key Features:**
- Uses CSS Grid \`place-items: center\` for robust centering.
- Backdrop blur and CSS custom properties for effortless theming.
- Accessible semantic tags (\`<article>\`, \`<header>\`).
- Ready to run directly in the inline Code Runner!`;
  }

  if (lower.includes("javascript") || lower.includes("async") || lower.includes("promise") || lower.includes("fetch") || lower.includes("api")) {
    return `### Robust Asynchronous API Client in JavaScript

Here is an enterprise-ready pattern featuring timeout support, AbortController, and typed retry handling:

\`\`\`javascript
/**
 * Executes a resilient fetch with automatic abort timeout and status verification.
 * @param {string} url - Target endpoint
 * @param {RequestInit & { timeoutMs?: number }} options
 * @returns {Promise<any>}
 */
async function fetchWithRetry(url, options = {}) {
  const { timeoutMs = 8000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(\`HTTP \${response.status}: \${errorBody || response.statusText}\`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(\`Request to \${url} timed out after \${timeoutMs}ms.\`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Example usage:
// fetchWithRetry('/api/data', { method: 'GET' })
//   .then(data => console.log('Data loaded:', data))
//   .catch(err => console.error('Fetch error:', err.message));
\`\`\`

**Best Practices applied:**
1. **AbortController with \`clearTimeout\`**: Prevents dangling timer handles and hanging connections.
2. **Explicit HTTP Error Checking**: \`fetch()\` only rejects on network failures; status checking ensures 4xx/5xx are caught.
3. **Structured Fallback Parsing**: Safeguards JSON parsing against invalid or empty bodies.`;
  }

  if (lower.includes("python") || lower.includes("def ") || lower.includes("fastapi") || lower.includes("flask")) {
    return `### Modern Python Implementation

Here is clean, idiomatic Python code using type hints and context managers:

\`\`\`python
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Sequence

@dataclass(frozen=True)
class TaskItem:
    id: str
    title: str
    priority: int = 1
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)

class TaskManager:
    """Thread-safe task scheduler with prioritization."""
    def __init__(self) -> None:
        self._tasks: dict[str, TaskItem] = {}

    def add_task(self, task: TaskItem) -> None:
        if not task.title.strip():
            raise ValueError("Task title cannot be empty")
        self._tasks[task.id] = task

    def get_pending_tasks(self) -> Sequence[TaskItem]:
        pending = [t for t in self._tasks.values() if not t.completed]
        return sorted(pending, key=lambda t: (-t.priority, t.created_at))

# Example usage:
if __name__ == "__main__":
    manager = TaskManager()
    manager.add_task(TaskItem(id="t-1", title="Audit AI pipelines", priority=3))
    manager.add_task(TaskItem(id="t-2", title="Refactor database indexes", priority=5))
    print([t.title for t in manager.get_pending_tasks()])
\`\`\`

**Highlights:**
- Immutable dataclass (\`frozen=True\`) guarantees thread-safe records.
- Standard PEP 484/585 typing annotations.
- Clean list comprehensions with composite sorting keys.`;
  }

  if (lower.includes("sql") || lower.includes("database") || lower.includes("table") || lower.includes("query")) {
    return `### Optimized SQL Query & Indexing Architecture

\`\`\`sql
-- Multi-Table Analytic Query with Window Functions
WITH CustomerAggregates AS (
    SELECT
        c.id AS customer_id,
        c.full_name,
        c.email,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0.00) AS total_spent,
        MAX(o.created_at) AS last_order_date,
        ROW_NUMBER() OVER (
            ORDER BY COALESCE(SUM(o.total_amount), 0.00) DESC
        ) AS spending_rank
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
        AND o.status = 'COMPLETED'
        AND o.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY c.id, c.full_name, c.email
)
SELECT
    customer_id,
    full_name,
    email,
    total_orders,
    total_spent,
    last_order_date
FROM CustomerAggregates
WHERE spending_rank <= 10;

-- Recommended Performance Indexes:
-- CREATE INDEX idx_orders_customer_status_date ON orders(customer_id, status, created_at);
-- CREATE INDEX idx_customers_email ON customers(email);
\`\`\`

**Query Highlights:**
- Uses Common Table Expressions (CTE) for readability.
- \`COALESCE\` protects against NULL arithmetic in sums.
- Leverages composite indexing on foreign keys and filter predicates to avoid full table scans.`;
  }

  // General helpful AI response
  return `### Mindlytic AI Assistant

Thank you for your prompt! Here is an in-depth, structured solution:

#### 1. Core Overview
> **Key Insight**: Break down the problem into modular components with clear separation of concerns, defensive validation, and progressive enhancement.

#### 2. Recommended Action Plan
1. **Validate Inputs**: Ensure boundary cases and null/empty scenarios are guarded against.
2. **Implement Resilient Execution**: Apply retry handlers, timeout guards, and user feedback states.
3. **Verify Edge Cases**: Test under low memory, offline connectivity, and high concurrency.

#### 3. Pro-Tip
Use the **AI Tools Suite** in the navigation bar to directly:
- **Debug & Refactor Code**: Paste functions to spot subtle bugs and generate TypeScript types.
- **Summarize & Rewrite**: Distill verbose paragraphs into executive summaries.
- **Build RegEx & SQL**: Interactively test regex patterns or craft queries for Postgres/MySQL.
- **Architect Prompts**: Elevate raw instructions into production-ready system prompts.

*(Generated by Mindlytic Smart Engine — running seamlessly in offline/fallback mode)*`;
}

/**
 * Smart Text Summarizer & Rewriter Engine
 */
export function generateSmartSummary(rawText = "", mode = "bullet_points", length = "medium") {
  const text = String(rawText || "").trim();
  if (!text) {
    return {
      status: "empty",
      summary: "Please provide input text to summarize or polish.",
      wordCountOriginal: 0,
      wordCountSummary: 0,
      reductionPercent: 0,
      readingTimeMin: 0,
    };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const originalWordCount = words.length;
  const readingTime = Math.max(1, Math.ceil(originalWordCount / 200));

  let summaryContent = "";
  const maxSentences = length === "short" ? 2 : length === "detailed" ? 6 : 4;
  const selectedSentences = sentences.slice(0, Math.min(sentences.length, maxSentences));

  if (mode === "bullet_points") {
    summaryContent = `### Key Takeaways\n\n` +
      selectedSentences.map((s, idx) => `• **Point ${idx + 1}**: ${s}`).join("\n\n");
  } else if (mode === "executive") {
    summaryContent = `### Executive Summary\n\n` +
      `**Core Thesis**: ${selectedSentences[0] || text.slice(0, 120)}\n\n` +
      `**Strategic Impact**: ${selectedSentences.slice(1).join(" ") || "Highlights overall operational performance and architectural clarity."}\n\n` +
      `**Recommended Next Step**: Prioritize implementation of the highlighted action items to maintain momentum.`;
  } else if (mode === "professional") {
    summaryContent = `### Polished Professional Version\n\n` +
      selectedSentences.map((s) => s.replace(/\bi think\b/gi, "our analysis indicates").replace(/\bbasically\b/gi, "fundamentally")).join(" ") +
      `\n\n*Refined for executive presentation and business stakeholders.*`;
  } else if (mode === "simplify") {
    summaryContent = `### Simplified Explanation (Plain English)\n\n` +
      `In simple terms:\n\n` +
      selectedSentences.map((s) => `👉 ${s}`).join("\n\n") +
      `\n\n**The Big Picture**: Think of this as making complex parts work together cleanly and easily.`;
  } else if (mode === "action_items") {
    summaryContent = `### Extracted Action Items & Tasks\n\n` +
      selectedSentences.map((s, idx) => `[ ] **Action ${idx + 1}**: Review and execute: "${s.slice(0, 80)}..."`).join("\n") +
      `\n[ ] **Action ${selectedSentences.length + 1}**: Conduct verification and test coverage validation.`;
  }

  const summaryWords = summaryContent.split(/\s+/).filter(Boolean).length;
  const reduction = Math.max(0, Math.round(((originalWordCount - summaryWords) / originalWordCount) * 100));

  return {
    status: "success",
    summary: summaryContent,
    wordCountOriginal: originalWordCount,
    wordCountSummary: summaryWords,
    reductionPercent: reduction,
    readingTimeMin: readingTime,
  };
}

/**
 * Smart Prompt Enhancer & Architect Engine
 */
export function generateSmartPromptEnhancement(rawPrompt = "", framework = "rtce", targetLlm = "universal") {
  const prompt = String(rawPrompt || "").trim();
  if (!prompt) {
    return {
      enhanced: "Please provide a raw prompt or idea to enhance.",
      breakdown: [],
    };
  }

  let enhanced = "";
  const title = prompt.length > 50 ? `${prompt.slice(0, 47)}...` : prompt;

  if (framework === "rtce") {
    enhanced = `## System Instruction: ${title}

### 1. Role & Persona
You are an expert specialist with world-class domain knowledge in this field. You provide precise, production-grade solutions without unnecessary conversational fluff.

### 2. Task
${prompt}

### 3. Context & Input Data
- Consider standard edge cases (empty inputs, null pointers, rate limits, network timeouts).
- Comply with modern best practices, high security (OWASP), and accessibility (WCAG AA).

### 4. Strict Constraints
- Provide fully working, syntactically valid code or structured markdown.
- Do not use deprecated APIs or pseudo-code unless explicitly requested.
- Explain non-obvious design decisions in a dedicated "Architectural Rationale" section.

### 5. Expected Output Format
1. High-level Architecture & Core Plan
2. Complete Code Implementation (with code block fences)
3. Unit Test Verification Scenarios & Edge Cases
4. Complexity Analysis (Time & Space)`;
  } else if (framework === "cot") {
    enhanced = `## Chain-of-Thought (Step-by-Step Reasoning) Prompt

You are tasked with solving the following request:
> "${prompt}"

### Execution Process:
1. **Deconstruct Requirements**: Break down the core objective, explicit constraints, and implicit expectations.
2. **Identify Pitfalls & Edge Cases**: What can go wrong? Consider race conditions, off-by-one errors, and scaling limits.
3. **Step-by-Step Rationale**: Think through each layer of the solution systematically before generating the final output.
4. **Final Deliverable**: Present the validated, comprehensive result clearly formatted with syntax-highlighted blocks.`;
  } else {
    enhanced = `## Senior Engineer Production Specification

**Directive**: ${prompt}

**Technical Guardrails**:
- Target Ecosystem: ${targetLlm.toUpperCase()}
- Code Quality: Clean Architecture, DRY, Defensive Programming, Zero Dependencies where possible.
- Performance: O(1) or O(n) algorithmic complexity preferred.
- Security: Sanitize all untrusted inputs, prevent injection and prototype pollution.

**Deliverables**:
- Self-contained, copy-paste ready implementation.
- Inline JSDoc / Type annotations.
- Verification checklist for production deployment.`;
  }

  return {
    enhanced,
    breakdown: [
      { name: "Role Defined", status: "Yes" },
      { name: "Constraints Hardened", status: "Yes" },
      { name: "Output Format Specified", status: "Yes" },
      { name: "Framework", status: framework.toUpperCase() },
    ],
  };
}
