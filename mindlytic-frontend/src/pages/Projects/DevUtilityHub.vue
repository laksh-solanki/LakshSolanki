<script setup>
import { computed, ref } from "vue";
import Alerts from "@/components/Alerts.vue";

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const textSource = ref("");
const textResult = ref("");

const encodingInput = ref("");
const encodingOutput = ref("");

const uuidValue = ref("");
const passwordValue = ref("");
const passwordLength = ref(18);
const includeUpper = ref(true);
const includeLower = ref(true);
const includeNumbers = ref(true);
const includeSymbols = ref(true);

const symbolSet = "!@#$%^&*()_+-=[]{}|;:,.<>?";

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => window.history.back();

const splitWords = (value = "") =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

const capitalize = (word = "") => (word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : "");

const textTransformers = {
  upper: (value) => value.toUpperCase(),
  lower: (value) => value.toLowerCase(),
  title: (value) => splitWords(value).map(capitalize).join(" "),
  camel: (value) => {
    const words = splitWords(value).map((word) => word.toLowerCase());
    return words.map((word, index) => (index === 0 ? word : capitalize(word))).join("");
  },
  snake: (value) => splitWords(value).map((word) => word.toLowerCase()).join("_"),
  kebab: (value) => splitWords(value).map((word) => word.toLowerCase()).join("-"),
};

const applyTextTransform = (mode) => {
  const input = textSource.value;
  if (!input.trim()) {
    showAlert("Enter text before running a transform.", "error");
    return;
  }

  const transformer = textTransformers[mode];
  textResult.value = transformer ? transformer(input) : input;
};

const clearTextTool = () => {
  textSource.value = "";
  textResult.value = "";
};

const toBase64Utf8 = (value = "") => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64Utf8 = (value = "") => {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const encodeUrl = () => {
  if (!encodingInput.value.trim()) {
    showAlert("Enter text before URL encoding.", "error");
    return;
  }

  encodingOutput.value = encodeURIComponent(encodingInput.value);
};

const decodeUrl = () => {
  if (!encodingInput.value.trim()) {
    showAlert("Enter text before URL decoding.", "error");
    return;
  }

  try {
    encodingOutput.value = decodeURIComponent(encodingInput.value);
  } catch (_error) {
    showAlert("Invalid URL-encoded text.", "error");
  }
};

const encodeBase64 = () => {
  if (!encodingInput.value) {
    showAlert("Enter text before Base64 encoding.", "error");
    return;
  }

  encodingOutput.value = toBase64Utf8(encodingInput.value);
};

const decodeBase64 = () => {
  if (!encodingInput.value.trim()) {
    showAlert("Enter text before Base64 decoding.", "error");
    return;
  }

  try {
    encodingOutput.value = fromBase64Utf8(encodingInput.value.trim());
  } catch (_error) {
    showAlert("Invalid Base64 text.", "error");
  }
};

const clearEncodingTool = () => {
  encodingInput.value = "";
  encodingOutput.value = "";
};

const copyToClipboard = async (value, label) => {
  if (!value) {
    showAlert(`Nothing to copy from ${label}.`, "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    showAlert(`${label} copied.`);
  } catch (_error) {
    showAlert("Clipboard write failed in this browser.", "error");
  }
};

const supportsSecureRandom = () =>
  typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function";

const randomIndex = (max) => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
};

const selectedPasswordGroups = computed(() => {
  const groups = [];
  if (includeUpper.value) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (includeLower.value) groups.push("abcdefghijklmnopqrstuvwxyz");
  if (includeNumbers.value) groups.push("0123456789");
  if (includeSymbols.value) groups.push(symbolSet);
  return groups;
});

const createUuidFallback = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const generateUuid = () => {
  if (typeof crypto === "undefined") {
    showAlert("Secure UUID generation is unavailable.", "error");
    return;
  }

  uuidValue.value = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : createUuidFallback();
};

const generatePassword = () => {
  if (!supportsSecureRandom()) {
    showAlert("Secure random generation is unavailable.", "error");
    return;
  }

  const groups = selectedPasswordGroups.value;
  if (!groups.length) {
    showAlert("Enable at least one character group.", "error");
    return;
  }

  const minLength = groups.length;
  const requested = Number(passwordLength.value) || minLength;
  const targetLength = Math.max(minLength, Math.min(64, requested));
  passwordLength.value = targetLength;

  const allChars = groups.join("");
  const output = groups.map((group) => group[randomIndex(group.length)]);

  while (output.length < targetLength) {
    output.push(allChars[randomIndex(allChars.length)]);
  }

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  passwordValue.value = output.join("");
};
</script>

<template>
  <div class="hub-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="hero-shell">
      <v-container class="py-10 py-md-12">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
          <v-btn @click="goBack" variant="tonal" color="primary" prepend-icon="mdi-arrow-left" rounded="xl" class="text-none">
            Back
          </v-btn>
          <div class="hero-chip">Developer + User Utility</div>
        </div>

        <v-row align="center">
          <v-col cols="12" md="8" lg="7">
            <h1 class="hero-title mb-3">Dev Utility Hub</h1>
            <p class="hero-subtitle mb-0">
              One workspace for fast text transforms, URL and Base64 conversions, plus secure UUID and password
              generation.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="5">
            <div class="hero-stats">
              <div class="stat-item"><span class="stat-value">3</span><span class="stat-label">Tool Groups</span></div>
              <div class="stat-item"><span class="stat-value">Client-Only</span><span class="stat-label">Privacy</span></div>
              <div class="stat-item"><span class="stat-value">Instant</span><span class="stat-label">Results</span></div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-8 py-md-12">
      <v-row class="ga-0" align="stretch">
        <v-col cols="12" class="mb-6">
          <v-card class="tool-shell pa-5 pa-md-7" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
              <div>
                <p class="panel-kicker mb-1">Text Transformer</p>
                <h2 class="text-h5 font-weight-bold mb-1">Convert naming and casing instantly</h2>
              </div>
              <v-icon icon="mdi-format-letter-case" color="primary" size="34"></v-icon>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="textSource"
                  label="Input text"
                  variant="outlined"
                  auto-grow
                  rows="7"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="textResult"
                  label="Transformed output"
                  variant="outlined"
                  auto-grow
                  rows="7"
                  density="comfortable"
                  readonly
                />
              </v-col>
            </v-row>

            <div class="d-flex flex-wrap ga-2 mt-1">
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="applyTextTransform('upper')">UPPER</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="applyTextTransform('lower')">lower</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="applyTextTransform('title')">Title Case</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="applyTextTransform('camel')">camelCase</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="applyTextTransform('snake')">snake_case</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="applyTextTransform('kebab')">kebab-case</v-btn>
              <v-spacer></v-spacer>
              <v-btn class="text-none" color="primary" variant="flat" rounded="lg" prepend-icon="mdi-content-copy" @click="copyToClipboard(textResult, 'Text output')">Copy</v-btn>
              <v-btn class="text-none" color="error" variant="text" rounded="lg" @click="clearTextTool">Clear</v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" class="mb-6">
          <v-card class="tool-shell pa-5 pa-md-7" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
              <div>
                <p class="panel-kicker mb-1">Encoding Lab</p>
                <h2 class="text-h5 font-weight-bold mb-1">URL and Base64 encode or decode</h2>
              </div>
              <v-icon icon="mdi-code-json" color="primary" size="34"></v-icon>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="encodingInput"
                  label="Input text"
                  variant="outlined"
                  auto-grow
                  rows="6"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="encodingOutput"
                  label="Output"
                  variant="outlined"
                  auto-grow
                  rows="6"
                  density="comfortable"
                  readonly
                />
              </v-col>
            </v-row>

            <div class="d-flex flex-wrap ga-2 mt-1">
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="encodeUrl">URL Encode</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="decodeUrl">URL Decode</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="encodeBase64">Base64 Encode</v-btn>
              <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" @click="decodeBase64">Base64 Decode</v-btn>
              <v-spacer></v-spacer>
              <v-btn class="text-none" color="primary" variant="flat" rounded="lg" prepend-icon="mdi-content-copy" @click="copyToClipboard(encodingOutput, 'Encoding output')">Copy</v-btn>
              <v-btn class="text-none" color="error" variant="text" rounded="lg" @click="clearEncodingTool">Clear</v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-row>
            <v-col cols="12" md="6">
              <v-card class="tool-shell pa-5 pa-md-6 h-100" rounded="xl" elevation="0">
                <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
                  <div>
                    <p class="panel-kicker mb-1">UUID Generator</p>
                    <h2 class="text-h6 font-weight-bold mb-1">Create unique IDs</h2>
                  </div>
                  <v-icon icon="mdi-fingerprint" color="primary" size="32"></v-icon>
                </div>

                <v-text-field v-model="uuidValue" label="Generated UUID" variant="outlined" readonly density="comfortable" />
                <div class="d-flex flex-wrap ga-2">
                  <v-btn class="text-none" color="primary" variant="flat" rounded="lg" @click="generateUuid">Generate UUID</v-btn>
                  <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-content-copy" @click="copyToClipboard(uuidValue, 'UUID')">Copy</v-btn>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card class="tool-shell pa-5 pa-md-6 h-100" rounded="xl" elevation="0">
                <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
                  <div>
                    <p class="panel-kicker mb-1">Password Generator</p>
                    <h2 class="text-h6 font-weight-bold mb-1">Secure random passwords</h2>
                  </div>
                  <v-icon icon="mdi-shield-key-outline" color="primary" size="32"></v-icon>
                </div>

                <v-text-field
                  v-model.number="passwordLength"
                  type="number"
                  min="4"
                  max="64"
                  label="Password length"
                  variant="outlined"
                  density="comfortable"
                />

                <div class="toggle-grid mb-2">
                  <v-checkbox v-model="includeUpper" label="Uppercase" density="compact" hide-details />
                  <v-checkbox v-model="includeLower" label="Lowercase" density="compact" hide-details />
                  <v-checkbox v-model="includeNumbers" label="Numbers" density="compact" hide-details />
                  <v-checkbox v-model="includeSymbols" label="Symbols" density="compact" hide-details />
                </div>

                <v-text-field
                  v-model="passwordValue"
                  label="Generated password"
                  variant="outlined"
                  readonly
                  density="comfortable"
                />

                <div class="d-flex flex-wrap ga-2">
                  <v-btn class="text-none" color="primary" variant="flat" rounded="lg" @click="generatePassword">Generate Password</v-btn>
                  <v-btn class="text-none" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-content-copy" @click="copyToClipboard(passwordValue, 'Password')">Copy</v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.hub-page {
  background:
    radial-gradient(circle at 10% 6%, rgba(42, 108, 89, 0.2), transparent 35%),
    radial-gradient(circle at 90% 12%, rgba(214, 164, 62, 0.18), transparent 33%),
    linear-gradient(180deg, #f4f8ff 0%, #eef8f1 100%);
}

.hero-shell {
  border-bottom: 1px solid rgba(21, 47, 74, 0.16);
  background: linear-gradient(145deg, rgba(248, 253, 255, 0.98), rgba(235, 246, 255, 0.96));
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 13px;
  border: 1px solid rgba(27, 88, 69, 0.35);
  color: #1d5b49;
  background: rgba(199, 240, 221, 0.7);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 800;
}

.hero-title {
  font-size: clamp(2rem, 3.4vw, 3rem);
  color: #153455;
}

.hero-subtitle {
  color: #516786;
  line-height: 1.7;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid rgba(34, 63, 110, 0.16);
  border-radius: 12px;
  padding: 12px 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
}

.stat-value {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  color: #13365b;
}

.stat-label {
  display: block;
  font-size: 0.72rem;
  color: #667b9a;
}

.tool-shell {
  border: 1px solid rgba(29, 70, 115, 0.15);
  background: linear-gradient(168deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: 0 18px 36px rgba(15, 33, 78, 0.08);
}

.panel-kicker {
  color: #215d95;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.71rem;
  font-weight: 700;
}

.toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 8px;
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .toggle-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .hero-title {
    line-height: 1.12;
  }

  .stat-value {
    font-size: 0.9rem;
  }
}
</style>
