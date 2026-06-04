<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Alerts from "@/components/Alerts.vue";

const STORAGE_KEY = "lifeflow_planner_v1";
const MAX_TASK_LENGTH = 180;
const MAX_TASKS = 120;

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const taskInput = ref("");
const selectedMode = ref("all");

const loadSavedTasks = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.title === "string")
      .map((item) => ({
        id: Number(item.id) || Date.now(),
        title: item.title.slice(0, MAX_TASK_LENGTH),
        priority: ["high", "medium", "low"].includes(item.priority) ? item.priority : "medium",
        energy: ["deep", "light", "quick"].includes(item.energy) ? item.energy : "quick",
        dueLabel: typeof item.dueLabel === "string" ? item.dueLabel : "Anytime",
        completed: Boolean(item.completed),
      }))
      .slice(0, MAX_TASKS);
  } catch {
    return [];
  }
};

const tasks = ref(loadSavedTasks());

watch(
  tasks,
  (value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      showAlert("Could not save locally. Storage may be full.", "error");
    }
  },
  { deep: true },
);

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const dueLabelFromText = (sourceText) => {
  const text = sourceText.toLowerCase();
  const timeMatch = text.match(/\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s?(am|pm)\b/i);
  const hourOnlyMatch = text.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/);

  const dayLabel = text.includes("tomorrow") ? "Tomorrow" : text.includes("today") ? "Today" : "Anyday";

  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, "0");
    const minute = (timeMatch[2] || "00").padStart(2, "0");
    return `${dayLabel}, ${hour}:${minute} ${timeMatch[3].toUpperCase()}`;
  }

  if (hourOnlyMatch) {
    return `${dayLabel}, ${hourOnlyMatch[1].padStart(2, "0")}:${hourOnlyMatch[2]}`;
  }

  return dayLabel === "Anyday" ? "Anytime" : dayLabel;
};

const smartTaskFromInput = (rawValue) => {
  const text = rawValue.trim().replace(/\s+/g, " ");
  const lowered = text.toLowerCase();

  const priority = lowered.includes("urgent") || lowered.includes("!!")
    ? "high"
    : lowered.includes("later") || lowered.includes("someday")
      ? "low"
      : "medium";

  const energy = /focus|study|write|build|design|report/.test(lowered)
    ? "deep"
    : /call|walk|mail|reply|check/.test(lowered)
      ? "quick"
      : "light";

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: text.slice(0, MAX_TASK_LENGTH),
    priority,
    energy,
    dueLabel: dueLabelFromText(text),
    completed: false,
  };
};

const addTask = () => {
  const cleaned = taskInput.value.trim();
  if (!cleaned) {
    showAlert("Add a task first.", "error");
    return;
  }

  if (cleaned.length > MAX_TASK_LENGTH) {
    showAlert(`Keep task text under ${MAX_TASK_LENGTH} characters.`, "error");
    return;
  }

  if (tasks.value.length >= MAX_TASKS) {
    showAlert(`Task limit reached (${MAX_TASKS}). Complete or remove some tasks.`, "error");
    return;
  }

  tasks.value.unshift(smartTaskFromInput(cleaned));
  taskInput.value = "";
  showAlert("Task added.");
};

const removeTask = (id) => {
  tasks.value = tasks.value.filter((item) => item.id !== id);
};

const clearCompleted = () => {
  const before = tasks.value.length;
  tasks.value = tasks.value.filter((item) => !item.completed);
  const removedCount = before - tasks.value.length;
  showAlert(removedCount ? `Removed ${removedCount} completed task(s).` : "No completed tasks to clear.");
};

const modeOptions = [
  { title: "All", value: "all" },
  { title: "Open", value: "open" },
  { title: "Done", value: "done" },
  { title: "Deep Work", value: "deep" },
];

const filteredTasks = computed(() => {
  if (selectedMode.value === "open") return tasks.value.filter((item) => !item.completed);
  if (selectedMode.value === "done") return tasks.value.filter((item) => item.completed);
  if (selectedMode.value === "deep") return tasks.value.filter((item) => item.energy === "deep" && !item.completed);
  return tasks.value;
});

const openCount = computed(() => tasks.value.filter((item) => !item.completed).length);
const doneCount = computed(() => tasks.value.filter((item) => item.completed).length);
const deepCount = computed(() => tasks.value.filter((item) => item.energy === "deep" && !item.completed).length);

const priorityRank = { high: 3, medium: 2, low: 1 };

const nextSuggestion = computed(() => {
  const candidates = tasks.value
    .filter((item) => !item.completed)
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);

  if (!candidates.length) return "You are clear. Capture your next important task.";

  const picked = candidates[0];
  if (picked.energy === "deep") {
    return `Start with deep focus: ${picked.title}`;
  }
  return `Quick win first: ${picked.title}`;
});

const priorityColor = {
  high: "error",
  medium: "warning",
  low: "success",
};

const energyColor = {
  deep: "primary",
  light: "info",
  quick: "secondary",
};

const goBack = () => window.history.back();

const speechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

const voiceSupported = Boolean(speechRecognitionCtor);
const isListening = ref(false);
let recognition = null;

const startVoiceCapture = () => {
  if (!voiceSupported || isListening.value) return;

  recognition = new speechRecognitionCtor();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening.value = true;
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
    if (transcript) {
      taskInput.value = taskInput.value ? `${taskInput.value} ${transcript}`.trim() : transcript;
    }
  };

  recognition.onerror = () => {
    showAlert("Voice capture failed. Please type the task.", "error");
  };

  recognition.onend = () => {
    isListening.value = false;
    recognition = null;
  };

  recognition.start();
};

const focusDurationMinutes = ref(25);
const focusRunning = ref(false);
const focusSecondsLeft = ref(focusDurationMinutes.value * 60);
let focusTimerId = null;

watch(focusDurationMinutes, (minutes) => {
  const parsed = Number(minutes);
  if (!Number.isFinite(parsed) || parsed < 5 || parsed > 90) {
    focusDurationMinutes.value = 25;
    return;
  }

  if (!focusRunning.value) {
    focusSecondsLeft.value = Math.round(parsed * 60);
  }
});

const formatTime = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  const min = String(Math.floor(safe / 60)).padStart(2, "0");
  const sec = String(safe % 60).padStart(2, "0");
  return `${min}:${sec}`;
};

const toggleFocus = () => {
  if (!focusRunning.value) {
    focusRunning.value = true;
    focusTimerId = window.setInterval(() => {
      focusSecondsLeft.value -= 1;
      if (focusSecondsLeft.value <= 0) {
        focusSecondsLeft.value = 0;
        stopFocus();
        showAlert("Focus block completed.");
      }
    }, 1000);
    return;
  }

  stopFocus();
};

const stopFocus = () => {
  focusRunning.value = false;
  if (focusTimerId) {
    window.clearInterval(focusTimerId);
    focusTimerId = null;
  }
};

const resetFocus = () => {
  stopFocus();
  focusSecondsLeft.value = Math.round(focusDurationMinutes.value * 60);
};

onBeforeUnmount(() => {
  stopFocus();
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
});
</script>

<template>
  <div class="lifeflow-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-container class="py-8 py-md-10">
      <v-card class="minimal-shell pa-4 pa-md-6" rounded="xl" elevation="0">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div>
            <p class="text-caption text-uppercase text-primary font-weight-bold mb-1">Latest Project | May 4, 2026</p>
            <h1 class="text-h5 text-md-h4 mb-1">LifeFlow Planner</h1>
            <p class="text-body-2 muted-copy mb-0">
              A minimal daily planner with smart capture, voice input, offline save, and focus blocks.
            </p>
          </div>
          <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left" rounded="lg" @click="goBack">Back</v-btn>
        </div>

        <div class="d-flex flex-wrap ga-2 mb-5">
          <v-chip size="small" color="primary" variant="tonal">Smart Suggestions</v-chip>
          <v-chip size="small" color="secondary" variant="tonal">Voice Capture</v-chip>
          <v-chip size="small" color="success" variant="tonal">Offline Local Save</v-chip>
          <v-chip size="small" color="info" variant="tonal">Focus Timer</v-chip>
        </div>

        <v-row>
          <v-col cols="12" md="8">
            <v-text-field v-model="taskInput" label="Add a task (try: 'urgent report tomorrow 8am')" variant="outlined"
              density="comfortable" maxlength="180" counter @keyup.enter="addTask">
              <template #append-inner>
                <v-btn icon="mdi-microphone" size="small" variant="text" :color="isListening ? 'error' : 'primary'"
                  :disabled="!voiceSupported"
                  :title="voiceSupported ? 'Voice capture' : 'Voice not supported in this browser'"
                  @click="startVoiceCapture" />
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center ga-2">
            <v-btn color="primary" variant="flat" rounded="lg" class="flex-grow-1" @click="addTask">Add</v-btn>
            <v-btn color="error" variant="tonal" rounded="lg" class="flex-grow-1" @click="clearCompleted">Clear
              done</v-btn>
          </v-col>
        </v-row>

        <v-alert class="mb-4" type="info" density="compact" variant="tonal" rounded="lg">
          {{ nextSuggestion }}
        </v-alert>

        <div class="d-flex flex-wrap align-center ga-3 mb-4">
          <v-select v-model="selectedMode" :items="modeOptions" label="View" variant="outlined" density="compact"
            hide-details class="mode-select" />
          <v-chip size="small" color="primary" variant="tonal">Open: {{ openCount }}</v-chip>
          <v-chip size="small" color="success" variant="tonal">Done: {{ doneCount }}</v-chip>
          <v-chip size="small" color="info" variant="tonal">Deep Work: {{ deepCount }}</v-chip>
        </div>

        <v-list class="rounded-lg border task-list" lines="two">
          <v-list-item v-if="!filteredTasks.length" title="No tasks for this filter."
            subtitle="Add one to get started." />

          <v-list-item v-for="task in filteredTasks" :key="task.id" class="task-item">
            <template #prepend>
              <v-checkbox-btn v-model="task.completed" color="primary" />
            </template>

            <v-list-item-title :class="{ 'text-decoration-line-through': task.completed }">
              {{ task.title }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ task.dueLabel }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center ga-2 flex-wrap justify-end">
                <v-chip size="x-small" :color="priorityColor[task.priority]" variant="tonal">{{ task.priority
                  }}</v-chip>
                <v-chip size="x-small" :color="energyColor[task.energy]" variant="tonal">{{ task.energy }}</v-chip>
                <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error"
                  @click="removeTask(task.id)" />
              </div>
            </template>
          </v-list-item>
        </v-list>

        <v-divider class="my-6" />

        <h2 class="text-subtitle-1 font-weight-bold mb-3">Focus Block</h2>
        <div class="d-flex flex-wrap align-center ga-3">
          <v-text-field v-model.number="focusDurationMinutes" type="number" min="5" max="90" label="Minutes"
            density="compact" variant="outlined" hide-details class="minutes-input" />
          <v-chip size="large" color="primary" variant="outlined" class="timer-chip">{{ formatTime(focusSecondsLeft)
            }}</v-chip>
          <v-btn :color="focusRunning ? 'warning' : 'primary'" variant="flat" rounded="lg" @click="toggleFocus">
            {{ focusRunning ? "Pause" : "Start" }}
          </v-btn>
          <v-btn color="secondary" variant="tonal" rounded="lg" @click="resetFocus">Reset</v-btn>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
.lifeflow-page {
  background: var(--portfolio-bg);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.minimal-shell {
  max-width: 980px;
  margin: 0 auto;
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.mode-select {
  max-width: 200px;
}

.task-list {
  border-color: var(--portfolio-border-color) !important;
  background: var(--portfolio-field-bg) !important;
}

.task-item {
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.task-item:hover {
  background-color: rgba(255, 255, 255, 0.02) !important;
}

.task-item+.task-item {
  border-top: 1px solid var(--portfolio-border-color);
}

.minutes-input {
  max-width: 110px;
}

.timer-chip {
  min-width: 90px;
  justify-content: center;
}

@media (max-width: 600px) {
  .mode-select {
    max-width: 100%;
    width: 100%;
  }

  .minutes-input {
    max-width: 100%;
    width: 100%;
  }
}
</style>
