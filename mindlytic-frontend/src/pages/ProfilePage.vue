<template>
  <v-container class="py-8 py-md-12 profile-shell">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <v-row>
      <v-col cols="12" md="4" lg="3">
        <v-card class="section-shell profile-card pa-5" flat>
          <v-avatar size="124" :image="myPhoto" class="mx-auto d-flex mb-4 profile-avatar"></v-avatar>
          <h1 class="text-h5 text-center mb-1">Laksh Solanki</h1>
          <p class="text-center muted-copy mb-4">Senior Full-Stack Engineer</p>

          <div class="d-flex flex-column ga-2 mb-5">
            <div class="d-flex justify-space-between">
              <span class="muted-copy">Experience</span>
              <strong>4+ years</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span class="muted-copy">Primary Stack</span>
              <strong>Vue + Node</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span class="muted-copy">Location</span>
              <strong>India</strong>
            </div>
          </div>

          <v-btn block color="primary" rounded="xl" class="text-none mb-3" href="mailto:lakshsolanki848@gmail.com">
            Contact Me
          </v-btn>
          <v-btn block variant="outlined" color="primary" rounded="xl" class="text-none" @click="copyEmail">
            Copy Email
          </v-btn>

          <v-divider class="my-5"></v-divider>

          <div class="d-flex justify-center ga-2">
            <v-btn icon="mdi-github" variant="tonal" color="primary" href="https://github.com/laksh-solanki" target="_blank"></v-btn>
            <v-btn icon="mdi-web" variant="tonal" color="primary" href="https://mindlytic.onrender.com/" target="_blank"></v-btn>
            <v-btn icon="mdi-linkedin" variant="tonal" color="primary" href="https://www.linkedin.com" target="_blank"></v-btn>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" lg="9">
        <v-card class="section-shell pa-6 pa-md-8 mb-6" flat>
          <p class="text-overline text-primary font-weight-bold mb-2">Developer Profile</p>
          <h2 class="text-h4 mb-4">I build products that stay maintainable as they scale.</h2>
          <p class="muted-copy mb-0 intro-copy">
            I help teams turn ideas into fast, reliable web apps with a practical engineering workflow.
            My focus is clean architecture, clear communication, and shipping features that solve real problems.
          </p>
        </v-card>

        <v-card class="section-shell pa-6 pa-md-8 mb-6" flat>
          <h3 class="text-h5 mb-4">Career Highlights</h3>
          <v-row>
            <v-col v-for="item in highlights" :key="item.title" cols="12" sm="6" lg="3">
              <div class="highlight-box pa-4">
                <p class="text-h5 font-weight-bold text-primary mb-1">{{ item.value }}</p>
                <p class="font-weight-bold mb-1">{{ item.title }}</p>
                <p class="text-caption muted-copy mb-0">{{ item.caption }}</p>
              </div>
            </v-col>
          </v-row>
        </v-card>

        <v-card class="section-shell pa-6 pa-md-8 mb-6" flat>
          <h3 class="text-h5 mb-3">Experience Timeline</h3>
          <v-timeline side="end" truncate-line="both" density="comfortable">
            <v-timeline-item
              v-for="job in experiences"
              :key="job.role"
              :dot-color="job.dotColor"
              size="small"
            >
              <template #opposite>
                <span class="text-caption muted-copy">{{ job.period }}</span>
              </template>
              <div class="timeline-card pa-4">
                <p class="text-subtitle-1 font-weight-bold mb-1">{{ job.role }}</p>
                <p class="text-body-2 text-primary font-weight-medium mb-2">{{ job.company }}</p>
                <p class="muted-copy mb-0">{{ job.summary }}</p>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card>

        <v-card class="section-shell pa-6 pa-md-8" flat>
          <h3 class="text-h5 mb-4">Stack & Expertise</h3>
          <v-row>
            <v-col v-for="group in skillGroups" :key="group.title" cols="12" md="6">
              <div class="mb-4">
                <p class="font-weight-bold mb-2">{{ group.title }}</p>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip v-for="skill in group.skills" :key="skill" color="primary" variant="tonal" size="small">
                    {{ skill }}
                  </v-chip>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import Alerts from "@/components/Alerts.vue";
import myPhoto from "@/assets/Picture/my-pic.jpg";

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const highlights = [
  { value: "50+", title: "Shipped Features", caption: "Across tools, dashboards, and internal systems." },
  { value: "12+", title: "Production APIs", caption: "Built with authentication and resilient data flows." },
  { value: "35%", title: "Faster Releases", caption: "By improving code structure and CI handoff." },
  { value: "4.9/5", title: "Collaboration", caption: "Consistent feedback from cross-functional teams." },
];

const experiences = [
  {
    period: "2024 - Present",
    role: "Senior Full-Stack Engineer",
    company: "Mindlytic",
    summary:
      "Lead product implementation for AI-powered tools, conversion utilities, and developer-focused interfaces.",
    dotColor: "primary",
  },
  {
    period: "2022 - 2024",
    role: "Frontend Engineer",
    company: "Freelance & Product Teams",
    summary:
      "Built Vue applications with reusable component systems and optimized Lighthouse performance scores.",
    dotColor: "secondary",
  },
  {
    period: "2021 - 2022",
    role: "Software Developer",
    company: "Client Projects",
    summary:
      "Delivered full-stack solutions with Node.js, MongoDB, and responsive UI implementations.",
    dotColor: "info",
  },
];

const skillGroups = [
  {
    title: "Frontend",
    skills: ["Vue 3", "Vuetify", "Tailwind", "Pinia", "Accessibility", "Responsive UX"],
  },
  {
    title: "Backend",
    skills: ["Node.js", "Fastify", "MongoDB", "REST APIs", "Auth", "Validation"],
  },
  {
    title: "Tooling",
    skills: ["Vite", "Git", "pnpm", "Postman", "VS Code", "Deployment"],
  },
  {
    title: "Workflow",
    skills: ["Feature Planning", "Code Review", "Refactoring", "Debugging", "Documentation"],
  },
];

const showAlert = (message, type = "success") => {
  alertMessage.value = message;
  alertType.value = type;
  alertVisible.value = true;
};

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText("lakshsolanki848@gmail.com");
    showAlert("Email copied to clipboard.", "success");
  } catch {
    showAlert("Unable to copy email on this browser.", "error");
  }
};
</script>

<style scoped>
.profile-shell {
  max-width: 1240px;
}

.profile-card {
  position: sticky;
  top: 96px;
}

.profile-avatar {
  border: 3px solid #ffffff;
  box-shadow: 0 10px 26px rgba(19, 111, 99, 0.22);
}

.intro-copy {
  max-width: 72ch;
}

.highlight-box {
  border: 1px solid rgba(19, 111, 99, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  height: 100%;
}

.timeline-card {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(19, 111, 99, 0.14);
}

@media (max-width: 960px) {
  .profile-card {
    position: static;
  }
}
</style>

