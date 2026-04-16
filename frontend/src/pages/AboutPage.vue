<template>
  <div class="about-page">
    <Alerts v-model="alertVisible" :message="alertMessage" :type="alertType" />

    <!-- ───────── HERO ───────── -->
    <section class="ap-hero">
      <div class="ap-hero__mesh" aria-hidden="true">
        <div class="mesh-orb mesh-orb--1"></div>
        <div class="mesh-orb mesh-orb--2"></div>
        <div class="mesh-orb mesh-orb--3"></div>
        <div class="mesh-grid"></div>
      </div>

      <div class="ap-container ap-hero__inner">
        <div class="ap-hero__text">
          <span class="ap-kicker ai-0">About Mindlytic</span>
          <h1 class="ap-hero__headline ai-1">
            Crafting<br />
            <em class="ap-hero__accent">developer-first</em><br />
            digital products.
          </h1>
          <p class="ap-hero__sub ai-2">
            I build fast, maintainable web experiences where design quality
            and engineering quality move together — from idea to a polished,
            reliable launch.
          </p>
          <div class="ap-hero__actions ai-3">
            <button class="ap-btn ap-btn--primary" @click="scrollToSubscribe">Let's Collaborate</button>
            <router-link to="/projects" class="ap-btn ap-btn--ghost">View Projects</router-link>
          </div>
        </div>

        <!-- Bento stat grid -->
        <div class="ap-hero__bento ai-4">
          <article v-for="(s, i) in stats" :key="s.label" class="ap-bento-card" :class="`ap-bento-card--${i}`">
            <div class="ap-bento-card__accent"></div>
            <p class="ap-bento-card__value">{{ s.value }}</p>
            <p class="ap-bento-card__label">{{ s.label }}</p>
          </article>

          <!-- Profile mini-card inside bento -->
          <div class="ap-bento-profile">
            <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="52" avatar-class="ap-bento-avatar" />
            <div>
              <p class="ap-bento-profile__name">Laksh Solanki</p>
              <p class="ap-bento-profile__role">Founder, Mindlytic</p>
            </div>
            <span class="ap-bento-badge">
              <span class="ap-bento-badge__dot"></span>Open to work
            </span>
          </div>

          <v-img :src="aboutPhoto1" cover class="ap-bento-img" />
        </div>
      </div>
    </section>

    <!-- ───────── PROFILE + CARDS ───────── -->
    <section class="ap-section">
      <div class="ap-container ap-profile-layout">

        <!-- Sticky profile sidebar -->
        <aside class="ap-profile-sidebar">
          <div class="ap-profile-card ai-5">
            <div class="ap-profile-card__glow"></div>
            <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="96" avatar-class="ap-profile-avatar" />
            <h2 class="ap-profile-card__name">Laksh Solanki</h2>
            <p class="ap-profile-card__title">Senior Full-Stack Engineer</p>
            <div class="ap-profile-card__info">
              <div class="ap-info-row"><span class="ap-info-label">Experience</span><strong>4+ years</strong></div>
              <div class="ap-info-row"><span class="ap-info-label">Stack</span><strong>Vue + Node</strong></div>
              <div class="ap-info-row"><span class="ap-info-label">Based in</span><strong>India 🇮🇳</strong></div>
            </div>
            <div class="ap-profile-card__actions">
              <a class="ap-btn ap-btn--primary ap-btn--block" href="mailto:lakshsolanki848@gmail.com">Contact Me</a>
              <button class="ap-btn ap-btn--outline ap-btn--block" @click="copyEmail">Copy Email</button>
            </div>
            <div class="ap-profile-card__socials">
              <a href="https://github.com/laksh-solanki" target="_blank" class="ap-social-btn" aria-label="GitHub">
                <v-icon icon="mdi-github" />
              </a>
              <a href="https://mindlytic.onrender.com/" target="_blank" class="ap-social-btn" aria-label="Website">
                <v-icon icon="mdi-web" />
              </a>
              <a href="https://www.linkedin.com" target="_blank" class="ap-social-btn" aria-label="LinkedIn">
                <v-icon icon="mdi-linkedin" />
              </a>
            </div>
          </div>
        </aside>

        <!-- Main content column -->
        <div class="ap-main-col">

          <!-- Intro card -->
          <div class="ap-card ai-6">
            <p class="ap-card__overline">Developer Profile</p>
            <h3 class="ap-card__headline">I build products that stay maintainable as they scale.</h3>
            <p class="ap-card__body">
              I help teams turn ideas into fast, reliable web apps with a practical engineering workflow.
              My focus is clean architecture, clear communication, and shipping features that solve real problems.
            </p>
          </div>

          <!-- Career highlights bento -->
          <div class="ap-card ai-7">
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
          <div class="ap-card ai-8">
            <p class="ap-card__overline">Experience Timeline</p>
            <div class="ap-timeline">
              <div v-for="(job, i) in experiences" :key="job.role" class="ap-timeline__item">
                <div class="ap-timeline__aside">
                  <span class="ap-timeline__period">{{ job.period }}</span>
                </div>
                <div class="ap-timeline__connector">
                  <div class="ap-timeline__dot" :class="`ap-timeline__dot--${i}`"></div>
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
          <div class="ap-card ai-9">
            <p class="ap-card__overline">Stack &amp; Expertise</p>
            <div class="ap-skills-grid">
              <div v-for="group in skillGroups" :key="group.title" class="ap-skill-group">
                <p class="ap-skill-group__title">{{ group.title }}</p>
                <div class="ap-chips">
                  <span v-for="skill in group.skills" :key="skill" class="ap-chip">{{ skill }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ───────── MISSION ───────── -->
    <section class="ap-section">
      <div class="ap-container">
        <div class="ap-mission-card ai-10">
          <div class="ap-mission-card__img-col">
            <v-img :src="aboutPhoto2" cover class="ap-mission-img" />
            <div class="ap-mission-card__img-badge">
              <v-icon icon="mdi-rocket-launch" size="18" />
              Launched 15+ products
            </div>
          </div>
          <div class="ap-mission-card__text-col">
            <p class="ap-kicker">Mission</p>
            <h2 class="ap-section-headline">Build products that users trust and teams can scale</h2>
            <p class="ap-muted-copy">
              Mindlytic focuses on practical engineering decisions that support long-term product growth.
              Interfaces intuitive, codebases maintainable, features delivered with consistency.
            </p>
            <ul class="ap-check-list">
              <li v-for="point in missionPoints" :key="point" class="ap-check-list__item">
                <v-icon icon="mdi-check-circle" class="ap-check-list__icon" />
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── STRENGTHS ───────── -->
    <section class="ap-section">
      <div class="ap-container">
        <div class="ap-section-head ai-11">
          <p class="ap-kicker">Core Strengths</p>
          <h2 class="ap-section-headline">Why teams work with Mindlytic</h2>
        </div>
        <div class="ap-strengths-grid">
          <div
            v-for="(card, i) in strengths"
            :key="card.title"
            class="ap-strength-card"
            :style="`--i:${i}`"
          >
            <div class="ap-strength-card__icon-wrap">
              <v-icon :icon="card.icon" class="ap-strength-card__icon" />
            </div>
            <h3 class="ap-strength-card__title">{{ card.title }}</h3>
            <p class="ap-strength-card__desc">{{ card.description }}</p>
            <div class="ap-strength-card__footer">
              <span class="ap-strength-card__tag">Core skill</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── PROCESS ───────── -->
    <section class="ap-section ap-section--last">
      <div class="ap-container">
        <div class="ap-process-wrap ai-12">
          <div class="ap-process-wrap__head">
            <p class="ap-kicker">Workflow</p>
            <h2 class="ap-section-headline">How projects are delivered</h2>
          </div>
          <div class="ap-process-grid">
            <div
              v-for="(step, i) in processSteps"
              :key="step.title"
              class="ap-process-step"
              :style="`--i:${i}`"
            >
              <div class="ap-process-step__num">0{{ i + 1 }}</div>
              <div class="ap-process-step__line"></div>
              <h3 class="ap-process-step__title">{{ step.title }}</h3>
              <p class="ap-process-step__desc">{{ step.description }}</p>
            </div>
          </div>
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
const myPhoto = getMediaUrl("Picture/my-pic.jpg");

const alertVisible = ref(false);
const alertMessage = ref("");
const alertType = ref("success");

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
  { title: "Frontend", skills: ["Vue 3", "Vuetify", "Tailwind", "Pinia", "Accessibility", "Responsive UX"] },
  { title: "Backend", skills: ["Node.js", "Fastify", "MongoDB", "REST APIs", "Auth", "Validation"] },
  { title: "Tooling", skills: ["Vite", "Git", "pnpm", "Postman", "VS Code", "Deployment"] },
  { title: "Workflow", skills: ["Feature Planning", "Code Review", "Refactoring", "Debugging", "Documentation"] },
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
/* ─── TOKENS ──────────────────────────────────────── */
.about-page {
  --ap-primary:        #0f8f7c;
  --ap-primary-dim:    rgba(15, 143, 124, 0.12);
  --ap-primary-soft:   rgba(15, 143, 124, 0.08);
  --ap-secondary:      #d18a1f;
  --ap-secondary-dim:  rgba(209, 138, 31, 0.14);
  --ap-ink:            #0e201d;
  --ap-ink-soft:       #1e3530;
  --ap-muted:          #5e706a;
  --ap-surface:        #ffffff;
  --ap-surface-soft:   rgba(255, 255, 255, 0.88);
  --ap-border:         rgba(15, 143, 124, 0.15);
  --ap-border-strong:  rgba(15, 143, 124, 0.28);
  --ap-shadow-sm:      0 8px 24px rgba(14, 32, 29, 0.06);
  --ap-shadow-md:      0 16px 40px rgba(14, 32, 29, 0.08);
  --ap-shadow-lg:      0 24px 56px rgba(14, 32, 29, 0.12);
  --ap-radius:         20px;
  --ap-radius-sm:      14px;
  --ap-radius-xs:      8px;
  color: var(--ap-ink);
}

/* ─── LAYOUT ──────────────────────────────────────── */
.ap-container {
  width: 100%;
  max-width: min(1360px, 100%);
  margin-inline: auto;
  padding-inline: clamp(16px, 2vw, 28px);
}

.ap-section {
  padding-block: 56px;
}
.ap-section--last {
  padding-bottom: 96px;
}

/* ─── TYPOGRAPHY ──────────────────────────────────── */
.ap-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ap-primary);
  background: var(--ap-primary-soft);
  border: 1px solid var(--ap-border);
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 14px;
}

.ap-section-headline {
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.6rem, 2.4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
  background: linear-gradient(110deg, #0e201d 0%, #0b6f60 55%, #0f8f7c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px;
}

.ap-section-head {
  margin-bottom: 40px;
}

.ap-muted-copy {
  color: var(--ap-muted);
  font-size: 0.97rem;
  line-height: 1.8;
  margin: 0 0 20px;
}

/* Override kicker inside dark hero to match HomePage teal glow style */
.ap-hero .ap-kicker {
  color: #39bca3;
  background: rgba(15, 143, 124, 0.1);
  border-color: rgba(15, 143, 124, 0.26);
}

/* ─── HERO ──────────────────────────────────────────── */
.ap-hero {
  position: relative;
  overflow: hidden;
  border-bottom: none;
  background:
    radial-gradient(ellipse 80% 60% at 68% 44%, rgba(15,143,124,0.22) 0%, transparent 58%),
    radial-gradient(ellipse 60% 50% at 12% 82%, rgba(99,60,232,0.15) 0%, transparent 52%),
    linear-gradient(138deg, #061210 0%, #071a14 35%, #080e1c 65%, #060c18 100%);
  padding-block: 80px 64px;
}

/* ── Dark hero mesh (matching HomePage hero-v2) ── */
.ap-hero__mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.mesh-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  pointer-events: none;
  animation: orbFloat 12s ease-in-out infinite alternate;
}
.mesh-orb--1 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, rgba(15,143,124,0.35) 0%, transparent 70%);
  top: -140px; left: -100px;
  animation-duration: 16s;
}
.mesh-orb--2 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(57,188,163,0.22) 0%, transparent 70%);
  bottom: -120px; right: 5%;
  animation-duration: 12s;
  animation-delay: -4s;
}
.mesh-orb--3 {
  width: 340px; height: 340px;
  background: radial-gradient(circle, rgba(99,60,232,0.12) 0%, transparent 70%);
  top: 30%; right: 28%;
  animation-duration: 18s;
  animation-delay: -8s;
}
.mesh-grid {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg,   rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 64px),
    repeating-linear-gradient(90deg,  rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 64px);
  pointer-events: none;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(24px, -18px) scale(1.08); }
}

.ap-hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 480px;
  gap: 48px;
  align-items: center;
}

.ap-hero__headline {
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(2.6rem, 4.8vw, 4.4rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.0;
  color: #ffffff;
  margin: 0 0 20px;
}
.ap-hero__accent {
  font-style: normal;
  background: linear-gradient(92deg, #39bca3 0%, #0f8f7c 48%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ap-hero__sub {
  font-size: clamp(0.96rem, 1.2vw, 1.06rem);
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.8;
  max-width: 54ch;
  margin: 0 0 32px;
}

.ap-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* ─── BUTTONS ────────────────────────────────────── */
.ap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  border: none;
  outline: none;
  cursor: pointer;
  border-radius: 999px;
  padding: 10px 24px;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  white-space: nowrap;
}
.ap-btn--primary {
  background: linear-gradient(135deg, #0f8f7c, #0b6f60);
  color: #ffffff;
  box-shadow: 0 6px 20px rgba(15,143,124,0.42);
}
.ap-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(15,143,124,0.58);
}
/* Ghost button on dark hero background */
.ap-hero .ap-btn--ghost {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
}
.ap-hero .ap-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.32);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0,0,0,0.22);
}
.ap-btn--outline {
  background: transparent;
  color: var(--ap-primary);
  border: 1.5px solid var(--ap-border-strong);
}
.ap-btn--outline:hover {
  background: var(--ap-primary-soft);
  transform: translateY(-1px);
}
.ap-btn--block {
  width: 100%;
}

/* ─── BENTO GRID ──────────────────────────────────── */
.ap-hero__bento {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto auto auto;
  gap: 12px;
}

/* Dark glass bento cards on dark hero */
.ap-bento-card {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--ap-radius-sm);
  padding: 18px 18px 16px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}
.ap-bento-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.09);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4);
}
.ap-bento-card__accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #7cf5d0, #39bca3);
  border-radius: 3px 3px 0 0;
}
.ap-bento-card--0 .ap-bento-card__accent,
.ap-bento-card--2 .ap-bento-card__accent { background: linear-gradient(90deg, #7cf5d0, #39bca3); }
.ap-bento-card--1 .ap-bento-card__accent,
.ap-bento-card--3 .ap-bento-card__accent { background: linear-gradient(90deg, #a78bfa, #60a5fa); }

.ap-bento-card__value {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0 0 4px;
}
.ap-bento-card__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Profile mini-card — dark glass on hero */
.ap-bento-profile {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--ap-radius-sm);
  padding: 14px 16px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
}
.ap-bento-profile__name {
  font-weight: 800;
  font-size: 0.92rem;
  color: #ffffff;
  margin: 0 0 2px;
}
.ap-bento-profile__role {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
}

:deep(.ap-bento-avatar) {
  border: 2.5px solid rgba(255, 255, 255, 0.22) !important;
  box-shadow: 0 4px 16px rgba(122, 65, 255, 0.32) !important;
  flex-shrink: 0;
}

.ap-bento-badge {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #39bca3;
  background: rgba(15, 143, 124, 0.1);
  border: 1px solid rgba(15, 143, 124, 0.26);
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.ap-bento-badge__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #39bca3;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(57, 188, 163, 0.6); }
  50%       { box-shadow: 0 0 0 5px rgba(57, 188, 163, 0); }
}

.ap-bento-img {
  grid-column: 1 / -1;
  height: 200px;
  border-radius: var(--ap-radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.10);
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.30);
}

/* ─── PROFILE LAYOUT ─────────────────────────────── */
.ap-profile-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}

.ap-profile-sidebar {
  position: sticky;
  top: 88px;
}

/* profile card */
.ap-profile-card {
  position: relative;
  overflow: hidden;
  background: rgba(255,255,255,0.85);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  padding: 28px 22px 22px;
  box-shadow: var(--ap-shadow-md);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
}
.ap-profile-card__glow {
  position: absolute;
  top: -60px; left: 50%;
  transform: translateX(-50%);
  width: 280px; height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15,143,124,0.18), transparent 60%);
  pointer-events: none;
}

:deep(.ap-profile-avatar) {
  border: 3px solid rgba(255,255,255, 0.95) !important;
  box-shadow: 0 8px 28px rgba(15,143,124,0.26) !important;
  margin-bottom: 14px;
}

.ap-profile-card__name {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--ap-ink);
  margin: 0 0 4px;
}
.ap-profile-card__title {
  font-size: 0.8rem;
  color: var(--ap-muted);
  margin: 0 0 20px;
}

.ap-profile-card__info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  text-align: left;
  border-top: 1px solid var(--ap-border);
  padding-top: 18px;
}
.ap-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}
.ap-info-label {
  color: var(--ap-muted);
}
.ap-info-row strong {
  color: var(--ap-ink);
  font-weight: 700;
}

.ap-profile-card__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.ap-profile-card__socials {
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--ap-border);
  padding-top: 18px;
  width: 100%;
  justify-content: center;
}
.ap-social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--ap-primary-soft);
  border: 1px solid var(--ap-border);
  color: var(--ap-primary);
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.ap-social-btn:hover {
  background: var(--ap-primary-dim);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15,143,124,0.15);
}

/* ─── MAIN CONTENT CARDS ──────────────────────────── */
.ap-main-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ap-card {
  background: rgba(255,255,255,0.85);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  padding: 28px 28px 24px;
  box-shadow: var(--ap-shadow-sm);
  backdrop-filter: blur(12px);
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}
.ap-card:hover {
  box-shadow: var(--ap-shadow-md);
  border-color: var(--ap-border-strong);
}
.ap-card__overline {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ap-primary);
  margin: 0 0 10px;
}
.ap-card__headline {
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.2rem, 1.8vw, 1.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(110deg, #0e201d 0%, #0b6f60 60%, #0f8f7c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
}
.ap-card__body {
  color: var(--ap-muted);
  font-size: 0.96rem;
  line-height: 1.75;
  margin: 0;
}

/* highlights grid */
.ap-highlights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.ap-highlight-cell {
  background: rgba(15,143,124,0.03);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius-sm);
  padding: 18px 16px;
  backdrop-filter: blur(8px);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.ap-highlight-cell:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(15,143,124,0.08);
  border-color: var(--ap-border-strong);
}
.ap-highlight-cell__value {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #0b6f60, #0f8f7c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 4px;
}
.ap-highlight-cell__title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ap-ink);
  margin: 0 0 4px;
}
.ap-highlight-cell__caption {
  font-size: 0.76rem;
  color: var(--ap-muted);
  margin: 0;
  line-height: 1.5;
}

/* ─── TIMELINE ──────────────────────────────────── */
.ap-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.ap-timeline__item {
  display: grid;
  grid-template-columns: 100px 28px 1fr;
  gap: 0 14px;
  align-items: start;
}
.ap-timeline__aside {
  padding-top: 8px;
  text-align: right;
}
.ap-timeline__period {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--ap-muted);
  white-space: nowrap;
}
.ap-timeline__connector {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ap-timeline__dot {
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 3px solid var(--ap-surface);
  box-shadow: 0 0 0 3px var(--ap-primary);
  flex-shrink: 0;
  margin-top: 6px;
}
.ap-timeline__dot--1 { box-shadow: 0 0 0 3px #5b8bd1; }
.ap-timeline__dot--2 { box-shadow: 0 0 0 3px #d18a1f; }

.ap-timeline__line {
  width: 2px;
  flex: 1;
  min-height: 32px;
  background: linear-gradient(to bottom, var(--ap-border-strong), var(--ap-border));
  margin-block: 4px;
}
.ap-timeline__body {
  padding: 4px 0 28px;
}
.ap-timeline__role {
  font-size: 0.96rem;
  font-weight: 800;
  color: var(--ap-ink);
  margin: 0 0 4px;
}
.ap-timeline__company {
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--ap-primary);
  margin: 0 0 6px;
}
.ap-timeline__summary {
  font-size: 0.87rem;
  color: var(--ap-muted);
  line-height: 1.65;
  margin: 0;
}

/* ─── SKILLS ──────────────────────────────────────── */
.ap-skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.ap-skill-group__title {
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ap-ink-soft);
  margin: 0 0 10px;
}
.ap-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ap-chip {
  font-size: 0.76rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--ap-primary-soft);
  border: 1px solid var(--ap-border);
  color: var(--ap-primary);
  transition: background 0.18s ease, transform 0.18s ease;
}
.ap-chip:hover {
  background: var(--ap-primary-dim);
  transform: translateY(-1px);
}

/* ─── MISSION ──────────────────────────────────────── */
.ap-mission-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  background: rgba(255,255,255,0.85);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  overflow: hidden;
  box-shadow: var(--ap-shadow-md);
  backdrop-filter: blur(14px);
}
.ap-mission-card__img-col {
  position: relative;
  min-height: 340px;
}
.ap-mission-img {
  height: 100%;
  min-height: 340px;
}
.ap-mission-card__img-badge {
  position: absolute;
  bottom: 16px; left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(255,255,255,0.95);
  border: 1px solid var(--ap-border);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ap-ink);
  box-shadow: var(--ap-shadow-sm);
  backdrop-filter: blur(10px);
}
.ap-mission-card__text-col {
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ap-check-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ap-check-list__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ap-ink-soft);
  line-height: 1.5;
}
.ap-check-list__icon {
  color: var(--ap-primary) !important;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ─── STRENGTHS ──────────────────────────────────── */
.ap-strengths-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.ap-strength-card {
  position: relative;
  overflow: hidden;
  background: rgba(255,255,255,0.85);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  padding: 28px 24px;
  box-shadow: var(--ap-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease, border-color 0.28s ease;
  animation: slideUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  animation-delay: calc(var(--i, 0) * 0.12s + 0.1s);
  backdrop-filter: blur(12px);
}
.ap-strength-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(15,143,124,0.06) 0%, transparent 60%);
  border-radius: inherit;
}
.ap-strength-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--ap-shadow-md);
  border-color: var(--ap-border-strong);
}

.ap-strength-card__icon-wrap {
  width: 48px; height: 48px;
  border-radius: var(--ap-radius-xs);
  background: var(--ap-primary-soft);
  border: 1px solid var(--ap-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ap-strength-card__icon {
  color: var(--ap-primary) !important;
}
.ap-strength-card__title {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  background: linear-gradient(110deg, #0e201d 0%, #0b6f60 60%, #0f8f7c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}
.ap-strength-card__desc {
  font-size: 0.88rem;
  color: var(--ap-muted);
  line-height: 1.7;
  margin: 0;
  flex: 1;
}
.ap-strength-card__footer {
  margin-top: auto;
}
.ap-strength-card__tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ap-primary);
  background: var(--ap-primary-soft);
  border: 1px solid var(--ap-border);
  padding: 3px 10px;
  border-radius: 999px;
}

/* ─── PROCESS ────────────────────────────────────── */
.ap-process-wrap {
  background:
    radial-gradient(ellipse at 8% 12%, rgba(15,143,124,0.06) 0%, transparent 48%),
    radial-gradient(ellipse at 90% 85%, rgba(57,188,163,0.06) 0%, transparent 45%),
    linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(244,249,247,0.8) 100%);
  border: 1px solid var(--ap-border);
  border-radius: var(--ap-radius);
  padding: 40px 36px;
  box-shadow: var(--ap-shadow-md);
  overflow: hidden;
  backdrop-filter: blur(14px);
}
.ap-process-wrap__head {
  margin-bottom: 36px;
}

.ap-process-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  position: relative;
}
.ap-process-grid::before {
  content: "";
  position: absolute;
  top: 28px; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--ap-primary), rgba(15,143,124,0.12));
  z-index: 0;
}

.ap-process-step {
  position: relative;
  padding: 0 24px 0 0;
  animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
  animation-delay: calc(var(--i, 0) * 0.14s + 0.2s);
}

.ap-process-step__num {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0f8f7c, #0b6f60);
  color: #ffffff;
  font-family: "Space Grotesk", sans-serif;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: 0 6px 20px rgba(15,143,124,0.38);
  margin-bottom: 16px;
}

.ap-process-step__line {
  display: none;
}

.ap-process-step__title {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: var(--ap-ink);
  margin: 0 0 8px;
}
.ap-process-step__desc {
  font-size: 0.87rem;
  color: var(--ap-muted);
  line-height: 1.7;
  margin: 0;
  max-width: 28ch;
}

/* ─── ENTRANCE ANIMATIONS ────────────────────────── */
.ai-0, .ai-1, .ai-2, .ai-3, .ai-4,
.ai-5, .ai-6, .ai-7, .ai-8, .ai-9,
.ai-10, .ai-11, .ai-12 {
  opacity: 0;
  animation: slideUp 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.ai-0  { animation-delay: 0.05s; }
.ai-1  { animation-delay: 0.13s; }
.ai-2  { animation-delay: 0.21s; }
.ai-3  { animation-delay: 0.29s; }
.ai-4  { animation-delay: 0.35s; }
.ai-5  { animation-delay: 0.12s; }
.ai-6  { animation-delay: 0.18s; }
.ai-7  { animation-delay: 0.26s; }
.ai-8  { animation-delay: 0.34s; }
.ai-9  { animation-delay: 0.42s; }
.ai-10 { animation-delay: 0.14s; }
.ai-11 { animation-delay: 0.10s; }
.ai-12 { animation-delay: 0.16s; }

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── RESPONSIVE ─────────────────────────────────── */
@media (max-width: 1200px) {
  .ap-hero__inner {
    grid-template-columns: 1fr 420px;
    gap: 36px;
  }
  .ap-profile-layout {
    grid-template-columns: 260px 1fr;
    gap: 24px;
  }
  .ap-strengths-grid {
    gap: 14px;
  }
}

@media (max-width: 960px) {
  .ap-hero {
    padding-block: 56px 48px;
  }
  .ap-hero__inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .ap-hero__bento {
    grid-template-columns: repeat(2, 1fr);
  }
  .ap-hero__sub {
    max-width: none;
  }
  .ap-profile-layout {
    grid-template-columns: 1fr;
  }
  .ap-profile-sidebar {
    position: static;
  }
  .ap-profile-card {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    text-align: left;
    align-items: flex-start;
  }
  :deep(.ap-profile-avatar) {
    margin-bottom: 0 !important;
  }
  .ap-profile-card__name,
  .ap-profile-card__title {
    text-align: left;
    width: 100%;
  }
  .ap-mission-card {
    grid-template-columns: 1fr;
  }
  .ap-mission-card__img-col {
    min-height: 260px;
  }
  .ap-strengths-grid {
    grid-template-columns: 1fr;
  }
  .ap-process-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .ap-process-grid::before { display: none; }
  .ap-process-step {
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .ap-hero__headline {
    font-size: clamp(2.2rem, 9vw, 3rem);
  }
  .ap-hero__bento {
    grid-template-columns: 1fr 1fr;
  }
  .ap-highlights-grid {
    grid-template-columns: 1fr 1fr;
  }
  .ap-skills-grid {
    grid-template-columns: 1fr;
  }
  .ap-timeline__item {
    grid-template-columns: 80px 24px 1fr;
  }
  .ap-card, .ap-profile-card, .ap-strength-card {
    padding: 20px 18px;
  }
  .ap-profile-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .ap-profile-card__name,
  .ap-profile-card__title {
    text-align: center;
  }
  .ap-mission-card__text-col {
    padding: 28px 18px;
  }
  .ap-process-wrap {
    padding: 28px 18px;
  }
  .ap-section {
    padding-block: 40px;
  }
}

@media (max-width: 440px) {
  .ap-hero__bento {
    grid-template-columns: 1fr;
  }
  .ap-highlights-grid {
    grid-template-columns: 1fr;
  }
  .ap-bento-badge {
    display: none;
  }
  .ap-timeline__item {
    grid-template-columns: 24px 1fr;
    gap: 0 12px;
  }
  .ap-timeline__aside {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-0, .ai-1, .ai-2, .ai-3, .ai-4,
  .ai-5, .ai-6, .ai-7, .ai-8, .ai-9,
  .ai-10, .ai-11, .ai-12,
  .ap-strength-card,
  .ap-process-step {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .mesh-orb { animation: none; }
}
</style>
