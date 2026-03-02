<script setup>
import { computed, ref } from "vue";
import Prism from "prismjs";
import Alerts from "@/components/Alerts.vue";

import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-json";

const sourceInput = ref("");
const compareInput = ref("");
const outputText = ref("");
const outputLanguage = ref("json");
const keySearch = ref("");
const comparedOnce = ref(false);
const sourceFileInput = ref(null);
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const diffState = ref({
  added: [],
  removed: [],
  changed: [],
});

const escapeHtml = (value = "") =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const tryParseJson = (text) => {
  const raw = text.trim();
  if (!raw) return { ok: false, error: "Input is empty.", value: null };

  try {
    return { ok: true, error: "", value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error: error?.message || "Invalid JSON.", value: null };
  }
};

const deepSortKeys = (value) => {
  if (Array.isArray(value)) return value.map(deepSortKeys);
  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, deepSortKeys(nested)]);
    return Object.fromEntries(sortedEntries);
  }
  return value;
};

const countKeys = (value) => {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countKeys(item), 0);
  if (value && typeof value === "object") {
    return Object.keys(value).length + Object.values(value).reduce((sum, nested) => sum + countKeys(nested), 0);
  }
  return 0;
};

const maxDepth = (value, depth = 1) => {
  if (Array.isArray(value)) {
    if (!value.length) return depth;
    return Math.max(...value.map((item) => maxDepth(item, depth + 1)));
  }
  if (value && typeof value === "object") {
    const children = Object.values(value);
    if (!children.length) return depth;
    return Math.max(...children.map((item) => maxDepth(item, depth + 1)));
  }
  return depth;
};

const valuePreview = (value) => {
  if (typeof value === "string") {
    return value.length > 52 ? `"${value.slice(0, 49)}..."` : `"${value}"`;
  }
  if (value === null) return "null";
  return JSON.stringify(value);
};

const collectPaths = (value, path = "$", output = []) => {
  if (Array.isArray(value)) {
    output.push({ path, type: "array", preview: `Array(${value.length})` });
    value.forEach((item, index) => {
      collectPaths(item, `${path}[${index}]`, output);
    });
    return output;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    output.push({ path, type: "object", preview: `Object(${keys.length})` });
    keys.forEach((key) => {
      collectPaths(value[key], `${path}.${key}`, output);
    });
    return output;
  }

  const type = value === null ? "null" : typeof value;
  output.push({ path, type, preview: valuePreview(value) });
  return output;
};

const flattenLeaves = (value, path = "$", output = {}) => {
  if (Array.isArray(value)) {
    if (!value.length) output[path] = [];
    value.forEach((item, index) => {
      flattenLeaves(item, `${path}[${index}]`, output);
    });
    return output;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (!keys.length) output[path] = {};
    keys.forEach((key) => {
      flattenLeaves(value[key], `${path}.${key}`, output);
    });
    return output;
  }

  output[path] = value;
  return output;
};

const buildDiffReport = ({ added, removed, changed }) => {
  const lines = [
    `Comparison Summary`,
    `Added: ${added.length}`,
    `Removed: ${removed.length}`,
    `Changed: ${changed.length}`,
    "",
  ];

  if (added.length) {
    lines.push("[Added]");
    added.forEach((item) => lines.push(`+ ${item.path}: ${valuePreview(item.after)}`));
    lines.push("");
  }

  if (removed.length) {
    lines.push("[Removed]");
    removed.forEach((item) => lines.push(`- ${item.path}: ${valuePreview(item.before)}`));
    lines.push("");
  }

  if (changed.length) {
    lines.push("[Changed]");
    changed.forEach((item) => lines.push(`~ ${item.path}: ${valuePreview(item.before)} -> ${valuePreview(item.after)}`));
  }

  return lines.join("\n");
};

const sourceResult = computed(() => tryParseJson(sourceInput.value));
const hasCompareInput = computed(() => Boolean(compareInput.value.trim()));
const compareResult = computed(() => (hasCompareInput.value ? tryParseJson(compareInput.value) : { ok: false, error: "", value: null }));

const sourceStats = computed(() => {
  const text = sourceInput.value;
  const lines = text ? text.split(/\r?\n/).length : 0;
  const chars = text.length;
  const bytes = new TextEncoder().encode(text).length;

  if (!sourceResult.value.ok) return { lines, chars, bytes, keys: 0, depth: 0 };

  return {
    lines,
    chars,
    bytes,
    keys: countKeys(sourceResult.value.value),
    depth: maxDepth(sourceResult.value.value),
  };
});

const sourcePaths = computed(() => {
  if (!sourceResult.value.ok) return [];
  return collectPaths(sourceResult.value.value);
});

const filteredPaths = computed(() => {
  const term = keySearch.value.trim().toLowerCase();
  if (!term) return sourcePaths.value;

  return sourcePaths.value.filter((item) => item.path.toLowerCase().includes(term) || item.type.toLowerCase().includes(term));
});

const sourceStatusLabel = computed(() => {
  if (!sourceInput.value.trim()) return "Empty";
  return sourceResult.value.ok ? "Valid" : "Invalid";
});

const compareStatusLabel = computed(() => {
  if (!compareInput.value.trim()) return "Optional";
  return compareResult.value.ok ? "Valid" : "Invalid";
});

const diffCount = computed(() => diffState.value.added.length + diffState.value.removed.length + diffState.value.changed.length);

const highlightedOutput = computed(() => {
  if (!outputText.value.trim()) return '<span class="empty-hint">Run an action to generate output preview.</span>';

  if (outputLanguage.value === "json") {
    const grammar = Prism.languages.json || Prism.languages.javascript;
    return Prism.highlight(outputText.value, grammar, "json");
  }

  return escapeHtml(outputText.value);
});

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const resetDiff = () => {
  diffState.value = { added: [], removed: [], changed: [] };
  comparedOnce.value = false;
};

const setJsonOutput = (value, spaces = 2) => {
  outputText.value = JSON.stringify(value, null, spaces);
  outputLanguage.value = "json";
};

const runValidate = () => {
  if (!sourceResult.value.ok) {
    showAlert(`Invalid JSON: ${sourceResult.value.error}`, "error");
    return;
  }
  setJsonOutput(sourceResult.value.value, 2);
  resetDiff();
  showAlert("JSON is valid and previewed.");
};

const runFormat = () => {
  if (!sourceResult.value.ok) {
    showAlert(`Cannot format: ${sourceResult.value.error}`, "error");
    return;
  }
  const formatted = JSON.stringify(sourceResult.value.value, null, 2);
  sourceInput.value = formatted;
  setJsonOutput(sourceResult.value.value, 2);
  resetDiff();
  showAlert("JSON formatted with 2-space indentation.");
};

const runMinify = () => {
  if (!sourceResult.value.ok) {
    showAlert(`Cannot minify: ${sourceResult.value.error}`, "error");
    return;
  }
  const minified = JSON.stringify(sourceResult.value.value);
  sourceInput.value = minified;
  outputText.value = minified;
  outputLanguage.value = "json";
  resetDiff();
  showAlert("JSON minified.");
};

const runSortKeys = () => {
  if (!sourceResult.value.ok) {
    showAlert(`Cannot sort keys: ${sourceResult.value.error}`, "error");
    return;
  }
  const sorted = deepSortKeys(sourceResult.value.value);
  sourceInput.value = JSON.stringify(sorted, null, 2);
  setJsonOutput(sorted, 2);
  resetDiff();
  showAlert("Keys sorted alphabetically at all levels.");
};

const runCompare = () => {
  if (!sourceResult.value.ok) {
    showAlert(`Source JSON is invalid: ${sourceResult.value.error}`, "error");
    return;
  }

  if (!hasCompareInput.value) {
    showAlert("Add compare JSON to run diff.", "error");
    return;
  }

  if (!compareResult.value.ok) {
    showAlert(`Compare JSON is invalid: ${compareResult.value.error}`, "error");
    return;
  }

  const left = flattenLeaves(sourceResult.value.value);
  const right = flattenLeaves(compareResult.value.value);
  const allPaths = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort((a, b) => a.localeCompare(b));
  const added = [];
  const removed = [];
  const changed = [];

  allPaths.forEach((path) => {
    const inLeft = Object.hasOwn(left, path);
    const inRight = Object.hasOwn(right, path);

    if (!inLeft && inRight) {
      added.push({ path, after: right[path] });
      return;
    }

    if (inLeft && !inRight) {
      removed.push({ path, before: left[path] });
      return;
    }

    if (JSON.stringify(left[path]) !== JSON.stringify(right[path])) {
      changed.push({ path, before: left[path], after: right[path] });
    }
  });

  diffState.value = { added, removed, changed };
  comparedOnce.value = true;
  outputText.value = buildDiffReport(diffState.value);
  outputLanguage.value = "text";
  showAlert("Comparison complete.");
};

const swapEditors = () => {
  const currentSource = sourceInput.value;
  sourceInput.value = compareInput.value;
  compareInput.value = currentSource;
  resetDiff();
  showAlert("Source and compare editors swapped.");
};

const loadSample = () => {
  sourceInput.value = JSON.stringify(
    {
      project: "Mindlytic",
      version: "1.0.0",
      enabled: true,
      metrics: {
        users: 2480,
        bounceRate: 0.31,
        tags: ["analytics", "ai", "tooling"],
      },
      integrations: [
        { name: "Gemini", active: true, retries: 2 },
        { name: "Email", active: false, retries: 0 },
      ],
    },
    null,
    2,
  );

  compareInput.value = JSON.stringify(
    {
      project: "Mindlytic",
      version: "1.1.0",
      enabled: true,
      metrics: {
        users: 3020,
        bounceRate: 0.27,
        tags: ["analytics", "ai", "tooling", "studio"],
      },
      integrations: [
        { name: "Gemini", active: true, retries: 1 },
        { name: "Email", active: true, retries: 1 },
        { name: "Webhook", active: true, retries: 3 },
      ],
      releaseDate: "2026-02-28",
    },
    null,
    2,
  );

  outputText.value = "";
  outputLanguage.value = "json";
  resetDiff();
  showAlert("Sample data loaded.");
};

const clearAll = () => {
  sourceInput.value = "";
  compareInput.value = "";
  outputText.value = "";
  outputLanguage.value = "json";
  keySearch.value = "";
  resetDiff();
  showAlert("Editors and output cleared.", "error");
};

const copyOutput = async () => {
  if (!outputText.value.trim()) {
    showAlert("Nothing to copy yet.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(outputText.value);
    showAlert("Output copied to clipboard.");
  } catch (error) {
    console.error("copy failed", error);
    showAlert("Clipboard permission denied.", "error");
  }
};

const downloadOutput = () => {
  if (!outputText.value.trim()) {
    showAlert("Nothing to download yet.", "error");
    return;
  }

  const extension = outputLanguage.value === "json" ? "json" : "txt";
  const type = outputLanguage.value === "json" ? "application/json" : "text/plain";
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const blob = new Blob([outputText.value], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `json-forge-output-${timestamp}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showAlert("Output downloaded.");
};

const triggerImport = () => sourceFileInput.value?.click();

const handleImport = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    sourceInput.value = text;
    showAlert(`Imported ${file.name}.`);
  } catch (error) {
    console.error("import failed", error);
    showAlert("Unable to read file.", "error");
  } finally {
    event.target.value = "";
  }
};

const goBack = () => window.history.back();
</script>

<template>
  <div class="forge-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn
            @click="goBack"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-arrow-left"
            rounded="xl"
            class="text-none"
          >
            Back
          </v-btn>
          <div class="hero-chip">Premium Project</div>
        </div>

        <v-row align="center" class="ga-0">
          <v-col cols="12" md="8" lg="7" class="pr-md-8">
            <h1 class="hero-title mb-3">JSON Forge Studio</h1>
            <p class="hero-subtitle mb-0">
              Validate, format, minify, sort, compare, import, export, and inspect JSON in one polished engineering workspace.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="5" class="mt-6 mt-md-0">
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">{{ sourceStats.keys }}</span>
                <span class="stat-label">Detected Keys</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ sourceStats.depth }}</span>
                <span class="stat-label">Max Depth</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ diffCount }}</span>
                <span class="stat-label">Diff Entries</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row class="ga-0" align="start">
        <v-col cols="12" lg="8" class="pr-lg-6 mb-8 mb-lg-0">
          <v-card class="tool-shell pa-5 pa-md-7 mb-6" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-5">
              <div>
                <p class="panel-kicker mb-1">Editors</p>
                <h2 class="text-h5 font-weight-bold mb-1">Source and compare JSON</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">Left is source JSON, right is optional compare JSON.</p>
              </div>
              <v-icon icon="mdi-code-json" color="primary" size="34"></v-icon>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="sourceInput"
                  label="Source JSON"
                  rows="12"
                  auto-grow
                  max-rows="20"
                  variant="solo-filled"
                  rounded="lg"
                  class="editor"
                  placeholder='{"name":"Mindlytic"}'
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="compareInput"
                  label="Compare JSON (optional)"
                  rows="12"
                  auto-grow
                  max-rows="20"
                  variant="solo-filled"
                  rounded="lg"
                  class="editor"
                  placeholder='{"name":"Mindlytic v2"}'
                ></v-textarea>
              </v-col>
            </v-row>

            <input
              ref="sourceFileInput"
              type="file"
              accept=".json,application/json,text/plain"
              class="d-none"
              @change="handleImport"
            />

            <div class="d-flex flex-wrap ga-2 mt-2">
              <v-btn variant="flat" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-check-decagram" @click="runValidate">
                Validate
              </v-btn>
              <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-format-indent-increase" @click="runFormat">
                Format
              </v-btn>
              <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-code-json" @click="runMinify">
                Minify
              </v-btn>
              <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-sort-alphabetical-ascending" @click="runSortKeys">
                Sort Keys
              </v-btn>
              <v-btn variant="flat" color="secondary" rounded="lg" class="text-none" prepend-icon="mdi-compare" @click="runCompare">
                Compare
              </v-btn>
              <v-btn variant="text" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-swap-horizontal" @click="swapEditors">
                Swap
              </v-btn>
              <v-btn variant="text" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-file-import-outline" @click="triggerImport">
                Import
              </v-btn>
              <v-btn variant="text" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-test-tube" @click="loadSample">
                Sample
              </v-btn>
              <v-btn variant="text" color="error" rounded="lg" class="text-none" prepend-icon="mdi-trash-can-outline" @click="clearAll">
                Clear
              </v-btn>
            </div>
          </v-card>

          <v-card class="tool-shell output-shell pa-5 pa-md-6" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
              <div>
                <p class="panel-kicker mb-1">Output</p>
                <h3 class="text-h6 font-weight-bold mb-0">Live result preview</h3>
              </div>
              <div class="d-flex align-center ga-2 flex-wrap">
                <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-content-copy" @click="copyOutput">
                  Copy
                </v-btn>
                <v-btn variant="flat" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-download" @click="downloadOutput">
                  Download
                </v-btn>
              </div>
            </div>

            <pre class="code-block" v-html="highlightedOutput"></pre>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Insights</p>
            <div class="status-grid">
              <div class="status-item">
                <span class="status-label">Source</span>
                <span :class="['status-value', sourceStatusLabel === 'Valid' ? 'is-good' : sourceStatusLabel === 'Invalid' ? 'is-bad' : '']">
                  {{ sourceStatusLabel }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Compare</span>
                <span :class="['status-value', compareStatusLabel === 'Valid' ? 'is-good' : compareStatusLabel === 'Invalid' ? 'is-bad' : '']">
                  {{ compareStatusLabel }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Lines</span>
                <span class="status-value">{{ sourceStats.lines }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Chars</span>
                <span class="status-value">{{ sourceStats.chars }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Payload</span>
                <span class="status-value">{{ sourceStats.bytes }} B</span>
              </div>
            </div>
          </v-card>

          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between ga-2 mb-2">
              <p class="panel-kicker mb-0">Key Explorer</p>
              <v-chip size="small" color="primary" variant="tonal">{{ filteredPaths.length }}</v-chip>
            </div>
            <v-text-field
              v-model.trim="keySearch"
              density="comfortable"
              variant="solo-filled"
              rounded="lg"
              prepend-inner-icon="mdi-magnify"
              placeholder="Filter paths..."
              hide-details
              class="mb-3"
            ></v-text-field>

            <div class="path-list">
              <article v-for="item in filteredPaths" :key="item.path + item.type" class="path-item">
                <div class="d-flex align-center justify-space-between ga-2 mb-1">
                  <code class="path-code">{{ item.path }}</code>
                  <v-chip size="x-small" variant="tonal" color="primary">{{ item.type }}</v-chip>
                </div>
                <p class="path-preview mb-0">{{ item.preview }}</p>
              </article>

              <p v-if="!filteredPaths.length" class="text-body-2 text-medium-emphasis mb-0">
                Add valid source JSON to inspect keys.
              </p>
            </div>
          </v-card>

          <v-card class="side-panel pa-5" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between ga-2 mb-2">
              <p class="panel-kicker mb-0">Diff Summary</p>
              <v-chip size="small" color="secondary" variant="tonal">{{ diffCount }}</v-chip>
            </div>

            <div v-if="comparedOnce" class="diff-columns">
              <section>
                <h4 class="diff-title">Added ({{ diffState.added.length }})</h4>
                <ul class="diff-list">
                  <li v-for="item in diffState.added.slice(0, 5)" :key="'a-' + item.path">+ {{ item.path }}</li>
                </ul>
              </section>
              <section>
                <h4 class="diff-title">Removed ({{ diffState.removed.length }})</h4>
                <ul class="diff-list">
                  <li v-for="item in diffState.removed.slice(0, 5)" :key="'r-' + item.path">- {{ item.path }}</li>
                </ul>
              </section>
              <section>
                <h4 class="diff-title">Changed ({{ diffState.changed.length }})</h4>
                <ul class="diff-list">
                  <li v-for="item in diffState.changed.slice(0, 5)" :key="'c-' + item.path">~ {{ item.path }}</li>
                </ul>
              </section>
            </div>

            <p v-else class="text-body-2 text-medium-emphasis mb-0">
              Run Compare to get added/removed/changed key paths.
            </p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.forge-page {
  position: relative;
  background:
    radial-gradient(circle at 0% 8%, rgba(26, 188, 156, 0.22), transparent 35%),
    radial-gradient(circle at 100% 18%, rgba(255, 165, 94, 0.2), transparent 34%),
    linear-gradient(180deg, #f7fcfb 0%, #eff6f4 100%);
}

.hero-shell {
  border-bottom: 1px solid rgba(11, 91, 80, 0.14);
  background:
    linear-gradient(145deg, rgba(248, 255, 253, 0.98), rgba(235, 247, 243, 0.95));
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  border: 1px solid rgba(13, 93, 82, 0.25);
  color: #0d5d52;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.75);
}

.hero-title {
  font-size: clamp(2rem, 3.3vw, 3.2rem);
  line-height: 1.06;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  color: #4e625f;
  line-height: 1.7;
  max-width: 58ch;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid rgba(13, 93, 82, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  text-align: center;
  padding: 12px 10px;
}

.stat-value {
  display: block;
  color: #0b302a;
  font-weight: 800;
  font-size: 1rem;
}

.stat-label {
  display: block;
  color: #607370;
  font-size: 0.72rem;
}

.tool-shell {
  border: 1px solid rgba(13, 93, 82, 0.17);
  background: linear-gradient(165deg, #ffffff 0%, #f4fbf8 100%);
  box-shadow: 0 18px 36px rgba(9, 34, 30, 0.08);
}

.panel-kicker {
  color: #0f6a5e;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.71rem;
  font-weight: 700;
}

.editor :deep(.v-field) {
  background: #f8fcfb;
  border: 1px solid rgba(13, 93, 82, 0.12);
}

.output-shell {
  position: relative;
}

.code-block {
  margin: 0;
  border-radius: 12px;
  border: 1px solid rgba(13, 93, 82, 0.16);
  background: #0d1117;
  color: #d7dee9;
  min-height: 260px;
  max-height: 620px;
  overflow: auto;
  padding: 16px;
  font-size: 0.86rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.code-block :deep(.empty-hint) {
  color: #90a2b6;
}

.side-panel {
  border: 1px solid rgba(13, 93, 82, 0.17);
  background:
    radial-gradient(circle at 95% 10%, rgba(255, 186, 125, 0.2), transparent 35%),
    linear-gradient(165deg, #ffffff 0%, #f3faf7 100%);
  box-shadow: 0 18px 36px rgba(9, 34, 30, 0.08);
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(13, 93, 82, 0.14);
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.84);
}

.status-label {
  color: #5f7370;
  font-size: 0.8rem;
}

.status-value {
  color: #183632;
  font-weight: 700;
  font-size: 0.83rem;
}

.status-value.is-good {
  color: #0f7a54;
}

.status-value.is-bad {
  color: #b3383c;
}

.path-list {
  display: grid;
  gap: 10px;
  max-height: 360px;
  overflow: auto;
}

.path-item {
  border: 1px solid rgba(13, 93, 82, 0.14);
  border-radius: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.84);
}

.path-code {
  color: #12443d;
  font-size: 0.78rem;
  font-family: "Cascadia Code", "Consolas", monospace;
}

.path-preview {
  color: #556a66;
  font-size: 0.82rem;
  word-break: break-word;
}

.diff-columns {
  display: grid;
  gap: 14px;
}

.diff-title {
  margin: 0 0 8px;
  color: #133b34;
  font-size: 0.87rem;
  font-weight: 700;
}

.diff-list {
  margin: 0;
  padding-left: 16px;
  color: #4f6561;
  font-size: 0.82rem;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .code-block {
    padding: 12px;
    font-size: 0.8rem;
  }

  .path-code {
    overflow-wrap: anywhere;
  }
}
</style>
