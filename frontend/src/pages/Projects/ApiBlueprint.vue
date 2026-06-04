<script setup>
import { ref, computed } from "vue";
import Alerts from "@/components/Alerts.vue";

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const activeTab = ref("endpoints");
const apiName = ref("My API");
const apiVersion = ref("1.0.0");
const apiDescription = ref("");
const apiBasePath = ref("/api/v1");

const endpoints = ref([]);
const currentEndpoint = ref({
  id: null,
  method: "GET",
  path: "",
  summary: "",
  description: "",
  tags: [],
  parameters: [],
  requestBody: "",
  responses: [],
});

const tagInput = ref("");
const paramInput = ref({ name: "", in: "path", required: false, type: "string", description: "" });
const responseInput = ref({ status: "200", description: "Successful response", schema: "" });

const methodColors = {
  GET: "success",
  POST: "primary",
  PUT: "warning",
  PATCH: "info",
  DELETE: "error",
};

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type === "error" ? "error" : "success";
  alertVisible.value = true;
};

const goBack = () => window.history.back();

const addEndpoint = () => {
  if (!currentEndpoint.value.path.trim()) {
    showAlert("Enter an endpoint path.", "error");
    return;
  }

  const newEndpoint = {
    ...currentEndpoint.value,
    id: Date.now(),
    path: currentEndpoint.value.path.startsWith("/")
      ? currentEndpoint.value.path
      : `/${currentEndpoint.value.path}`,
  };

  endpoints.value.push(newEndpoint);
  resetCurrentEndpoint();
  showAlert("Endpoint added.");
};

const resetCurrentEndpoint = () => {
  currentEndpoint.value = {
    id: null,
    method: "GET",
    path: "",
    summary: "",
    description: "",
    tags: [],
    parameters: [],
    requestBody: "",
    responses: [],
  };
};

const removeEndpoint = (id) => {
  endpoints.value = endpoints.value.filter((ep) => ep.id !== id);
  showAlert("Endpoint removed.");
};

const editEndpoint = (endpoint) => {
  currentEndpoint.value = { ...endpoint };
  endpoints.value = endpoints.value.filter((ep) => ep.id !== endpoint.id);
};

const addTag = () => {
  if (tagInput.value.trim() && !currentEndpoint.value.tags.includes(tagInput.value.trim())) {
    currentEndpoint.value.tags.push(tagInput.value.trim());
    tagInput.value = "";
  }
};

const removeTag = (tag) => {
  currentEndpoint.value.tags = currentEndpoint.value.tags.filter((t) => t !== tag);
};

const addParameter = () => {
  if (!paramInput.value.name.trim()) {
    showAlert("Enter a parameter name.", "error");
    return;
  }

  currentEndpoint.value.parameters.push({ ...paramInput.value });
  paramInput.value = { name: "", in: "path", required: false, type: "string", description: "" };
};

const removeParameter = (index) => {
  currentEndpoint.value.parameters.splice(index, 1);
};

const addResponse = () => {
  if (!responseInput.value.status.trim()) {
    showAlert("Enter a response status code.", "error");
    return;
  }

  currentEndpoint.value.responses.push({ ...responseInput.value });
  responseInput.value = { status: "200", description: "Successful response", schema: "" };
};

const removeResponse = (index) => {
  currentEndpoint.value.responses.splice(index, 1);
};

const generateOpenApiJson = () => {
  if (endpoints.value.length === 0) {
    showAlert("Add at least one endpoint before generating.", "error");
    return;
  }

  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: apiName.value || "Untitled API",
      version: apiVersion.value,
      description: apiDescription.value || undefined,
    },
    servers: [
      {
        url: apiBasePath.value,
      },
    ],
    paths: {},
  };

  endpoints.value.forEach((endpoint) => {
    const methodKey = endpoint.method.toLowerCase();
    if (!openApiSpec.paths[endpoint.path]) {
      openApiSpec.paths[endpoint.path] = {};
    }

    openApiSpec.paths[endpoint.path][methodKey] = {
      summary: endpoint.summary || undefined,
      description: endpoint.description || undefined,
      tags: endpoint.tags.length ? endpoint.tags : undefined,
      parameters: endpoint.parameters.length
        ? endpoint.parameters.map((param) => ({
          name: param.name,
          in: param.in,
          required: param.in === "path" ? true : param.required,
          schema: {
            type: param.type,
          },
          description: param.description || undefined,
        }))
        : undefined,
      requestBody: endpoint.requestBody
        ? {
          content: {
            "application/json": {
              schema: {
                type: "object",
                example: JSON.parse(endpoint.requestBody) || {},
              },
            },
          },
        }
        : undefined,
      responses: endpoint.responses.length
        ? endpoint.responses.reduce((acc, res) => {
          acc[res.status] = {
            description: res.description,
            content: res.schema
              ? {
                "application/json": {
                  schema: {
                    type: "object",
                    example: JSON.parse(res.schema) || {},
                  },
                },
              }
              : undefined,
          };
          return acc;
        }, {})
        : {
          "200": {
            description: "Successful response",
          },
        },
    };
  });

  return JSON.stringify(openApiSpec, null, 2);
};

const downloadOpenApi = () => {
  try {
    const spec = generateOpenApiJson();
    const blob = new Blob([spec], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${apiName.value.toLowerCase().replace(/\s+/g, "-")}-openapi.json`;
    link.click();
    URL.revokeObjectURL(url);
    showAlert("OpenAPI spec downloaded.");
  } catch (_error) {
    showAlert("Failed to generate OpenAPI spec.", "error");
  }
};

const copyOpenApi = async () => {
  try {
    const spec = generateOpenApiJson();
    await navigator.clipboard.writeText(spec);
    showAlert("OpenAPI spec copied to clipboard.");
  } catch (_error) {
    showAlert("Failed to copy OpenAPI spec.", "error");
  }
};

const exportMarkdown = () => {
  if (endpoints.value.length === 0) {
    showAlert("Add at least one endpoint before exporting.", "error");
    return;
  }

  let md = `# ${apiName.value}\n\n`;
  md += `**Version:** ${apiVersion.value}\n\n`;
  if (apiDescription.value) md += `${apiDescription.value}\n\n`;
  md += `**Base Path:** \`${apiBasePath.value}\`\n\n`;
  md += `---\n\n`;

  endpoints.value.forEach((ep) => {
    md += `## ${ep.method} ${ep.path}\n\n`;
    if (ep.summary) md += `> ${ep.summary}\n\n`;
    if (ep.description) md += `${ep.description}\n\n`;
    if (ep.tags.length) md += `**Tags:** ${ep.tags.join(", ")}\n\n`;

    if (ep.parameters.length) {
      md += `### Parameters\n\n`;
      md += `| Name | In | Type | Required | Description |\n`;
      md += `|------|-----|------|----------|-------------|\n`;
      ep.parameters.forEach((param) => {
        md += `| ${param.name} | ${param.in} | ${param.type} | ${param.required ? "Yes" : "No"} | ${param.description || "-"} |\n`;
      });
      md += `\n`;
    }

    if (ep.requestBody) {
      md += `### Request Body\n\n\`\`\`json\n${ep.requestBody}\n\`\`\`\n\n`;
    }

    if (ep.responses.length) {
      md += `### Responses\n\n`;
      ep.responses.forEach((res) => {
        md += `**${res.status}**: ${res.description}\n`;
        if (res.schema) {
          md += `\`\`\`json\n${res.schema}\n\`\`\`\n`;
        }
        md += `\n`;
      });
    }

    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${apiName.value.toLowerCase().replace(/\s+/g, "-")}-documentation.md`;
  link.click();
  URL.revokeObjectURL(url);
  showAlert("Markdown documentation downloaded.");
};
</script>

<template>
  <div class="blueprint-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />
    <v-container class="py-8 py-md-12">
      <v-row class="ga-0" align="stretch">
        <v-col cols="12" class="mb-6">
          <v-card class="tool-shell p-5 p-md-7 animate-fade-in-up" rounded="xl" elevation="0">
            <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
              <div>
                <p class="panel-kicker mb-1">API Blueprint Designer</p>
                <h2 class="text-h5 font-weight-bold mb-1">Design and document your REST APIs</h2>
              </div>
              <v-btn class="text-none" color="primary" variant="text" rounded="lg" prepend-icon="mdi-arrow-left"
                @click="goBack">Back</v-btn>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="apiName" label="API Name" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="apiVersion" label="Version" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="apiBasePath" label="Base Path" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="apiDescription" label="Description (optional)" variant="outlined" rows="2"
                  density="comfortable" />
              </v-col>
            </v-row>
          </v-card>
        </v-col>

        <v-col cols="12" class="mb-6">
          <v-card class="tool-shell p-5 p-md-7" rounded="xl" elevation="0">
            <v-tabs v-model="activeTab" color="primary" align-tabs="start" class="mb-4">
              <v-tab value="endpoints">Endpoints</v-tab>
              <v-tab value="export">Export</v-tab>
            </v-tabs>

            <v-window v-model="activeTab">
              <v-window-item value="endpoints">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select v-model="currentEndpoint.method" :items="['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
                      label="HTTP Method" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="currentEndpoint.path" label="Path (e.g., /users/:id)" variant="outlined"
                      density="comfortable" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="currentEndpoint.summary" label="Summary" variant="outlined"
                      density="comfortable" />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea v-model="currentEndpoint.description" label="Description" variant="outlined" rows="3"
                      density="comfortable" />
                  </v-col>

                  <v-col cols="12">
                    <p class="text-subtitle-2 font-weight-bold mb-2">Tags</p>
                    <div class="d-flex flex-wrap ga-2 mb-2">
                      <v-chip v-for="tag in currentEndpoint.tags" :key="tag" closable @click:close="removeTag(tag)"
                        color="primary" variant="tonal" size="small">{{ tag }}</v-chip>
                    </div>
                    <div class="d-flex ga-2">
                      <v-text-field v-model="tagInput" label="Add tag" variant="outlined" density="compact"
                        @keyup.enter="addTag" hide-details />
                      <v-btn color="primary" variant="tonal" @click="addTag">Add</v-btn>
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <p class="text-subtitle-2 font-weight-bold mb-2">Parameters</p>
                    <v-table density="compact" class="mb-2" v-if="currentEndpoint.parameters.length">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>In</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(param, idx) in currentEndpoint.parameters" :key="idx">
                          <td>{{ param.name }}</td>
                          <td>{{ param.in }}</td>
                          <td>{{ param.type }}</td>
                          <td>{{ param.required ? "Yes" : "No" }}</td>
                          <td>
                            <v-btn icon="mdi-close" size="small" variant="text" @click="removeParameter(idx)" />
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                    <v-row>
                      <v-col cols="12" md="3">
                        <v-text-field v-model="paramInput.name" label="Name" variant="outlined" density="compact"
                          hide-details />
                      </v-col>
                      <v-col cols="12" md="2">
                        <v-select v-model="paramInput.in" :items="['path', 'query', 'header']" label="In"
                          variant="outlined" density="compact" hide-details />
                      </v-col>
                      <v-col cols="12" md="2">
                        <v-select v-model="paramInput.type" :items="['string', 'number', 'boolean', 'integer']"
                          label="Type" variant="outlined" density="compact" hide-details />
                      </v-col>
                      <v-col cols="12" md="3">
                        <v-checkbox v-model="paramInput.required" label="Required" density="compact" hide-details />
                      </v-col>
                      <v-col cols="12" md="2">
                        <v-btn color="primary" variant="tonal" block @click="addParameter">Add</v-btn>
                      </v-col>
                    </v-row>
                  </v-col>

                  <v-col cols="12">
                    <p class="text-subtitle-2 font-weight-bold mb-2">Request Body (JSON example)</p>
                    <v-textarea v-model="currentEndpoint.requestBody"
                      label='e.g., { "name": "John", "email": "john@example.com" }' variant="outlined" rows="3"
                      density="comfortable" />
                  </v-col>

                  <v-col cols="12">
                    <p class="text-subtitle-2 font-weight-bold mb-2">Responses</p>
                    <v-table density="compact" class="mb-2" v-if="currentEndpoint.responses.length">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(res, idx) in currentEndpoint.responses" :key="idx">
                          <td>{{ res.status }}</td>
                          <td>{{ res.description }}</td>
                          <td>
                            <v-btn icon="mdi-close" size="small" variant="text" @click="removeResponse(idx)" />
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                    <v-row>
                      <v-col cols="12" md="3">
                        <v-text-field v-model="responseInput.status" label="Status Code" variant="outlined"
                          density="compact" hide-details />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model="responseInput.description" label="Description" variant="outlined"
                          density="compact" hide-details />
                      </v-col>
                      <v-col cols="12" md="3">
                        <v-btn color="primary" variant="tonal" block @click="addResponse">Add Response</v-btn>
                      </v-col>
                    </v-row>
                  </v-col>

                  <v-col cols="12" class="pt-4">
                    <v-btn color="primary" variant="flat" rounded="lg" @click="addEndpoint">
                      {{ currentEndpoint.id ? "Update Endpoint" : "Add Endpoint" }}
                    </v-btn>
                    <v-btn v-if="currentEndpoint.id" color="error" variant="text" rounded="lg"
                      @click="resetCurrentEndpoint">Cancel</v-btn>
                  </v-col>
                </v-row>

                <v-divider class="my-6"></v-divider>

                <div>
                  <p class="text-subtitle-1 font-weight-bold mb-3">Defined Endpoints ({{ endpoints.length }})</p>
                  <v-alert v-if="!endpoints.length" type="info" variant="tonal" density="compact" rounded="lg">
                    No endpoints defined yet. Add your first endpoint above.
                  </v-alert>
                  <v-list v-else density="compact" class="bg-transparent">
                    <v-list-item v-for="ep in endpoints" :key="ep.id" rounded="lg" class="mb-2 endpoint-item">
                      <template v-slot:prepend>
                        <v-chip :color="methodColors[ep.method]" size="small" label>{{ ep.method }}</v-chip>
                      </template>
                      <v-list-item-title class="font-weight-bold">{{ ep.path }}</v-list-item-title>
                      <v-list-item-subtitle>{{ ep.summary || "No summary" }}</v-list-item-subtitle>
                      <template v-slot:append>
                        <v-btn icon="mdi-pencil" size="small" variant="text" @click="editEndpoint(ep)" />
                        <v-btn icon="mdi-delete" size="small" variant="text" color="error"
                          @click="removeEndpoint(ep.id)" />
                      </template>
                    </v-list-item>
                  </v-list>
                </div>
              </v-window-item>

              <v-window-item value="export">
                <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
                  Export your API design as OpenAPI 3.0 JSON specification or Markdown documentation.
                </v-alert>

                <div class="d-flex flex-wrap ga-2 mb-4">
                  <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-download"
                    @click="downloadOpenApi">Download
                    OpenAPI JSON</v-btn>
                  <v-btn color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-content-copy"
                    @click="copyOpenApi">Copy
                    OpenAPI JSON</v-btn>
                  <v-btn color="success" variant="tonal" rounded="lg" prepend-icon="mdi-language-markdown"
                    @click="exportMarkdown">Download Markdown Docs</v-btn>
                </div>

                <v-label class="text-subtitle-2 font-weight-bold mb-2">Preview</v-label>
                <v-textarea :model-value="generateOpenApiJson()" label="OpenAPI 3.0 Specification" variant="outlined"
                  rows="20" readonly density="compact" class="font-mono" />
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.blueprint-page {
  background: var(--portfolio-bg);
}

.tool-shell {
  border: 1px solid var(--portfolio-border-color);
  background: var(--portfolio-panel-highlight);
  backdrop-filter: blur(20px);
  box-shadow: var(--portfolio-shadow);
}

.panel-kicker {
  color: #0f8f7c !important;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.71rem;
  font-weight: 700;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}

.endpoint-item {
  border: 1px solid var(--portfolio-border-color) !important;
  background: rgba(255, 255, 255, 0.02) !important;
  backdrop-filter: blur(12px);
  transition: all 0.25s ease;
}

.endpoint-item:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(15, 143, 124, 0.25) !important;
  transform: translateY(-2px);
}
</style>
