<template>
  <div class="about-page animate-fade-in-up">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <!-- ───────── HERO ───────── -->
    <section class="ap-hero">
      <div class="ap-container ap-hero__inner">
        <div class="ap-hero__text">
          <h1 class="ap-hero__headline mb-4">
            Crafting<br />
            <em class="ap-hero__accent">developer-first</em><br />
            digital products.
          </h1>
          <p class="ap-hero__sub mb-6">
            I build fast, maintainable web experiences where design quality
            and engineering quality move together — from idea to a polished,
            reliable launch.
          </p>
          <div class="ap-hero__actions d-flex flex-wrap ga-3">
            <v-btn class="ap-btn text-none font-weight-bold px-7" size="large" color="primary" rounded="xl" variant="flat"
              elevation="0" @click="copyEmail" text="Let's Collaborate" />
            <v-btn to="/projects" size="large" color="primary" rounded="xl" variant="outlined" class="ap-btn text-none font-weight-bold px-7"
              elevation="0" text="View Projects" />
          </div>
        </div>

        <!-- Bento stat grid -->
        <div class="ap-hero__bento">
          <article v-for="(s, i) in stats" :key="s.label" class="ap-bento-card" :class="`ap-bento-card--${i}`">
            <p class="ap-bento-card__value">{{ s.value }}</p>
            <p class="ap-bento-card__label">{{ s.label }}</p>
          </article>

          <!-- Profile mini-card inside bento -->
          <div class="ap-bento-profile">
            <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="50" avatar-class="ap-bento-avatar" />
            <div class="ap-bento-profile__details">
              <p class="ap-bento-profile__name">Laksh Solanki</p>
              <p class="ap-bento-profile__role">Founder, Developer</p>
            </div>
            <span class="ap-bento-badge">
              <v-chip size="small" color="primary" variant="tonal" text="Open to work" class="font-weight-bold"></v-chip>
            </span>
          </div>

          <v-img :src="aboutPhoto1" class="ap-bento-img" alt="Creative workstation visual" />
        </div>
      </div>
    </section>

    <!-- ───────── PROFILE + CARDS ───────── -->
    <section class="ap-section animate-fade-in-up">
      <div class="ap-container ap-profile-layout">
        <!-- Sticky profile sidebar -->
        <aside class="ap-profile-sidebar">
          <div class="ap-profile-card">
            <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="96" avatar-class="ap-profile-avatar" />
            <h2 class="ap-profile-card__name">Laksh Solanki</h2>
            <p class="ap-profile-card__title">Senior Full-Stack Developer</p>
            <div class="ap-profile-card__info">
              <div class="ap-info-row"><span class="ap-info-label">Experience</span><strong>4+ years</strong></div>
              <div class="ap-info-row"><span class="ap-info-label">Stack</span><strong>Vue + Node</strong></div>
              <div class="ap-info-row"><span class="ap-info-label">Based in</span><strong>India 🇮🇳</strong></div>
            </div>
            <div class="ap-profile-card__actions">
              <v-btn class="ap-btn text-none font-weight-bold" @click="scrollToCollaborate" size="large" rounded="xl"
                variant="flat" text="Contact me" color="primary" block elevation="0" />
              <v-btn class="ap-btn text-none font-weight-bold" @click="copyEmail" size="large" rounded="xl" variant="outlined"
                text="Copy Email" color="primary" block elevation="0" />
            </div>
            <div class="ap-profile-card__socials">
              <v-btn icon="mdi-github" href="https://github.com/laksh-solanki" target="_blank" variant="outlined"
                size="large" class="ap-social-btn" color="primary" aria-label="GitHub" />
              <v-btn icon="mdi-instagram" href="https://www.instagram.com/laksh_solanki" target="_blank" variant="outlined"
                size="large" class="ap-social-btn" color="primary" aria-label="Instagram" />
              <v-btn icon="mdi-linkedin" href="https://www.linkedin.com/in/laksh-solanki" target="_blank" variant="outlined" size="large"
                class="ap-social-btn" color="primary" aria-label="LinkedIn" />
            </div>
          </div>
        </aside>

        <!-- Main content column -->
        <div class="ap-main-col">
          <!-- Intro card -->
          <div class="ap-card">
            <p class="ap-card__overline">Developer Profile</p>
            <h3 class="ap-card__headline">I build products that stay maintainable as they scale.</h3>
            <p class="ap-card__body">
              I help teams turn ideas into fast, reliable web apps with a practical engineering workflow.
              My focus is clean architecture, clear communication, and shipping features that solve real problems.
            </p>
          </div>

          <!-- Career highlights bento -->
          <div class="ap-card">
            <p class="ap-card__overline">Career Highlights</p>
            <div class="ap-highlights-grid">
              <div v-for="h in highlights" :key="h.title" class="ap-highlight-cell">
                <p class="ap-highlight-cell__value">{{ h.value }}</p>
                <p class="ap-highlight-cell__title">{{ h.title }}</p>
                <p class="ap-highlight-cell__caption">{{ h.caption }}</p>
              </div>
            </div>
          </div>

          <!-- Experience timeline -->
          <div class="ap-card">
            <p class="ap-card__overline">Experience Timeline</p>
            <div class="ap-timeline">
              <div v-for="(job, i) in experiences" :key="job.role" class="ap-timeline__item">
                <div class="ap-timeline__aside">
                  <span class="ap-timeline__period">{{ job.period }}</span>
                </div>
                <div class="ap-timeline__connector">
                  <div class="ap-timeline__dot"></div>
                  <div v-if="i < experiences.length - 1" class="ap-timeline__line"></div>
                </div>
                <div class="ap-timeline__body">
                  <p class="ap-timeline__role">{{ job.role }}</p>
                  <p class="ap-timeline__company">{{ job.company }}</p>
                  <p class="ap-timeline__summary">{{ job.summary }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="ap-card">
            <p class="ap-card__overline">Stack &amp; Expertise</p>
            <v-row class="ga-0" no-gutters>
              <v-col cols="12" md="7" class="pr-md-4">
                <div class="ap-skills-grid">
                  <div
                    v-for="(group, idx) in skillGroups"
                    :key="group.title"
                    class="ap-skill-group p-3 rounded-lg cursor-pointer mb-2"
                    :class="{ 'is-active-skill': activeSkillGroupIndex === idx }"
                    @click="activeSkillGroupIndex = idx"
                  >
                    <p class="ap-skill-group__title mb-2 d-flex align-center justify-space-between">
                      {{ group.title }}
                      <v-icon v-if="activeSkillGroupIndex === idx" size="10" color="primary">mdi-circle</v-icon>
                    </p>
                    <div class="ap-chips d-flex flex-wrap ga-2">
                      <span v-for="skill in group.skills" :key="skill" class="ap-chip">{{ skill }}</span>
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="5" class="mt-4 mt-md-0 pl-md-4 border-s-md" style="border-color: var(--ap-border) !important;">
                <v-card class="section-shell rounded-xl p-5 h-100 d-flex flex-column justify-center" flat>
                  <div class="d-flex align-center mb-3">
                    <v-avatar color="primary" size="32" variant="tonal" class="mr-3">
                      <v-icon size="18">{{ getSkillGroupIcon(activeSkillGroupIndex) }}</v-icon>
                    </v-avatar>
                    <h4 class="text-subtitle-1 font-weight-bold" style="color: var(--ap-ink);">{{ skillGroups[activeSkillGroupIndex].title }} Insights</h4>
                  </div>
                  <p class="mb-4 text-body-2" style="color: var(--ap-muted); line-height: 1.6;">
                    {{ skillSummaries[activeSkillGroupIndex] }}
                  </p>
                  <div class="d-flex align-center justify-space-between text-caption border-t pt-3" style="border-color: rgba(124, 14, 68, 0.08) !important;">
                    <span style="color: var(--ap-muted);">Status:</span>
                    <span class="text-primary font-weight-bold">Production Ready</span>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── MISSION ───────── -->
    <section class="ap-section">
      <div class="ap-container">
        <div class="ap-mission-card">
          <div class="ap-mission-card__img-col">
            <v-img :src="aboutPhoto2" cover class="ap-mission-img" alt="Mission workspace" />
            <div class="ap-mission-card__img-badge">
              <v-icon icon="mdi-rocket-launch-outline" size="18" class="mr-1" />
              15+ Products Launched
            </div>
          </div>
          <div class="ap-mission-card__text-col">
            <p class="ap-kicker">Mission</p>
            <h2 class="ap-section-headline mb-3">Build products that users trust and teams can scale</h2>
            <p class="ap-muted-copy mb-6">
              Mindlytic focuses on practical engineering decisions that support long-term product growth.
              Intuitive interfaces, maintainable codebases, and features delivered with reliable consistency.
            </p>
            <ul class="ap-check-list">
              <li v-for="point in missionPoints" :key="point" class="ap-check-list__item">
                <v-icon icon="mdi-check-circle-outline" class="ap-check-list__icon mr-2" color="primary" />
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── PROCESS ───────── -->
    <section class="ap-section ap-section--last animate-fade-in-up">
      <div class="ap-container">
        <div class="ap-process-wrap p-6 p-md-8">
          <v-row class="ga-0 align-center">
            <v-col cols="12" md="6" class="pr-md-8 mb-6 mb-md-0">
              <p class="ap-kicker">Workflow</p>
              <h2 class="ap-section-headline mb-4">How projects are delivered</h2>

              <div class="ap-process-list">
                <article
                  v-for="(step, i) in processSteps"
                  :key="step.title"
                  class="p-4 rounded-xl cursor-pointer mb-3 border transition-all"
                  :class="{ 'is-active-step': activeWorkflowStep === i }"
                  @click="runWorkflowStep(i)"
                >
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption font-weight-bold text-primary">0{{ i + 1 }} &mdash; Step</span>
                    <v-icon v-if="activeWorkflowStep === i" icon="mdi-circle-slice-8" color="primary" size="18" />
                  </div>
                  <h3 class="text-subtitle-1 font-weight-bold mb-1" style="color: var(--ap-ink);">{{ step.title }}</h3>
                  <p class="text-caption mb-0" style="color: var(--ap-muted); line-height: 1.5;">{{ step.description }}</p>
                </article>
              </div>

              <div class="mt-4">
                <v-btn
                  color="primary"
                  rounded="xl"
                  prepend-icon="mdi-play-circle-outline"
                  class="text-none font-weight-bold"
                  elevation="0"
                  :loading="isRunningWorkflow"
                  @click="runAllWorkflow"
                >
                  Run Delivery Pipeline
                </v-btn>
              </div>
            </v-col>

            <v-col cols="12" md="6" class="pl-md-4">
              <!-- Interactive Visual Pipeline Monitor -->
              <v-card class="section-shell rounded-xl p-6 h-100 d-flex flex-column justify-space-between" flat>
                <div class="w-100">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <span class="text-overline font-weight-bold text-primary" style="letter-spacing: 0.1em !important;">Pipeline Status Monitor</span>
                    <v-chip size="x-small" :color="isRunningWorkflow ? 'secondary' : pipelineProgress === 100 ? 'primary' : 'secondary'" class="font-weight-bold" variant="tonal">
                      {{ isRunningWorkflow ? 'Running' : pipelineProgress === 100 ? 'Complete' : 'Idle' }}
                    </v-chip>
                  </div>

                  <!-- Connected Pipeline Track -->
                  <div class="pipeline-svg-track position-relative mb-6 d-flex align-center justify-space-between px-6 py-2">
                    <div class="pipeline-line-bg"></div>
                    <div class="pipeline-line-progress" :style="`width: ${Math.max(0, pipelineProgress - 10) * 0.8}%;`"></div>

                    <div
                      v-for="(step, i) in processSteps"
                      :key="step.title"
                      class="pipeline-node d-flex align-center justify-center rounded-circle transition-all"
                      :class="{
                        'is-node-active': activeWorkflowStep === i,
                        'is-node-done': pipelineProgress > (i * 33.3)
                      }"
                    >
                      <v-icon size="14" :color="pipelineProgress > (i * 33.3) ? 'primary' : 'medium-emphasis'">
                        {{ pipelineProgress > (i * 33.3) ? 'mdi-check' : 'mdi-circle' }}
                      </v-icon>
                    </div>
                  </div>

                  <!-- Telemetry progress bar -->
                  <div class="mb-5">
                    <div class="d-flex align-center justify-space-between mb-1.5">
                      <span class="text-caption" style="color: var(--ap-muted);">Process Completion</span>
                      <span class="text-caption font-weight-bold text-primary">{{ Math.round(pipelineProgress) }}%</span>
                    </div>
                    <v-progress-linear
                      :model-value="pipelineProgress"
                      color="primary"
                      height="6"
                      rounded
                      bg-opacity="0.1"
                    />
                  </div>

                  <!-- Step milestones checks list -->
                  <div class="pipeline-tasks">
                    <div class="text-caption mb-3 font-weight-bold" style="color: var(--ap-ink-soft);">Milestone Telemetry</div>

                    <div class="d-flex flex-column ga-2">
                      <div
                        v-for="(task, idx) in getStepTasks(activeWorkflowStep !== null ? activeWorkflowStep : 0)"
                        :key="task"
                        class="d-flex align-center text-caption py-2 px-3 rounded-lg"
                        style="background: var(--ap-surface-soft);"
                      >
                        <v-icon
                          size="16"
                          :color="isItemChecked(activeWorkflowStep, idx) ? 'primary' : 'medium-emphasis'"
                          class="mr-2.5 transition-all"
                        >
                          {{ isItemChecked(activeWorkflowStep, idx) ? 'mdi-checkbox-marked-circle-outline' : 'mdi-checkbox-blank-circle-outline' }}
                        </v-icon>
                        <span :class="{ 'text-primary font-weight-bold': isItemChecked(activeWorkflowStep, idx) }" style="transition: color 0.2s ease;">
                          {{ task }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Alerts from "@/components/Alerts.vue";
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const aboutPhoto1 = getMediaUrl("about_img/about_photo_1.svg");
const aboutPhoto2 = getMediaUrl("about_img/about_photo_2.jpg");
const myPhoto = getMediaUrl("Picture/my-pic.jpeg");

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const activeSkillGroupIndex = ref(0);

const getSkillGroupIcon = (idx) => {
  const icons = ["mdi-xml", "mdi-server", "mdi-tools", "mdi-git"];
  return icons[idx] || "mdi-code-braces";
};

const stats = [
  { value: "15+", label: "Projects Delivered" },
  { value: "4+", label: "Years Experience" },
  { value: "8", label: "Design Systems" },
  { value: "2–4 wks", label: "Typical Delivery" },
];

const missionPoints = [
  "Design decisions backed by engineering logic",
  "Scalable component architecture from day one",
  "Performance-first implementation for web products",
  "Clear collaboration and reliable delivery rhythm",
];

const processSteps = [
  {
    title: "Discovery & Scope",
    description: "Understand business goals, user flow, and constraints, then define a realistic implementation scope.",
  },
  {
    title: "Design & Build",
    description: "Build polished UI with reusable components and solid integration patterns across the application.",
  },
  {
    title: "Review & Launch",
    description: "Validate performance, edge cases, and responsiveness before production release and post-launch support.",
  },
];

const highlights = [
  { value: "50+", title: "Shipped Features", caption: "Across tools, dashboards, and internal systems." },
  { value: "12+", title: "Production APIs", caption: "Built with authentication and resilient data flows." },
  { value: "35%", title: "Faster Releases", caption: "By improving code structure and CI handoff." },
  { value: "4.9/5", title: "Collaboration", caption: "Consistent feedback from cross-functional teams." },
];

const experiences = [
  {
    period: "2024 – Present",
    role: "Senior Full-Stack Engineer",
    company: "Mindlytic",
    summary: "Lead product implementation for AI-powered tools, conversion utilities, and developer-focused interfaces.",
  },
  {
    period: "2022 – 2024",
    role: "Frontend Engineer",
    company: "Freelance & Product Teams",
    summary: "Built Vue applications with reusable component systems and optimized Lighthouse performance scores.",
  },
  {
    period: "2021 – 2022",
    role: "Software Developer",
    company: "Client Projects",
    summary: "Delivered full-stack solutions with Node.js, MongoDB, and responsive UI implementations.",
  },
];

const skillGroups = [
  { title: "Frontend", skills: ["Vue 3", "Vuetify", "Modern CSS", "Pinia", "Accessibility", "Responsive UX"] },
  { title: "Backend", skills: ["Node.js", "Fastify", "MongoDB", "REST APIs", "Auth", "Validation"] },
  { title: "Tooling", skills: ["Vite", "Git", "pnpm", "Postman", "VS Code", "Deployment"] },
  { title: "Workflow", skills: ["Feature Planning", "Code Review", "Refactoring", "Debugging", "Documentation"] },
];

const skillSummaries = [
  "Core UI engineering built with Vue 3 composition API, utilizing reactive state. Designed using Vuetify 4 component layers, custom utility tokens in CSS, and Pinia stores.",
  "Scalable Node.js architectures, leveraging Fastify endpoints, token-based verification protocols, and clean validation parameters via schemas.",
  "Vite 8 compiler configurations, pnpm workspace tooling, secure deployment integrations, and automated build environments.",
  "Feature validation, iterative design reviews, performant edge case testing, and detailed engineering blueprints."
];

const activeWorkflowStep = ref(null);
const isRunningWorkflow = ref(false);
const pipelineProgress = ref(0);
const checkedItems = ref({
  0: [false, false, false],
  1: [false, false, false],
  2: [false, false, false]
});

const getStepTasks = (stepIdx) => {
  const tasks = {
    0: ["Requirement & spec analysis validated", "Competitive research and benchmarks complete", "Project scope and dev roadmap set"],
    1: ["Component architecture constructed", "Polished client UI layout structured", "Integration APIs connected"],
    2: ["Lighthouse optimization checked (100%)", "Multi-device viewport responsive audit verified", "Staging code build deployed successfully"]
  };
  return tasks[stepIdx] || [];
};

const isItemChecked = (stepIdx, itemIdx) => {
  if (stepIdx === null) {
    return pipelineProgress.value === 100;
  }
  return checkedItems.value[stepIdx]?.[itemIdx] || false;
};

const runWorkflowStep = (stepIndex) => {
  if (isRunningWorkflow.value) return;
  activeWorkflowStep.value = stepIndex;

  const targetProgress = (stepIndex + 1) * 33.3;
  let startProgress = pipelineProgress.value;
  const progressTimer = setInterval(() => {
    if (startProgress < targetProgress) {
      startProgress += 2.5;
      pipelineProgress.value = Math.min(Math.round(startProgress), targetProgress);
    } else if (startProgress > targetProgress) {
      startProgress -= 2.5;
      pipelineProgress.value = Math.max(Math.round(startProgress), targetProgress);
    } else {
      clearInterval(progressTimer);
    }
  }, 15);

  checkedItems.value[stepIndex] = [false, false, false];
  let checkIdx = 0;
  const checkTimer = setInterval(() => {
    if (checkIdx < 3) {
      checkedItems.value[stepIndex][checkIdx] = true;
      checkIdx++;
    } else {
      clearInterval(checkTimer);
    }
  }, 150);
};

const runAllWorkflow = () => {
  if (isRunningWorkflow.value) return;
  isRunningWorkflow.value = true;
  pipelineProgress.value = 0;

  checkedItems.value = {
    0: [false, false, false],
    1: [false, false, false],
    2: [false, false, false]
  };

  let currentStep = 0;
  const runNext = () => {
    if (currentStep > 2) {
      isRunningWorkflow.value = false;
      activeWorkflowStep.value = null;
      pipelineProgress.value = 100;
      return;
    }

    activeWorkflowStep.value = currentStep;

    const targetProgress = (currentStep + 1) * 33.3;
    let startProgress = pipelineProgress.value;
    const progressTimer = setInterval(() => {
      if (startProgress < targetProgress) {
        startProgress += 1.5;
        pipelineProgress.value = Math.min(Math.round(startProgress), targetProgress);
      } else {
        clearInterval(progressTimer);
      }
    }, 15);

    let checkIdx = 0;
    const checkTimer = setInterval(() => {
      if (checkIdx < 3) {
        checkedItems.value[currentStep][checkIdx] = true;
        checkIdx++;
      } else {
        clearInterval(checkTimer);
        setTimeout(() => {
          currentStep++;
          runNext();
        }, 300);
      }
    }, 200);
  };

  runNext();
};

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

const scrollToCollaborate = () => {
  const target = document.getElementById("collaborate-container");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
  window.dispatchEvent(
    new CustomEvent("prompt-connect-email", {
      detail: { message: "Write Your Email to Connect to Me." },
    })
  );
};
</script>

<style scoped>
/* ─── TOKENS ──────────────────────────────────────── */
.about-page {
  --ap-primary: #7C0E44;
  --ap-secondary: #AA5E7A;
  --ap-accent: #D49A9A;
  --ap-bg: #F2DACE;
  --ap-surface: #FFFFFF;
  --ap-surface-soft: #FAF3F0;
  --ap-ink: #231219;
  --ap-ink-soft: #4E3842;
  --ap-muted: #7E636E;
  --ap-border: rgba(124, 14, 68, 0.12);
  --ap-border-strong: rgba(124, 14, 68, 0.24);
  --ap-shadow-sm: 0 4px 16px rgba(124, 14, 68, 0.04);
  --ap-shadow-md: 0 8px 24px rgba(124, 14, 68, 0.06);
  --ap-radius: 18px;
  color: var(--ap-ink);
}

.ap-container {
  width: 100%;
  max-width: min(var(--page-max-width, 1360px), 100%);
  margin-inline: auto;
  padding-inline: clamp(16px, 2.4vw, 32px);
}

.ap-section {
  padding-block: clamp(36px, 5vw, 64px);
}

.ap-section--last {
  padding-bottom: 80px;
}

/* ─── TYPOGRAPHY ──────────────────────────────────── */
.ap-kicker {
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ap-section-headline {
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.6rem, 2.4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: var(--ap-ink);
}

.ap-hero__headline {
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.85rem, 5vw, 3.8rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: var(--ap-ink);
  overflow-wrap: break-word;
}

.ap-hero__accent {
  font-style: normal;
  color: var(--ap-primary);
}

.ap-hero__sub {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--ap-ink-soft);
  max-width: 52ch;
}

/* ─── HERO ────────────────────────────────────────── */
.ap-hero {
  padding-top: clamp(20px, 4vw, 40px);
}

.ap-hero__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(28px, 4vw, 56px);
}

/* Bento grid */
.ap-hero__bento {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.ap-bento-card {
  background: var(--ap-surface);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  padding: 20px;
  box-shadow: var(--ap-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ap-bento-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ap-shadow-md);
  border-color: var(--ap-border-strong);
}

.ap-bento-card__value {
  font-family: "Space Grotesk", sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--ap-primary);
  line-height: 1;
  margin: 0 0 6px;
}

.ap-bento-card__label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ap-muted);
  margin: 0;
}

.ap-bento-profile {
  grid-column: span 2;
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--ap-surface);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  box-shadow: var(--ap-shadow-sm);
}

.ap-bento-profile__details {
  min-width: 0;
}

.ap-bento-profile__name {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--ap-ink);
  margin: 0;
}

.ap-bento-profile__role {
  font-size: 0.78rem;
  color: var(--ap-muted);
  margin: 0;
}

.ap-bento-badge {
  white-space: nowrap;
}

.ap-bento-img {
  grid-column: span 2 !important;
  border-radius: var(--ap-radius);
  border: 1px solid var(--ap-border);
  max-height: 160px;
  object-fit: cover !important;
  background: var(--ap-surface-soft);
}

/* ─── PROFILE LAYOUT ──────────────────────────────── */
.ap-profile-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  align-items: start;
  gap: 32px;
}

.ap-profile-sidebar {
  position: sticky;
  top: 96px;
}

.ap-profile-card {
  background: var(--ap-surface);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  padding: 28px 22px;
  box-shadow: var(--ap-shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ap-profile-avatar {
  border: 2px solid var(--ap-primary) !important;
  margin-bottom: 14px;
}

.ap-profile-card__name {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--ap-ink);
  margin: 0 0 4px;
}

.ap-profile-card__title {
  font-size: 0.85rem;
  color: var(--ap-secondary);
  font-weight: 600;
  margin: 0 0 18px;
}

.ap-profile-card__info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--ap-border);
  border-bottom: 1px solid var(--ap-border);
  padding: 14px 0;
  margin-bottom: 18px;
  font-size: 0.86rem;
}

.ap-info-row {
  display: flex;
  justify-content: space-between;
}

.ap-info-label {
  color: var(--ap-muted);
}

.ap-info-row strong {
  color: var(--ap-ink);
}

.ap-profile-card__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.ap-profile-card__socials {
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--ap-border);
  padding-top: 16px;
  width: 100%;
  justify-content: center;
}

.ap-social-btn {
  border-color: var(--ap-border) !important;
}

.ap-social-btn:hover {
  background: rgba(124, 14, 68, 0.06) !important;
  border-color: var(--ap-primary) !important;
}

/* ─── MAIN CONTENT CARDS ──────────────────────────── */
.ap-main-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ap-card {
  background: var(--ap-surface);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  padding: 26px;
  box-shadow: var(--ap-shadow-sm);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.ap-card:hover {
  border-color: var(--ap-border-strong);
  box-shadow: var(--ap-shadow-md);
}

.ap-card__overline {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ap-primary);
  margin: 0 0 8px;
}

.ap-card__headline {
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.2rem, 1.8vw, 1.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ap-ink);
  margin: 0 0 10px;
}

.ap-card__body {
  color: var(--ap-muted);
  font-size: 0.95rem;
  line-height: 1.65;
  margin: 0;
}

/* Highlights Grid */
.ap-highlights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ap-highlight-cell {
  background: var(--ap-surface-soft);
  border: 1px solid var(--ap-border);
  border-radius: 14px;
  padding: 16px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.ap-highlight-cell:hover {
  transform: translateY(-2px);
  border-color: var(--ap-border-strong);
}

.ap-highlight-cell__value {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--ap-primary);
  margin: 0 0 4px;
}

.ap-highlight-cell__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ap-ink);
  margin: 0 0 4px;
}

.ap-highlight-cell__caption {
  font-size: 0.78rem;
  color: var(--ap-muted);
  margin: 0;
}

/* Experience Timeline */
.ap-timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 14px;
}

.ap-timeline__item {
  display: grid;
  grid-template-columns: 130px 24px 1fr;
  gap: 16px;
  align-items: start;
}

.ap-timeline__period {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ap-primary);
  background: rgba(124, 14, 68, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
  white-space: nowrap;
}

.ap-timeline__connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.ap-timeline__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ap-primary);
  border: 2px solid #FFFFFF;
  box-shadow: 0 0 0 2px var(--ap-primary);
  margin-top: 4px;
}

.ap-timeline__line {
  width: 2px;
  flex: 1;
  background: var(--ap-border);
  margin-top: 6px;
  min-height: 40px;
}

.ap-timeline__role {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--ap-ink);
  margin: 0 0 2px;
}

.ap-timeline__company {
  font-size: 0.82rem;
  color: var(--ap-secondary);
  font-weight: 600;
  margin: 0 0 6px;
}

.ap-timeline__summary {
  font-size: 0.88rem;
  color: var(--ap-muted);
  line-height: 1.55;
  margin: 0;
}

/* Skills */
.ap-skill-group {
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.ap-skill-group.is-active-skill {
  background: rgba(124, 14, 68, 0.06);
  border: 1px solid rgba(124, 14, 68, 0.2);
}

.ap-skill-group__title {
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ap-ink-soft);
}

.ap-chip {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  background: var(--ap-surface);
  border: 1px solid var(--ap-border);
  color: var(--ap-primary);
}

/* ─── MISSION CARD ────────────────────────────────── */
.ap-mission-card {
  background: var(--ap-surface);
  border: 1px solid var(--ap-border);
  border-radius: 20px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  box-shadow: var(--ap-shadow-sm);
}

.ap-mission-card__img-col {
  position: relative;
  min-height: 320px;
  background: var(--ap-surface-soft);
}

.ap-mission-img {
  width: 100%;
  height: 100%;
}

.ap-mission-card__img-badge {
  position: absolute;
  bottom: 18px;
  left: 18px;
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 100px;
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.14);
  color: var(--ap-primary);
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(124, 14, 68, 0.1);
}

.ap-mission-card__text-col {
  padding: clamp(24px, 4vw, 44px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ap-muted-copy {
  color: var(--ap-muted);
  line-height: 1.65;
}

.ap-check-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ap-check-list__item {
  display: flex;
  align-items: center;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--ap-ink-soft);
}

/* ─── PROCESS / WORKFLOW ──────────────────────────── */
.ap-process-wrap {
  background: var(--ap-surface);
  border: 1px solid var(--ap-border);
  border-radius: 20px;
  box-shadow: var(--ap-shadow-sm);
}

.ap-process-list article {
  border-color: var(--ap-border) !important;
  background: var(--ap-surface-soft) !important;
}

.ap-process-list article.is-active-step {
  background: rgba(124, 14, 68, 0.06) !important;
  border-color: var(--ap-primary) !important;
}

.pipeline-line-bg {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 3px;
  background: var(--ap-border);
  top: 50%;
  transform: translateY(-50%);
  z-index: 0;
}

.pipeline-line-progress {
  position: absolute;
  left: 10%;
  height: 3px;
  background: linear-gradient(90deg, var(--ap-primary), var(--ap-secondary));
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  transition: width 0.3s ease;
}

.pipeline-node {
  width: 36px;
  height: 36px;
  z-index: 2;
  border: 2px solid var(--ap-border);
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(124, 14, 68, 0.08);
}

.pipeline-node.is-node-active {
  border-color: var(--ap-primary);
}

.pipeline-node.is-node-done {
  border-color: var(--ap-secondary);
  background: rgba(124, 14, 68, 0.08);
}

/* Responsive */
@media (max-width: 960px) {
  .ap-hero__inner {
    grid-template-columns: 1fr;
  }

  .ap-profile-layout {
    grid-template-columns: 1fr;
  }

  .ap-profile-sidebar {
    position: static;
  }

  .ap-mission-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .ap-container {
    padding-inline: var(--page-gutter-tight, 12px) !important;
  }

  .ap-hero__bento {
    grid-template-columns: 1fr;
  }

  .ap-bento-profile,
  .ap-bento-img {
    grid-column: span 2;
  }

  .ap-bento-profile {
    gap: 10px;
    padding: 12px;
  }

  .ap-highlights-grid {
    grid-template-columns: 1fr;
  }

  .ap-timeline__item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .ap-timeline__connector {
    display: none;
  }

  .ap-mission-card__img-col {
    min-height: 220px;
  }
}

@media (max-width: 480px) {
  .ap-hero__actions {
    width: 100%;
    flex-direction: column;
  }

  .ap-hero__actions .ap-btn {
    width: 100% !important;
    justify-content: center;
  }

  .ap-card {
    padding: 18px 14px;
  }

  .ap-profile-card {
    padding: 20px 16px;
  }

  .ap-process-wrap {
    padding: 18px 14px !important;
  }
}

@media (max-width: 360px) {
  .ap-hero__headline {
    font-size: 1.7rem;
  }
}
</style>
