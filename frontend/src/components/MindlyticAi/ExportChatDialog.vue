<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  conversationTitle: { type: String, default: "Mindlytic Chat" },
  messages: { type: Array, default: () => [] },
  isDarkTheme: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "show-alert"]);

const exportFormat = ref("markdown");
const includeTimestamps = ref(true);

const formatOptions = [
  { label: "Markdown Document (.md)", value: "markdown", icon: "mdi-language-markdown" },
  { label: "Plain Text (.txt)", value: "text", icon: "mdi-text-box-outline" },
  { label: "Structured Data (.json)", value: "json", icon: "mdi-code-json" },
];

const closeDialog = () => {
  emit("update:modelValue", false);
};

const sanitizeFilename = (name = "chat") => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
};

const handleExport = () => {
  if (!props.messages || props.messages.length === 0) {
    emit("show-alert", "No messages in the current conversation to export.", "error");
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeTitle = sanitizeFilename(props.conversationTitle);
  let fileContent = "";
  let mimeType = "text/plain";
  let extension = "txt";

  if (exportFormat.value === "markdown") {
    extension = "md";
    mimeType = "text/markdown;charset=utf-8";
    fileContent = `# ${props.conversationTitle}\n*Exported from Mindlytic AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
    fileContent += props.messages
      .map((msg) => {
        const role = msg.role === "assistant" ? "🤖 **Mindlytic AI**" : "👤 **User**";
        const time = includeTimestamps.value && msg.createdAt ? ` *(at ${new Date(msg.createdAt).toLocaleTimeString()})*` : "";
        return `### ${role}${time}\n\n${msg.text}\n\n---`;
      })
      .join("\n\n");
  } else if (exportFormat.value === "json") {
    extension = "json";
    mimeType = "application/json;charset=utf-8";
    fileContent = JSON.stringify(
      {
        title: props.conversationTitle,
        exportedAt: new Date().toISOString(),
        totalMessages: props.messages.length,
        messages: props.messages.map((m) => ({
          role: m.role,
          text: m.text,
          createdAt: m.createdAt,
        })),
      },
      null,
      2,
    );
  } else {
    extension = "txt";
    mimeType = "text/plain;charset=utf-8";
    fileContent = `=== ${props.conversationTitle} ===\nExported: ${new Date().toLocaleString()}\n\n`;
    fileContent += props.messages
      .map((msg) => {
        const role = msg.role === "assistant" ? "[Mindlytic AI]" : "[User]";
        const time = includeTimestamps.value && msg.createdAt ? ` (${new Date(msg.createdAt).toLocaleTimeString()})` : "";
        return `${role}${time}:\n${msg.text}\n\n--------------------\n`;
      })
      .join("\n");
  }

  try {
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mindlytic-${safeTitle}-${dateStr}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    emit("show-alert", `Chat exported as .${extension}!`, "success");
    closeDialog();
  } catch {
    emit("show-alert", "Failed to export chat file.", "error");
  }
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="export-dialog-card rounded-xl" :class="{ 'theme-dark': isDarkTheme }">
      <v-card-title class="d-flex align-center justify-between pa-4 border-b">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-download-outline" color="primary" />
          <h2 class="text-subtitle-1 font-weight-bold m-0">Export Conversation</h2>
        </div>
        <v-btn icon="mdi-close" size="small" variant="text" aria-label="Close Export" @click="closeDialog" />
      </v-card-title>

      <v-card-text class="pa-5">
        <p class="text-body-2 mb-4 text-grey">
          Export "{{ conversationTitle }}" ({{ messages.length }} messages) to your local device.
        </p>

        <div class="mb-4">
          <label class="text-caption font-weight-bold d-block mb-2">Export Format</label>
          <v-radio-group v-model="exportFormat" hide-details density="compact">
            <v-radio
              v-for="opt in formatOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
              color="primary"
              class="mb-1"
            />
          </v-radio-group>
        </div>

        <v-checkbox
          v-model="includeTimestamps"
          label="Include message timestamps"
          density="compact"
          color="primary"
          hide-details
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-end ga-2">
        <v-btn variant="text" class="rounded-lg text-none" @click="closeDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-download"
          class="rounded-lg text-none font-weight-bold px-5"
          @click="handleExport"
        >
          Download Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.export-dialog-card {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.export-dialog-card.theme-dark {
  background-color: #1e1e1e !important;
  color: #ececec !important;
}
</style>
