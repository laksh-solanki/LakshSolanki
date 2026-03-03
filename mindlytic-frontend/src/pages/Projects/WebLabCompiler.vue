<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Alerts from "@/components/Alerts.vue";

const STORAGE_KEY = "mindlytic_web_lab_v1";
const SOURCE_TAG = "mindlytic-weblab";

const templates = [
  {
    id: "landing",
    label: "Landing UI",
    html: `<main class="card"><h1>Web Lab</h1><p>Premium compiler demo.</p><button id="tap">Tap</button><div id="out">Ready</div></main>`,
    css: `body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Segoe UI,sans-serif;background:linear-gradient(150deg,#081916,#0f2f2a);color:#eaf8f4}.card{width:min(90vw,560px);padding:24px;border-radius:16px;border:1px solid rgba(160,244,229,.22);background:rgba(255,255,255,.05)}button{border:0;padding:10px 14px;border-radius:999px;background:#2ab39b;color:#07211d;font-weight:700;cursor:pointer}#out{margin-top:12px;color:#bde8de}`,
    js: `const b=document.getElementById("tap");const o=document.getElementById("out");let n=0;b.onclick=()=>{n++;o.textContent="Tapped "+n+" time(s)";console.log("tap",n)};`,
  },
  {
    id: "chart",
    label: "Bars + Data",
    html: `<section><h2>Revenue</h2><div id="bars"></div></section>`,
    css: `body{margin:0;padding:24px;font-family:Trebuchet MS,sans-serif;background:#f2fbf8;color:#103832}section{max-width:640px;margin:0 auto;background:#fff;border:1px solid rgba(19,97,86,.2);border-radius:14px;padding:20px}#bars{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;align-items:end;height:220px}#bars div{background:linear-gradient(180deg,#1bb39a,#138370);border-radius:8px 8px 4px 4px}`,
    js: `const bars=document.getElementById("bars");const values=[48,72,55,86,66,91,74];bars.innerHTML=values.map(v=>'<div style="height:'+v*2+'px" title="'+v+'"></div>').join("");console.info("rendered values",values);`,
  },
];

const selectedTemplate = ref(templates[0].id);
const htmlCode = ref("");
const cssCode = ref("");
const jsCode = ref("");
const autoRun = ref(true);
const freezeNetwork = ref(false);
const device = ref("desktop");
const srcdoc = ref("");
const runToken = ref("");
const running = ref(false);
const runCount = ref(0);
const lastRunMs = ref(0);
const logs = ref([]);
const snapshots = ref([]);
const snapshotTitle = ref("");
const exportName = ref("mindlytic-web-lab");
const importRef = ref(null);
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const router = useRouter();

const metrics = ref({
  domNodes: 0,
  cssCoverage: 0,
  a11yIssues: 0,
  mutations: 0,
});

const deviceWidths = {
  desktop: "100%",
  tablet: "820px",
  mobile: "390px",
};

const frameWidth = computed(() => deviceWidths[device.value] || "100%");
const errorCount = computed(() => logs.value.filter((l) => l.level === "error").length);
const warningCount = computed(() => logs.value.filter((l) => l.level === "warn").length);
const fingerprint = computed(() => {
  const input = `${htmlCode.value}\n${cssCode.value}\n${jsCode.value}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `WLAB-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
});

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const safeScript = (value = "") => value.replace(/<\/script/gi, "<\\/script");

const buildPreviewDoc = (token) => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style id="user-css">${cssCode.value}</style>
<script>
(() => {
  const post = (type, payload) => parent.postMessage({ source: "${SOURCE_TAG}", token: "${token}", type, payload }, "*");
  const asText = (x) => { try { return typeof x === "string" ? x : JSON.stringify(x); } catch { return String(x); } };
  ["log","info","warn","error"].forEach((level) => {
    const native = console[level];
    console[level] = (...args) => { post("log", { level, text: args.map(asText).join(" "), at: Date.now() }); native && native(...args); };
  });
  addEventListener("error", (e) => post("log", { level: "error", text: e.message, at: Date.now() }));
  addEventListener("unhandledrejection", (e) => post("log", { level: "error", text: "Unhandled: " + asText(e.reason), at: Date.now() }));
  if (${freezeNetwork.value ? "true" : "false"}) {
    window.fetch = () => Promise.reject(new Error("Network blocked by freeze mode"));
    const NativeXHR = XMLHttpRequest;
    window.XMLHttpRequest = function WrappedXHR() {
      const xhr = new NativeXHR();
      xhr.open = function blocked() { throw new Error("XHR blocked by freeze mode"); };
      return xhr;
    };
  }
  const mut = { count: 0 };
  const obs = new MutationObserver((r) => { mut.count += r.length; });
  obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
  const scan = () => {
    const css = document.getElementById("user-css")?.textContent || "";
    const selectors = css.split("}").map((x) => (x.split("{")[0] || "").trim()).filter((x) => x && !x.startsWith("@"));
    let matched = 0;
    selectors.forEach((s) => { try { if (document.querySelector(s.split(",")[0])) matched += 1; } catch {} });
    const a11y = [...document.querySelectorAll("img:not([alt]),button:empty,input:not([aria-label]),textarea:not([aria-label]),select:not([aria-label])")].length;
    post("metrics", {
      domNodes: document.querySelectorAll("*").length,
      cssCoverage: selectors.length ? Math.round((matched / selectors.length) * 100) : 0,
      a11yIssues: a11y,
      mutations: mut.count,
    });
  };
  addEventListener("load", () => {
    setTimeout(() => { scan(); post("ready", { ok: true }); }, 120);
    setTimeout(() => { obs.disconnect(); scan(); }, 2200);
  });
})();
<\/script></head><body>${htmlCode.value}
<script>(()=>{try{${safeScript(jsCode.value)}}catch(e){console.error(e)}})();<\/script>
</body></html>`;

const compilePreview = (silent = false) => {
  runToken.value = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const started = performance.now();
  logs.value = [];
  metrics.value = { domNodes: 0, cssCoverage: 0, a11yIssues: 0, mutations: 0 };
  running.value = true;
  srcdoc.value = buildPreviewDoc(runToken.value);
  runCount.value += 1;
  if (!silent) showAlert("Compiled preview.");
  const onReady = () => {
    lastRunMs.value = Math.max(1, Math.round(performance.now() - started));
  };
  setTimeout(onReady, 160);
};

const applyTemplate = (id) => {
  const t = templates.find((x) => x.id === id);
  if (!t) return;
  htmlCode.value = t.html;
  cssCode.value = t.css;
  jsCode.value = t.js;
  compilePreview(true);
};

const normalizeCode = () => {
  const clean = (v) =>
    v
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+$/g, ""))
      .join("\n")
      .trim();
  htmlCode.value = clean(htmlCode.value);
  cssCode.value = clean(cssCode.value);
  jsCode.value = clean(jsCode.value);
  showAlert("Code normalized.");
};

const captureSnapshot = () => {
  snapshots.value.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: snapshotTitle.value.trim() || `Run ${runCount.value || 1}`,
    createdAt: new Date().toISOString(),
    htmlCode: htmlCode.value,
    cssCode: cssCode.value,
    jsCode: jsCode.value,
    fingerprint: fingerprint.value,
  });
  snapshots.value = snapshots.value.slice(0, 12);
  snapshotTitle.value = "";
  showAlert("Snapshot saved.");
};

const restoreSnapshot = (snap) => {
  htmlCode.value = snap.htmlCode || "";
  cssCode.value = snap.cssCode || "";
  jsCode.value = snap.jsCode || "";
  compilePreview(true);
  showAlert(`Restored snapshot: ${snap.title}`);
};

const removeSnapshot = (id) => {
  snapshots.value = snapshots.value.filter((s) => s.id !== id);
  showAlert("Snapshot removed.", "error");
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportHtml = () => {
  const safe = (exportName.value.trim() || "mindlytic-web-lab").replace(/[^\w\-]+/g, "-");
  const doc = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssCode.value}</style></head><body>${htmlCode.value}<script>${safeScript(jsCode.value)}<\/script></body></html>`;
  downloadFile(doc, `${safe}.html`, "text/html");
  showAlert("Runnable HTML exported.");
};

const exportSession = () => {
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    selectedTemplate: selectedTemplate.value,
    htmlCode: htmlCode.value,
    cssCode: cssCode.value,
    jsCode: jsCode.value,
    autoRun: autoRun.value,
    freezeNetwork: freezeNetwork.value,
    device: device.value,
    snapshots: snapshots.value,
  };
  downloadFile(JSON.stringify(payload, null, 2), `weblab-session-${Date.now()}.json`, "application/json");
  showAlert("Session exported.");
};

const triggerImport = () => importRef.value?.click();

const importSession = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    htmlCode.value = data.htmlCode || "";
    cssCode.value = data.cssCode || "";
    jsCode.value = data.jsCode || "";
    autoRun.value = Boolean(data.autoRun);
    freezeNetwork.value = Boolean(data.freezeNetwork);
    if (deviceWidths[data.device]) device.value = data.device;
    if (Array.isArray(data.snapshots)) snapshots.value = data.snapshots.slice(0, 12);
    compilePreview(true);
    showAlert(`Imported session: ${file.name}`);
  } catch (error) {
    console.error(error);
    showAlert("Invalid session file.", "error");
  } finally {
    event.target.value = "";
  }
};

const copyFingerprint = async () => {
  try {
    await navigator.clipboard.writeText(fingerprint.value);
    showAlert("Fingerprint copied.");
  } catch {
    showAlert("Clipboard copy failed.", "error");
  }
};

const clearConsole = () => {
  logs.value = [];
  showAlert("Console cleared.", "error");
};

const onMessage = (event) => {
  const data = event.data;
  if (!data || data.source !== SOURCE_TAG || data.token !== runToken.value) return;
  if (data.type === "log") {
    logs.value.push({ level: data.payload?.level || "log", text: data.payload?.text || "", at: data.payload?.at || Date.now() });
    if (logs.value.length > 220) logs.value.splice(0, logs.value.length - 220);
  } else if (data.type === "metrics") {
    metrics.value = { ...metrics.value, ...(data.payload || {}) };
  } else if (data.type === "ready") {
    running.value = false;
  }
};

const persist = () => {
  const payload = {
    selectedTemplate: selectedTemplate.value,
    htmlCode: htmlCode.value,
    cssCode: cssCode.value,
    jsCode: jsCode.value,
    autoRun: autoRun.value,
    freezeNetwork: freezeNetwork.value,
    device: device.value,
    snapshots: snapshots.value,
    exportName: exportName.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

let timer = null;
watch([htmlCode, cssCode, jsCode, autoRun, freezeNetwork, device, snapshots, exportName], () => {
  persist();
  if (!autoRun.value) return;
  clearTimeout(timer);
  timer = setTimeout(() => compilePreview(true), 600);
});

watch(selectedTemplate, (id) => applyTemplate(id));

const goBack = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  router.replace({ name: "Projects" });
};

onMounted(() => {
  window.addEventListener("message", onMessage);
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      selectedTemplate.value = data.selectedTemplate || selectedTemplate.value;
      htmlCode.value = data.htmlCode || "";
      cssCode.value = data.cssCode || "";
      jsCode.value = data.jsCode || "";
      autoRun.value = typeof data.autoRun === "boolean" ? data.autoRun : autoRun.value;
      freezeNetwork.value = typeof data.freezeNetwork === "boolean" ? data.freezeNetwork : freezeNetwork.value;
      device.value = deviceWidths[data.device] ? data.device : device.value;
      snapshots.value = Array.isArray(data.snapshots) ? data.snapshots.slice(0, 12) : [];
      exportName.value = data.exportName || exportName.value;
      compilePreview(true);
      return;
    } catch {
    }
  }
  applyTemplate(selectedTemplate.value);
});

onUnmounted(() => {
  window.removeEventListener("message", onMessage);
  clearTimeout(timer);
});
</script>

<template>
  <div class="lab-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl" class="text-none">Back</v-btn>
          <div class="hero-chip">New Premium Project</div>
        </div>
        <h1 class="hero-title mb-2">HTML/CSS/JS Web Lab Compiler</h1>
        <p class="hero-subtitle mb-0">Unique stack: live compile + runtime analytics + freeze mode + time-capsule snapshots + session import/export.</p>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row class="ga-0" align="start">
        <v-col cols="12" lg="7" class="pr-lg-6 mb-8 mb-lg-0">
          <v-card class="tool-shell pa-5 pa-md-6 mb-6" rounded="xl" elevation="0">
            <v-row class="mb-2">
              <v-col cols="12" md="6">
                <v-select v-model="selectedTemplate" :items="templates" item-title="label" item-value="id" label="Template" variant="solo-filled" rounded="lg" hide-details></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="device" :items="[{id:'desktop',label:'Desktop'},{id:'tablet',label:'Tablet'},{id:'mobile',label:'Mobile'}]" item-title="label" item-value="id" label="Preview Device" variant="solo-filled" rounded="lg" hide-details></v-select>
              </v-col>
            </v-row>

            <div class="d-flex align-center flex-wrap ga-3 mb-3">
              <v-switch v-model="autoRun" hide-details color="primary" label="Auto compile"></v-switch>
              <v-switch v-model="freezeNetwork" hide-details color="warning" label="Freeze network calls"></v-switch>
              <v-chip size="small" color="primary" variant="tonal">{{ fingerprint }}</v-chip>
            </div>

            <v-tabs v-model="selectedTemplate" class="d-none"></v-tabs>
            <v-textarea v-model="htmlCode" label="HTML" rows="6" auto-grow variant="solo-filled" rounded="lg" class="editor mb-3"></v-textarea>
            <v-textarea v-model="cssCode" label="CSS" rows="6" auto-grow variant="solo-filled" rounded="lg" class="editor mb-3"></v-textarea>
            <v-textarea v-model="jsCode" label="JavaScript" rows="8" auto-grow variant="solo-filled" rounded="lg" class="editor"></v-textarea>

            <div class="d-flex flex-wrap ga-2 mt-4">
              <v-btn variant="flat" color="primary" rounded="lg" class="text-none" :loading="running" prepend-icon="mdi-play" @click="compilePreview(false)">Compile</v-btn>
              <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-format-align-left" @click="normalizeCode">Normalize</v-btn>
              <v-btn variant="text" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-camera" @click="captureSnapshot">Snapshot</v-btn>
            </div>
          </v-card>

          <v-card class="tool-shell pa-4" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between mb-3">
              <h3 class="text-h6 font-weight-bold mb-0">Live Preview</h3>
              <v-chip size="small" variant="tonal" color="secondary">{{ runCount }} runs · {{ lastRunMs }} ms</v-chip>
            </div>
            <div class="preview-stage">
              <iframe :srcdoc="srcdoc" class="preview-frame" :style="{ width: frameWidth }" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Compiler Analytics</p>
            <div class="metric-grid">
              <div class="metric-item"><span>DOM Nodes</span><strong>{{ metrics.domNodes }}</strong></div>
              <div class="metric-item"><span>CSS Coverage</span><strong>{{ metrics.cssCoverage }}%</strong></div>
              <div class="metric-item"><span>A11y Issues</span><strong>{{ metrics.a11yIssues }}</strong></div>
              <div class="metric-item"><span>Mutations</span><strong>{{ metrics.mutations }}</strong></div>
              <div class="metric-item"><span>Warnings</span><strong>{{ warningCount }}</strong></div>
              <div class="metric-item"><span>Errors</span><strong>{{ errorCount }}</strong></div>
            </div>
          </v-card>

          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between mb-2">
              <p class="panel-kicker mb-0">Runtime Console</p>
              <v-btn size="x-small" variant="text" color="error" class="text-none" @click="clearConsole">Clear</v-btn>
            </div>
            <div class="log-list">
              <article v-for="(log, i) in logs" :key="i" :class="['log-item', `log-${log.level}`]">
                <div class="log-meta"><span>{{ log.level.toUpperCase() }}</span><span>{{ new Date(log.at).toLocaleTimeString() }}</span></div>
                <p class="log-text mb-0">{{ log.text }}</p>
              </article>
              <p v-if="!logs.length" class="text-body-2 text-medium-emphasis mb-0">No logs yet.</p>
            </div>
          </v-card>

          <v-card class="side-panel pa-5 mb-6" rounded="xl" elevation="0">
            <p class="panel-kicker mb-2">Export + Session</p>
            <v-text-field v-model.trim="exportName" label="File name" variant="solo-filled" rounded="lg" hide-details class="mb-3"></v-text-field>
            <input ref="importRef" type="file" accept=".json,application/json" class="d-none" @change="importSession" />
            <div class="d-flex flex-wrap ga-2">
              <v-btn variant="flat" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-file-code-outline" @click="exportHtml">Export HTML</v-btn>
              <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-download-box-outline" @click="exportSession">Export Session</v-btn>
              <v-btn variant="text" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-upload-box-outline" @click="triggerImport">Import Session</v-btn>
              <v-btn variant="text" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-fingerprint" @click="copyFingerprint">Copy ID</v-btn>
            </div>
          </v-card>

          <v-card class="side-panel pa-5" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between mb-2">
              <p class="panel-kicker mb-0">Time Capsule</p>
              <v-chip size="small" color="secondary" variant="tonal">{{ snapshots.length }}</v-chip>
            </div>
            <v-text-field v-model.trim="snapshotTitle" label="Snapshot title" variant="solo-filled" rounded="lg" hide-details class="mb-3"></v-text-field>
            <div class="snapshot-list">
              <article v-for="snap in snapshots" :key="snap.id" class="snapshot-item">
                <div class="d-flex align-center justify-space-between ga-2">
                  <div>
                    <p class="snapshot-title mb-0">{{ snap.title }}</p>
                    <p class="snapshot-meta mb-0">{{ new Date(snap.createdAt).toLocaleString() }} · {{ snap.fingerprint }}</p>
                  </div>
                  <div class="d-flex align-center ga-1">
                    <v-btn icon="mdi-history" size="x-small" variant="tonal" color="primary" @click="restoreSnapshot(snap)"></v-btn>
                    <v-btn icon="mdi-delete-outline" size="x-small" variant="tonal" color="error" @click="removeSnapshot(snap.id)"></v-btn>
                  </div>
                </div>
              </article>
              <p v-if="!snapshots.length" class="text-body-2 text-medium-emphasis mb-0">Capture snapshots to preserve builds.</p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.lab-page {
  position: relative;
  background:
    radial-gradient(circle at 8% 2%, rgba(68, 203, 177, 0.2), transparent 29%),
    radial-gradient(circle at 96% 12%, rgba(255, 177, 100, 0.22), transparent 33%),
    linear-gradient(180deg, #f7fdfa 0%, #eef7f3 100%);
}

.hero-shell {
  border-bottom: 1px solid rgba(19, 97, 86, 0.14);
  background: linear-gradient(155deg, rgba(248, 255, 253, 0.97), rgba(233, 247, 241, 0.92));
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(19, 97, 86, 0.25);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f6559;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.74);
}

.hero-title {
  font-size: clamp(1.9rem, 3.5vw, 3rem);
  line-height: 1.06;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  color: #516562;
  max-width: 60ch;
  line-height: 1.7;
}

.tool-shell {
  border: 1px solid rgba(19, 97, 86, 0.17);
  background: linear-gradient(162deg, #ffffff 0%, #f4fbf8 100%);
  box-shadow: 0 17px 34px rgba(10, 36, 32, 0.08);
}

.side-panel {
  border: 1px solid rgba(19, 97, 86, 0.17);
  background:
    radial-gradient(circle at 91% 12%, rgba(255, 190, 125, 0.2), transparent 36%),
    linear-gradient(162deg, #ffffff 0%, #f4faf7 100%);
  box-shadow: 0 17px 34px rgba(10, 36, 32, 0.08);
}

.panel-kicker {
  color: #147264;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.71rem;
  font-weight: 700;
}

.editor :deep(.v-field) {
  border: 1px solid rgba(19, 97, 86, 0.12);
  background: #f7fcfa;
}

.preview-stage {
  border: 1px solid rgba(19, 97, 86, 0.17);
  border-radius: 14px;
  background: linear-gradient(180deg, #10231f, #0a1614);
  padding: 14px;
  overflow: auto;
}

.preview-frame {
  height: 530px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  background: #ffffff;
  display: block;
  margin: 0 auto;
}

.metric-grid {
  display: grid;
  gap: 10px;
}

.metric-item {
  border: 1px solid rgba(19, 97, 86, 0.14);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.82);
}

.log-list {
  max-height: 270px;
  overflow: auto;
  display: grid;
  gap: 10px;
}

.log-item {
  border: 1px solid rgba(19, 97, 86, 0.14);
  border-left-width: 4px;
  border-radius: 10px;
  padding: 9px 11px;
  background: rgba(255, 255, 255, 0.84);
}

.log-item.log-log {
  border-left-color: #2b7fd6;
}

.log-item.log-info {
  border-left-color: #2f9a86;
}

.log-item.log-warn {
  border-left-color: #cf8a1d;
}

.log-item.log-error {
  border-left-color: #c04549;
}

.log-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #5d716e;
  font-size: 0.7rem;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.log-text {
  color: #203f3a;
  font-size: 0.82rem;
  line-height: 1.42;
  white-space: pre-wrap;
}

.snapshot-list {
  max-height: 260px;
  overflow: auto;
  display: grid;
  gap: 10px;
}

.snapshot-item {
  border: 1px solid rgba(19, 97, 86, 0.14);
  border-radius: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.84);
}

.snapshot-title {
  color: #153d36;
  font-size: 0.86rem;
  font-weight: 700;
}

.snapshot-meta {
  color: #5d716e;
  font-size: 0.74rem;
}

@media (max-width: 960px) {
  .preview-frame {
    height: 440px;
  }
}

@media (max-width: 600px) {
  .preview-stage {
    padding: 10px;
  }

  .preview-frame {
    height: 360px;
  }

  .snapshot-meta {
    overflow-wrap: anywhere;
  }
}
</style>
