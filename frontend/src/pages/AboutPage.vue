<template>
  <v-container fluid class="about-page pa-0">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <section class="about-hero">
      <v-container class="py-12 py-md-16">
        <v-row align="center" class="ga-0">
          <v-col cols="12" md="7" class="pr-md-8">
            <p class="hero-kicker mb-3 startup-item" style="--delay: 0.08s">About Mindlytic</p>
            <h1 class="hero-title mb-4 startup-item" style="--delay: 0.16s">
              Crafting developer-first products with premium UI and clean architecture.
            </h1>
            <p class="hero-copy mb-0 startup-item" style="--delay: 0.24s">
              I build fast, maintainable web experiences where design quality and engineering quality move together.
              From idea to launch, every detail is built to feel polished and perform reliably.
            </p>

            <div class="d-flex flex-wrap ga-3 mt-7 startup-item" style="--delay: 0.32s">
              <v-btn color="primary" rounded="xl" size="large" class="text-none px-6" @click="scrollToSubscribe">
                Let's Collaborate
              </v-btn>
              <v-btn variant="outlined" rounded="xl" size="large" class="text-none px-6" color="primary" to="/projects">
                View Projects
              </v-btn>
            </div>

            <div class="metrics-grid mt-8">
              <article v-for="(item, index) in stats" :key="item.label" class="metric-card startup-item"
                :style="`--delay: ${0.4 + index * 0.08}s`">
                <p class="metric-value mb-1">{{ item.value }}</p>
                <p class="metric-label mb-0">{{ item.label }}</p>
              </article>
            </div>
          </v-col>

          <v-col cols="12" md="5" class="mt-8 mt-md-0">
            <v-card rounded="xl" elevation="0" class="hero-profile-card pa-5 pa-md-6 startup-card"
              style="--delay: 0.3s">
              <div class="d-flex align-center ga-3 mb-4">
                <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="54" avatar-class="about-avatar" />
                <div>
                  <p class="text-subtitle-1 font-weight-bold mb-1">Laksh Solanki</p>
                  <p class="text-caption profile-role mb-0">Founder, Mindlytic</p>
                </div>
              </div>

              <v-img :src="aboutPhoto1" cover class="rounded-xl mb-4 border-2 border-black"></v-img>

            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
    <section class="profile-merge pb-1 pb-md-1">
      <v-container class="profile-merge-wrap">
        <div class="mb-6 mb-md-8">
          <p class="section-label mb-2">Developer Profile</p>
        </div>

        <v-row>
          <v-col cols="12" md="4" lg="3">
            <v-card class="section-shell dev-profile-card pa-5 startup-card" border elevation="0" rounded="xl" variant="elevated"
              style="--delay: 0.1s">
              <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="124"
                avatar-class="mx-auto d-flex mb-4 dev-profile-avatar" />
              <h3 class="text-h5 text-center mb-1">Laksh Solanki</h3>
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

              <v-btn block color="primary" rounded="xl" size="large" class="text-none mb-3"
                href="mailto:lakshsolanki848@gmail.com">
                Contact Me
              </v-btn>
              <v-btn block variant="outlined" color="primary" size="large" rounded="xl" class="text-none"
                @click="copyEmail">
                Copy Email
              </v-btn>

              <v-divider class="my-5"></v-divider>

              <div class="d-flex align-center justify-center ga-3">
                <v-btn icon="mdi-github" variant="tonal" color="primary" href="https://github.com/laksh-solanki"
                  target="_blank"></v-btn>
                <v-btn icon="mdi-web" variant="tonal" color="primary" href="https://mindlytic.onrender.com/"
                  target="_blank"></v-btn>
                <v-btn icon="mdi-linkedin" variant="tonal" color="primary" href="https://www.linkedin.com"
                  target="_blank"></v-btn>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="8" lg="9">
            <v-card class="section-shell pa-6 pa-md-8 mb-6 startup-card" border variant="elevated" elevation="0" rounded="xl"
              style="--delay: 0.2s">
              <p class="text-overline text-primary font-weight-bold mb-2">Developer Profile</p>
              <h3 class="text-h4 mb-4">I build products that stay maintainable as they scale.</h3>
              <p class="muted-copy mb-0 dev-intro-copy">
                I help teams turn ideas into fast, reliable web apps with a practical engineering workflow.
                My focus is clean architecture, clear communication, and shipping features that solve real problems.
              </p>
            </v-card>

            <v-card class="section-shell pa-6 pa-md-8 mb-6 startup-card" border variant="elevated" elevation="0" rounded="xl"
              style="--delay: 0.3s">
              <h3 class="text-h5 mb-4">Career Highlights</h3>
              <v-row>
                <v-col v-for="item in highlights" :key="item.title" cols="12" sm="6" lg="3" class="d-flex">
                  <div class="dev-highlight-box pa-4 w-100">
                    <p class="text-h5 font-weight-bold text-primary mb-1">{{ item.value }}</p>
                    <p class="font-weight-bold mb-1">{{ item.title }}</p>
                    <p class="text-caption muted-copy mb-0">{{ item.caption }}</p>
                  </div>
                </v-col>
              </v-row>
            </v-card>

            <v-card class="section-shell pa-6 pa-md-8 mb-6 startup-card" border variant="elevated" elevation="0" rounded="xl"
              style="--delay: 0.4s">
              <h3 class="text-h5 mb-3">Experience Timeline</h3>
              <v-timeline side="end" truncate-line="both" density="comfortable">
                <v-timeline-item v-for="job in experiences" :key="job.role" :dot-color="job.dotColor" size="small">
                  <template #opposite>
                    <span class="text-caption">{{ job.period }}</span>
                  </template>
                  <div class="dev-timeline-card pa-4">
                    <p class="text-subtitle-1 font-weight-bold mb-1">{{ job.role }}</p>
                    <p class="text-body-2 text-primary font-weight-medium mb-2">{{ job.company }}</p>
                    <p class="muted-copy mb-0">{{ job.summary }}</p>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card>

            <v-card class="section-shell pa-6 pa-md-8 startup-card" border variant="elevated" elevation="0" rounded="xl"
              style="--delay: 0.5s">
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
    </section>

    <section>
      <v-container class="py-1 py-md-1">
        <v-card class="section-shell story-panel pa-5 pa-md-8 startup-card" border rounded="xl" elevation="0" style="--delay: 0.5s">
          <v-row align="center">
            <v-col cols="12" md="5" class="mb-6 mb-md-0">
              <v-img :src="aboutPhoto2" cover class="rounded-xl border story-image"></v-img>
            </v-col>
            <v-col cols="12" md="7" class="pl-md-8">
              <p class="section-label mb-2">Mission</p>
              <h2 class="text-h4 font-weight-bold mb-3">Build products that users trust and teams can scale</h2>
              <p class="muted-copy mb-5">
                Mindlytic focuses on practical engineering decisions that support long-term product growth. The goal is
                simple: make interfaces intuitive, keep codebases maintainable, and deliver features with consistency.
              </p>

              <v-list bg-color="transparent" class="pa-0">
                <v-list-item v-for="point in missionPoints" :key="point" class="px-0" density="compact">
                  <template #prepend>
                    <v-icon icon="mdi-check-circle" color="primary" class="mr-2"></v-icon>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ point }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>

    <section>
      <v-container class="pb-1 pb-md-1">
        <v-card class="section-shell pa-5 pa-md-8" border rounded="xl" elevation="0" style="--delay: 0.5s">
          <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between mb-7 ga-3">
            <div>
              <p class="section-label mb-2">Core Strengths</p>
              <h2 class="text-h4 font-weight-bold mb-0">Why teams work with Mindlytic</h2>
            </div>
          </div>

          <v-row>
            <v-col v-for="(card, index) in strengths" :key="card.title" cols="12" sm="6" md="4" class="d-flex">
              <v-card class="strength-card pa-5 h-100 startup-card" rounded="xl" elevation="0"
                :style="`--delay: ${0.1 + index * 0.1}s`">
                <v-avatar size="46" color="teal-lighten-5" class="mb-4">
                  <v-icon :icon="card.icon" color="teal-darken-2"></v-icon>
                </v-avatar>
                <h3 class="text-h6 font-weight-bold mb-2">{{ card.title }}</h3>
                <p class="mb-0 muted-copy">{{ card.description }}</p>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>

    <section>
      <v-container class="pb-10 pb-md-14">
        <v-card class="section-shell pa-5 pa-md-8 process-wrap" border rounded="xl" elevation="0" style="--delay: 0.5s">
          <p class="section-label mb-2">Workflow</p>
          <h2 class="text-h4 font-weight-bold mb-6">How projects are delivered</h2>

          <div class="process-grid">
            <article v-for="(step, index) in processSteps" :key="step.title" class="process-card startup-card h-100"
              :style="`--delay: ${0.1 + index * 0.1}s`">
              <span class="process-index">0{{ index + 1 }}</span>
              <h3 class="text-h6 font-weight-bold mb-2">{{ step.title }}</h3>
              <p class="muted-copy mb-0">{{ step.description }}</p>
            </article>
          </div>
        </v-card>
      </v-container>
    </section>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import Alerts from "@/components/Alerts.vue";
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const aboutPhoto1 = getMediaUrl("about_img/about_photo_1.svg");
const aboutPhoto2 = getMediaUrl("about_img/about_photo_2.jpg");
const myPhoto = getMediaUrl("Picture/my-pic.jpg");

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

const stats = [
  { value: "15+", label: "Projects Delivered" },
  { value: "8", label: "Design Systems" },
  { value: "2-4 Weeks", label: "Typical Delivery" },
];

const missionPoints = [
  "Design decisions backed by engineering logic",
  "Scalable component architecture from day one",
  "Performance-first implementation for web products",
  "Clear collaboration and reliable delivery rhythm",
];

const strengths = [
  {
    title: "UI Engineering",
    description: "High-quality interfaces with consistent spacing, typography, interactions, and responsive behavior.",
    icon: "mdi-view-quilt-outline",
  },
  {
    title: "Clean Architecture",
    description: "Readable and maintainable code structure with practical patterns that support future features.",
    icon: "mdi-sitemap-outline",
  },
  {
    title: "Execution Focus",
    description: "Fast iteration with quality checks so products ship smoothly without compromising standards.",
    icon: "mdi-rocket-launch-outline",
  },
];

const processSteps = [
  {
    title: "Discovery and Scope",
    description: "Understand business goals, user flow, and constraints, then define a realistic implementation scope.",
  },
  {
    title: "Design and Build",
    description: "Build polished UI with reusable components and solid integration patterns across the application.",
  },
  {
    title: "Review and Launch",
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
    period: "2024 Present",
    role: "Senior Full-Stack Engineer",
    company: "Mindlytic",
    summary:
      "Lead product implementation for AI-powered tools, conversion utilities, and developer-focused interfaces.",
    dotColor: "primary",
  },
  {
    period: "2022 2024",
    role: "Frontend Engineer",
    company: "Freelance & Product Teams",
    summary:
      "Built Vue applications with reusable component systems and optimized Lighthouse performance scores.",
    dotColor: "secondary",
  },
  {
    period: "2021 2022",
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

const scrollToSubscribe = () => {
  const section = document.getElementById("subscribe-container");
  if (!section) return;

  section.scrollIntoView({ behavior: "smooth", block: "center" });
  section.classList.add("subscribe-focus");
  window.setTimeout(() => section.classList.remove("subscribe-focus"), 1600);
};
</script>

<style scoped>
.about-page {
  color: var(--portfolio-ink);
}

.about-hero {
  position: relative;
  border-bottom: 1px solid rgba(19, 111, 99, 0.15);
  background:
    radial-gradient(circle at 14% 0%, rgba(84, 214, 192, 0.22), transparent 30%),
    radial-gradient(circle at 92% 12%, rgba(245, 174, 98, 0.26), transparent 34%),
    linear-gradient(150deg, rgba(247, 255, 251, 0.98), rgba(236, 246, 241, 0.92));
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.22);
  color: #136f63;
  font-weight: 700;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  font-size: clamp(2rem, 3.3vw, 3.3rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
  max-width: 19ch;
}

.hero-copy {
  max-width: 58ch;
  color: var(--portfolio-muted);
  font-size: 1.04rem;
  line-height: 1.75;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  border: 1px solid rgba(19, 111, 99, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  padding: 14px;
  min-height: 94px;
}

.metric-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0e2b25;
}

.metric-label {
  font-size: 0.8rem;
  color: #4d5d59;
}

.hero-profile-card {
  border: 1px solid rgba(19, 111, 99, 0.2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(240, 248, 245, 0.85));
  box-shadow: 0 20px 36px rgba(15, 48, 43, 0.12);
}

.about-avatar {
  border: 2px solid #ffffff;
  box-shadow: 0 12px 24px rgba(15, 48, 43, 0.18);
}

.profile-role {
  color: #58706a;
}

.story-panel {
  overflow: hidden;
}

.section-label {
  color: #136f63;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-weight: 700;
  font-size: 0.73rem;
}

.strength-card {
  border: 1px solid rgba(19, 111, 99, 0.16);
  background: linear-gradient(160deg, #ffffff 0%, #f4fbf8 100%);
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.strength-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 26px rgba(15, 48, 43, 0.12);
}

.process-wrap {
  background:
    radial-gradient(circle at 85% 20%, rgba(255, 208, 129, 0.14), transparent 28%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.97), rgba(243, 250, 246, 0.93));
}

.process-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.process-card {
  position: relative;
  border: 1px solid rgba(19, 111, 99, 0.18);
  border-radius: 16px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
}

.process-index {
  display: inline-flex;
  margin-bottom: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #1c7c6f;
}

.about-cta {
  margin-top: 4px;
}

.cta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid rgba(126, 232, 213, 0.26);
  background: linear-gradient(145deg, rgba(22, 74, 66, 0.9), rgba(18, 58, 52, 0.85));
  box-shadow: 0 22px 34px rgba(0, 0, 0, 0.2);
  color: #ecf9f5;
}

.profile-merge-wrap {
  max-width: min(var(--page-max-width), 100%);
  margin-inline: auto;
}

.dev-profile-card {
  position: sticky;
  top: 96px;
}

.dev-profile-avatar {
  border: 3px solid #ffffff;
  box-shadow: 0 10px 26px rgba(19, 111, 99, 0.22);
}

.dev-intro-copy {
  max-width: 72ch;
}

.dev-highlight-box {
  border: 1px solid rgba(19, 111, 99, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dev-timeline-card {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(19, 111, 99, 0.14);
}

@media (max-width: 1264px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {

  .hero-title,
  .hero-copy,
  .dev-intro-copy {
    max-width: none;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .process-grid {
    grid-template-columns: 1fr;
  }

  .section-shell :deep(.v-timeline-item__opposite) {
    display: none;
  }

  .dev-profile-card {
    position: static;
  }
}

@media (max-width: 600px) {
  .hero-title {
    letter-spacing: -0.02em;
  }
}

.startup-item,
.startup-card {
  opacity: 0;
  will-change: transform, opacity;
}

.startup-item {
  animation: startup-rise 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.startup-card {
  animation: startup-panel 0.78s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

@keyframes startup-rise {
  from {
    opacity: 0;
    transform: translateY(22px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes startup-panel {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {

  .startup-item,
  .startup-card {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
