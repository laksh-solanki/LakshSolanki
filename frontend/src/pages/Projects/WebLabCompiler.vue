<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Alerts from "@/components/Alerts.vue";

const STORAGE_KEY = "mindlytic_web_lab_v1";
const EXPORT_BASE_NAME = "mindlytic-web-lab";

const defaultTemplate = {
  id: "chart",
  label: "Bars + Data",
  html: `<section><h2>Revenue</h2><div id="bars"></div></section>`,
  css: `body{margin:0;padding:24px;font-family:Trebuchet MS,sans-serif;background:#f4faf8;color:#103832}section{max-width:640px;margin:0 auto;background:#fff;border:1px solid rgba(15,143,124,.16);border-radius:14px;padding:20px;box-shadow:0 16px 28px rgba(18,38,33,.06)}#bars{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;align-items:end;height:220px}#bars div{background:linear-gradient(180deg,#0f8f7c,#36bfa6);border-radius:8px 8px 4px 4px}`,
  js: `const bars=document.getElementById("bars");const values=[48,72,55,86,66,91,74];bars.innerHTML=values.map(v=>'<div style="height:'+v*2+'px" title="'+v+'"></div>').join("");console.info("rendered values",values);`,
};
const htmlCode = ref("");
const cssCode = ref("");
const jsCode = ref("");
const autoRun = ref(true);
const freezeNetwork = ref(false);
const srcdoc = ref("");
const running = ref(false);
const runCount = ref(0);
const lastRunMs = ref(0);
const editorLayoutRef = ref(null);
const isDesktopLayout = ref(typeof window !== "undefined" ? window.matchMedia("(min-width: 960px)").matches : true);
const panePercents = ref([33.34, 33.33, 33.33]);
const paneHeights = ref([420, 420, 420]);
const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");
const router = useRouter();

let prettierRuntimePromise = null;
const MIN_PANE_PERCENT = 15;
const MIN_PANE_HEIGHT_PX = 180;
let activeDividerIndex = -1;
let resizeIsDesktop = false;
let resizeStartPoint = 0;
let resizeLeftStart = 0;
let resizeRightStart = 0;

const syncEditorLayoutMode = () => {
  isDesktopLayout.value = window.matchMedia("(min-width: 960px)").matches;
};

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const safeScript = (value = "") => value.replace(/<\/script/gi, "<\\/script");

const buildPreviewDoc = () => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style id="user-css">${cssCode.value}</style>
<script>
(() => {
  if (${freezeNetwork.value ? "true" : "false"}) {
    window.fetch = () => Promise.reject(new Error("Network blocked by freeze mode"));
    const NativeXHR = XMLHttpRequest;
    window.XMLHttpRequest = function WrappedXHR() {
      const xhr = new NativeXHR();
      xhr.open = function blocked() { throw new Error("XHR blocked by freeze mode"); };
      return xhr;
    };
  }
})();
<\/script></head><body>${htmlCode.value}
<script>(()=>{try{${safeScript(jsCode.value)}}catch(e){console.error(e)}})();<\/script>
</body></html>`;

const compilePreview = (silent = false) => {
  const started = performance.now();
  running.value = true;
  srcdoc.value = buildPreviewDoc();
  runCount.value += 1;
  if (!silent) showAlert("Compiled preview.");
  setTimeout(() => {
    lastRunMs.value = Math.max(1, Math.round(performance.now() - started));
    running.value = false;
  }, 200);
};

const isDesktopEditorLayout = () => isDesktopLayout.value;

const paneStyle = (index) => {
  if (isDesktopEditorLayout()) {
    return {
      flex: `0 0 ${panePercents.value[index]}%`,
      maxWidth: `${panePercents.value[index]}%`,
    };
  }

  return {
    height: `${paneHeights.value[index]}px`,
  };
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getPointerPosition = (event, desktop) => {
  if (event?.touches?.length) {
    return desktop ? event.touches[0].clientX : event.touches[0].clientY;
  }
  if (event?.changedTouches?.length) {
    return desktop ? event.changedTouches[0].clientX : event.changedTouches[0].clientY;
  }
  return desktop ? event.clientX : event.clientY;
};

const stopPaneResize = () => {
  if (activeDividerIndex < 0) return;
  activeDividerIndex = -1;
  window.removeEventListener("pointermove", onPaneResizeMove);
  window.removeEventListener("pointerup", stopPaneResize);
  window.removeEventListener("pointercancel", stopPaneResize);
  window.removeEventListener("touchmove", onPaneResizeMove);
  window.removeEventListener("touchend", stopPaneResize);
  window.removeEventListener("touchcancel", stopPaneResize);
  document.body.classList.remove("editor-resizing");
};

const onPaneResizeMove = (event) => {
  if (activeDividerIndex < 0) return;
  if (event.cancelable) event.preventDefault();

  const pointer = getPointerPosition(event, resizeIsDesktop);
  const delta = pointer - resizeStartPoint;
  const pairTotal = resizeLeftStart + resizeRightStart;

  if (resizeIsDesktop) {
    const layout = editorLayoutRef.value;
    const width = layout?.getBoundingClientRect().width || 0;
    if (!width) return;

    const deltaPercent = (delta / width) * 100;
    const nextLeft = clamp(resizeLeftStart + deltaPercent, MIN_PANE_PERCENT, pairTotal - MIN_PANE_PERCENT);
    const nextRight = pairTotal - nextLeft;

    const next = [...panePercents.value];
    next[activeDividerIndex] = Number(nextLeft.toFixed(4));
    next[activeDividerIndex + 1] = Number(nextRight.toFixed(4));
    panePercents.value = next;
    return;
  }

  const nextLeft = clamp(resizeLeftStart + delta, MIN_PANE_HEIGHT_PX, pairTotal - MIN_PANE_HEIGHT_PX);
  const nextRight = pairTotal - nextLeft;
  const next = [...paneHeights.value];
  next[activeDividerIndex] = Math.round(nextLeft);
  next[activeDividerIndex + 1] = Math.round(nextRight);
  paneHeights.value = next;
};

const startPaneResize = (dividerIndex, event) => {
  activeDividerIndex = dividerIndex;
  resizeIsDesktop = isDesktopEditorLayout();
  resizeStartPoint = getPointerPosition(event, resizeIsDesktop);
  resizeLeftStart = resizeIsDesktop ? panePercents.value[dividerIndex] : paneHeights.value[dividerIndex];
  resizeRightStart = resizeIsDesktop ? panePercents.value[dividerIndex + 1] : paneHeights.value[dividerIndex + 1];

  document.body.classList.add("editor-resizing");
  window.addEventListener("pointermove", onPaneResizeMove);
  window.addEventListener("pointerup", stopPaneResize);
  window.addEventListener("pointercancel", stopPaneResize);
  window.addEventListener("touchmove", onPaneResizeMove, { passive: false });
  window.addEventListener("touchend", stopPaneResize);
  window.addEventListener("touchcancel", stopPaneResize);
};

const applyTemplate = () => {
  htmlCode.value = defaultTemplate.html;
  cssCode.value = defaultTemplate.css;
  jsCode.value = defaultTemplate.js;
  compilePreview(true);
};

const loadPrettierRuntime = async () => {
  if (!prettierRuntimePromise) {
    prettierRuntimePromise = Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
      import("prettier/plugins/postcss"),
      import("prettier/plugins/html"),
    ]).then(([standaloneMod, babelMod, estreeMod, postcssMod, htmlMod]) => {
      const prettier = standaloneMod.default || standaloneMod;
      const plugins = [
        babelMod.default || babelMod,
        estreeMod.default || estreeMod,
        postcssMod.default || postcssMod,
        htmlMod.default || htmlMod,
      ];
      return { prettier, plugins };
    });
  }

  return prettierRuntimePromise;
};

const formatWithPrettier = async (source, parser) => {
  const value = String(source || "").trim();
  if (!value) return "";

  const { prettier, plugins } = await loadPrettierRuntime();
  return prettier.format(value, {
    parser,
    plugins,
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    bracketSpacing: true,
  });
};

const normalizeCode = async () => {
  try {
    const [formattedHtml, formattedCss, formattedJs] = await Promise.all([
      formatWithPrettier(htmlCode.value, "html"),
      formatWithPrettier(cssCode.value, "css"),
      formatWithPrettier(jsCode.value, "babel"),
    ]);

    htmlCode.value = formattedHtml;
    cssCode.value = formattedCss;
    jsCode.value = formattedJs;
    showAlert("Code formatted with Prettier.");
  } catch (error) {
    console.error("Prettier format failed", error);
    showAlert(error?.message || "Unable to format code.", "error");
  }
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
  const doc = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssCode.value}</style></head><body>${htmlCode.value}<script>${safeScript(jsCode.value)}<\/script></body></html>`;
  downloadFile(doc, `${EXPORT_BASE_NAME}.html`, "text/html");
  showAlert("Runnable HTML exported.");
};

const exportCss = () => {
  downloadFile(cssCode.value, `${EXPORT_BASE_NAME}.css`, "text/css;charset=utf-8");
  showAlert("CSS exported.");
};

const exportJs = () => {
  downloadFile(jsCode.value, `${EXPORT_BASE_NAME}.js`, "text/javascript;charset=utf-8");
  showAlert("JavaScript exported.");
};

const persist = () => {
  const payload = {
    htmlCode: htmlCode.value,
    cssCode: cssCode.value,
    jsCode: jsCode.value,
    autoRun: autoRun.value,
    freezeNetwork: freezeNetwork.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

let timer = null;
watch([htmlCode, cssCode, jsCode, autoRun, freezeNetwork], () => {
  persist();
  if (!autoRun.value) return;
  clearTimeout(timer);
  timer = setTimeout(() => compilePreview(true), 600);
});

const goBack = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  router.replace({ name: "Projects" });
};

onMounted(() => {
  syncEditorLayoutMode();
  window.addEventListener("resize", syncEditorLayoutMode);
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      htmlCode.value = data.htmlCode || "";
      cssCode.value = data.cssCode || "";
      jsCode.value = data.jsCode || "";
      autoRun.value = typeof data.autoRun === "boolean" ? data.autoRun : autoRun.value;
      freezeNetwork.value = typeof data.freezeNetwork === "boolean" ? data.freezeNetwork : freezeNetwork.value;
      compilePreview(true);
      return;
    } catch {
    }
  }
  applyTemplate();
});

onUnmounted(() => {
  clearTimeout(timer);
  window.removeEventListener("resize", syncEditorLayoutMode);
  stopPaneResize();
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
        <p class="hero-subtitle mb-0">Unique stack: live compile + freeze mode + direct HTML/CSS/JS export.</p>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row class="ga-0">
        <v-col cols="12">
          <v-card class="tool-shell pa-5 pa-md-6 mb-6" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
              <div class="d-flex align-center flex-wrap ga-2">
                <v-btn variant="flat" color="primary" rounded="lg" class="text-none" :loading="running" prepend-icon="mdi-play" @click="compilePreview(false)">Compile</v-btn>
                <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-code-braces" @click="normalizeCode">Format Code</v-btn>
              </div>
              <div class="d-flex align-center flex-wrap ga-2">
                <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-file-code-outline" @click="exportHtml">Export HTML</v-btn>
                <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-language-css3" @click="exportCss">Export CSS</v-btn>
                <v-btn variant="tonal" color="primary" rounded="lg" class="text-none" prepend-icon="mdi-language-javascript" @click="exportJs">Export JS</v-btn>
              </div>
            </div>

            <div class="d-flex align-center flex-wrap ga-3 mb-4">
              <v-switch v-model="autoRun" hide-details color="primary" label="Auto compile"></v-switch>
              <v-switch v-model="freezeNetwork" hide-details color="warning" label="Freeze network calls"></v-switch>
            </div>

            <div ref="editorLayoutRef" class="editor-layout">
              <div class="editor-pane" :style="paneStyle(0)">
                <v-textarea v-model="htmlCode" label="HTML" rows="16" variant="solo-filled" rounded="lg" class="editor"></v-textarea>
              </div>
              <div class="editor-divider" role="separator" aria-orientation="vertical" title="Hold and pull to resize"
                @pointerdown.prevent="startPaneResize(0, $event)" @touchstart.prevent="startPaneResize(0, $event)"></div>
              <div class="editor-pane" :style="paneStyle(1)">
                <v-textarea v-model="cssCode" label="CSS" rows="16" variant="solo-filled" rounded="lg" class="editor"></v-textarea>
              </div>
              <div class="editor-divider" role="separator" aria-orientation="vertical" title="Hold and pull to resize"
                @pointerdown.prevent="startPaneResize(1, $event)" @touchstart.prevent="startPaneResize(1, $event)"></div>
              <div class="editor-pane" :style="paneStyle(2)">
                <v-textarea v-model="jsCode" label="JavaScript" rows="16" variant="solo-filled" rounded="lg" class="editor"></v-textarea>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="ga-0">
        <v-col cols="12">
          <v-card class="tool-shell pa-4 preview-bottom-card" rounded="xl" elevation="0">
            <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
              <h3 class="text-h6 font-weight-bold mb-0">Live Preview</h3>
              <v-chip size="small" variant="tonal" color="secondary">{{ runCount }} runs · {{ lastRunMs }} ms</v-chip>
            </div>
            <div class="preview-stage">
              <iframe :srcdoc="srcdoc" class="preview-frame" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>
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

.editor :deep(.v-field) {
  border: 1px solid rgba(19, 97, 86, 0.12);
  background: #f7fcfa;
}

.editor-layout {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}

.editor-pane {
  min-width: 0;
  height: 420px;
}

.editor-divider {
  display: none;
  position: relative;
  height: 14px;
  cursor: row-resize;
  touch-action: none;
  user-select: none;
  background: linear-gradient(90deg, rgba(13, 79, 66, 0.08), rgba(13, 79, 66, 0.04));
}

.editor-divider::before {
  content: "";
  position: absolute;
  top: 6px;
  left: 50%;
  width: 72px;
  height: 2px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: rgba(16, 88, 74, 0.46);
  transition: background 0.2s ease;
}

.editor-divider:hover::before {
  background: rgba(16, 88, 74, 0.82);
}

:global(body.editor-resizing) .editor-divider::before {
  background: rgba(16, 88, 74, 0.82);
}

.editor-pane :deep(.v-input),
.editor-pane :deep(.v-input__control),
.editor-pane :deep(.v-field),
.editor-pane :deep(.v-field__field),
.editor-pane :deep(.v-field__input) {
  height: 100%;
}

.editor-pane :deep(textarea) {
  height: 100% !important;
  overflow-y: auto !important;
  resize: none;
}

.preview-stage {
  border: 1px solid rgba(15, 143, 124, 0.14);
  border-radius: 14px;
  background: linear-gradient(180deg, #fcfeff, #eef5f2);
  padding: 16px;
  overflow: auto;
}

.preview-frame {
  width: 100%;
  height: 680px;
  border: 1px solid rgba(18, 38, 33, 0.08);
  border-radius: 12px;
  background: #ffffff;
  display: block;
}

.preview-bottom-card {
  margin-top: 4px;
}

@media (max-width: 960px) {
  .preview-frame {
    height: 520px;
  }
}

@media (max-width: 600px) {
  .preview-stage {
    padding: 10px;
  }

  .preview-frame {
    height: 420px;
  }
}

@media (min-width: 960px) {
  .editor-layout {
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  .editor-divider {
    display: block;
    position: relative;
    flex: 0 0 14px;
    width: 14px;
    height: auto;
    cursor: col-resize;
    background: linear-gradient(180deg, rgba(13, 79, 66, 0.08), rgba(13, 79, 66, 0.04));
  }

  .editor-divider::before {
    top: 50%;
    left: 6px;
    width: 2px;
    height: 72px;
    transform: translateY(-50%);
  }
}
</style>
