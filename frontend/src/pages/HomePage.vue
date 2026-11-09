<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const myPhotoBg = getMediaUrl("Picture/my-pic.jpeg");

const typedRoles = [
  "Full‑Stack Developer",
  "Vue.js Specialist",
  "Node.js Engineer",
  "UI/UX Craftsman",
];
const typedText = ref("");
const roleIndex = ref(0);
const charIndex = ref(0);
const isDeleting = ref(false);
let typingTimeout = null;

function typeLoop() {
  const current = typedRoles[roleIndex.value];
  if (!isDeleting.value) {
    typedText.value = current.slice(0, charIndex.value + 1);
    charIndex.value++;
    if (charIndex.value === current.length) {
      isDeleting.value = true;
      typingTimeout = setTimeout(typeLoop, 1800);
      return;
    }
  } else {
    typedText.value = current.slice(0, charIndex.value - 1);
    charIndex.value--;
    if (charIndex.value === 0) {
      isDeleting.value = false;
      roleIndex.value = (roleIndex.value + 1) % typedRoles.length;
    }
  }
  typingTimeout = setTimeout(typeLoop, isDeleting.value ? 48 : 80);
}

onMounted(() => { typingTimeout = setTimeout(typeLoop, 600); });
onUnmounted(() => clearTimeout(typingTimeout));

const impactStats = [
  { value: "50+", label: "Projects Delivered" },
  { value: "4+", label: "Years Building Web Apps" },
  { value: "99%", label: "Client Satisfaction" },
];

const techStack = [
  "Vue 3",
  "Vuetify",
  "Node.js",
  "MongoDB",
  "Fastify",
  "REST APIs",
  "Modern CSS",
  "Web Performance",
];

const deliveryFocus = [
  "Rapid MVP execution with clean architecture",
  "Performance-first frontend and API design",
  "Accessible, responsive UI across devices",
  "Transparent milestones with continuous progress",
];

const collaborationSteps = [
  {
    step: "01",
    title: "Scope",
    description:
      "Define the user journey, set focused milestones, and align on technical priorities.",
  },
  {
    step: "02",
    title: "Build",
    description:
      "Ship in small, testable increments with clear communication and production-quality code.",
  },
  {
    step: "03",
    title: "Refine",
    description:
      "Polish UX details, tighten performance, and capture feedback before final release.",
  },
];

const valuePillars = [
  {
    title: "Clarity",
    description:
      "I keep requirements concrete and decisions documented, so projects move forward with zero friction.",
    icon: "mdi-compass-outline",
  },
  {
    title: "Reliability",
    description:
      "Code is structured for maintainability, predictable behavior, and sustained product growth.",
    icon: "mdi-shield-check-outline",
  },
  {
    title: "Momentum",
    description:
      "You see measurable progress early and often with milestones that are practical and visible.",
    icon: "mdi-rocket-launch-outline",
  },
];

const premiumStackNodes = [
  {
    id: "vue",
    label: "Vue 3 Ecosystem",
    icon: "mdi-vuejs",
    ring: "#7C0E44",
    desc: "Building highly reactive, component-driven user interfaces with the Composition API.",
  },
  {
    id: "node",
    label: "Node.js & Fastify",
    icon: "mdi-nodejs",
    ring: "#AA5E7A",
    desc: "Developing blazing-fast, scalable backend services and RESTful APIs.",
  },
  {
    id: "javascript",
    label: "Modern JavaScript",
    icon: "mdi-language-javascript",
    ring: "#7C0E44",
    desc: "Leveraging ES6+ for robust, maintainable application logic and rich interactions.",
  },
  {
    id: "mongodb",
    label: "MongoDB",
    icon: "mdi-database",
    ring: "#AA5E7A",
    desc: "Designing flexible, high-performance NoSQL database schemas.",
  },
  {
    id: "css",
    label: "Advanced CSS",
    icon: "mdi-language-css3",
    ring: "#D49A9A",
    desc: "Crafting fluid, accessible, and ultra-responsive modern layouts.",
  },
  {
    id: "vuetify",
    label: "Vuetify & UI Libraries",
    icon: "mdi-view-dashboard",
    ring: "#5C2D46",
    desc: "Accelerating development with polished, accessible Material Design components.",
  },
];
</script>

<template>
  <v-container class="home-shell animate-fade-in-up">
    <!-- ═══ HERO SECTION ═══ -->
    <section class="hero-light mb-12 mb-md-16" aria-label="Hero">
      <div class="hero-inner">
        <!-- LEFT: Copy & CTAs -->
        <div class="hero-copy-block">
          <h1 class="hero-title mb-3">
            Hi, I'm <span class="hero-name-accent">Laksh</span>
            <br />
            <span class="hero-title-sub">Solanki</span>
          </h1>

          <div class="hero-role mb-4">
            <span class="hero-role-prefix">—&nbsp;</span>
            <span class="hero-typed-text">{{ typedText }}</span>
            <span class="hero-cursor" aria-hidden="true">|</span>
          </div>

          <p class="hero-bio mb-6">
            I craft blazing-fast web applications with Vue 3,
            Node.js &amp; MongoDB — turning complex ideas into
            clean, elegant, and maintainable digital products.
          </p>

          <!-- Stat pills -->
          <div class="hero-stat-pills mb-8">
            <div v-for="stat in impactStats" :key="stat.label" class="hero-pill-item">
              <span class="hero-pill-val">{{ stat.value }}</span>
              <span class="hero-pill-lbl">{{ stat.label }}</span>
            </div>
          </div>

          <!-- CTAs -->
          <div class="hero-cta-row d-flex flex-wrap ga-3 mb-8">
            <v-btn
              color="primary"
              size="large"
              rounded="xl"
              class="hero-btn-primary text-none px-7 font-weight-bold"
              to="/projects"
              prepend-icon="mdi-rocket-launch-outline"
              elevation="0"
            >
              Explore Projects
            </v-btn>
            <v-btn
              variant="outlined"
              size="large"
              color="primary"
              rounded="xl"
              class="hero-btn-outline text-none px-7 font-weight-bold"
              to="/about"
              elevation="0"
            >
              <v-icon start>mdi-account-outline</v-icon>
              About Me
            </v-btn>
          </div>

          <!-- Tech stack chips -->
          <div class="hero-chips d-flex flex-wrap ga-2">
            <span v-for="skill in techStack" :key="skill" class="hero-tech-chip">
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- RIGHT: Photo & Badges -->
        <div class="hero-visual-block">
          <div class="hero-photo-stage">
            <div class="hero-photo-ring"></div>
            <div class="hero-photo-backdrop"></div>
            <img :src="myPhotoBg" alt="Laksh Solanki" class="hero-photo" draggable="false" />

            <!-- Floating minimal badges -->
            <div class="hero-float-badge badge-vue">
              <v-icon size="18" color="primary">mdi-vuejs</v-icon>
              <span>Vue 3 Ecosystem</span>
            </div>
            <div class="hero-float-badge badge-node">
              <v-icon size="18" color="secondary">mdi-nodejs</v-icon>
              <span>Node.js Backend</span>
            </div>
            <div class="hero-float-badge badge-exp">
              <v-icon size="16" color="primary">mdi-star-outline</v-icon>
              <span>4+ Years Exp</span>
            </div>
            <div class="hero-float-badge badge-loc">
              <v-icon size="16" color="secondary">mdi-map-marker-outline</v-icon>
              <span>Gujarat, India</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ STATS CARDS ═══ -->
    <section class="mb-12 mb-md-16">
      <v-row>
        <v-col v-for="stat in impactStats" :key="stat.label" cols="12" sm="4">
          <div class="stat-card p-6 text-center">
            <p class="stat-card-val mb-1">{{ stat.value }}</p>
            <p class="stat-card-lbl mb-0">{{ stat.label }}</p>
          </div>
        </v-col>
      </v-row>
    </section>

    <!-- ═══ CORE STACK (What I Build) ═══ -->
    <section class="mb-12 mb-md-16">
      <div class="section-header d-flex justify-space-between align-end mb-8 flex-wrap ga-4">
        <div>
          <span class="section-kicker">Core Stack</span>
          <h2 class="section-heading mb-0">Technologies I build with</h2>
        </div>
        <v-btn
          to="/projects"
          variant="outlined"
          rounded="xl"
          class="text-none font-weight-bold"
          append-icon="mdi-arrow-right"
        >
          See All Projects
        </v-btn>
      </div>

      <div class="stack-grid">
        <div v-for="node in premiumStackNodes" :key="node.id" class="stack-node-card">
          <div class="stack-node-icon" :style="{ color: node.ring, background: `${node.ring}12` }">
            <v-icon :icon="node.icon" size="28" />
          </div>
          <div class="stack-node-content">
            <h3 class="stack-node-title mb-2">{{ node.label }}</h3>
            <p class="stack-node-desc mb-0">{{ node.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ COLLABORATION MODEL (How I Deliver) ═══ -->
    <section class="mb-12 mb-md-16">
      <div class="section-header mb-8">
        <span class="section-kicker">Collaboration Model</span>
        <h2 class="section-heading mb-0">How I Deliver</h2>
      </div>

      <div class="collab-panel p-6 p-md-8">
        <v-row class="ga-0" align="start">
          <v-col cols="12" md="5" class="pr-md-8 mb-6 mb-md-0">
            <h3 class="collab-subhead mb-3">
              Minimal process, maximum clarity and execution.
            </h3>
            <p class="collab-subdesc mb-6">
              I partner closely with teams to keep product delivery lean, practical, and
              laser-focused on real outcomes.
            </p>
            <div class="d-flex flex-column ga-2">
              <div v-for="item in deliveryFocus" :key="item" class="delivery-check-item d-flex align-center">
                <v-icon size="18" color="primary" class="mr-2">mdi-check-circle-outline</v-icon>
                <span>{{ item }}</span>
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="7">
            <div class="collab-steps-list">
              <article v-for="item in collaborationSteps" :key="item.step" class="collab-step-item d-flex ga-4 mb-4">
                <span class="collab-step-number">{{ item.step }}</span>
                <div>
                  <h4 class="collab-step-title my-1">{{ item.title }}</h4>
                  <p class="collab-step-desc mb-0">{{ item.description }}</p>
                </div>
              </article>
            </div>
          </v-col>
        </v-row>
      </div>
    </section>

    <!-- ═══ VALUES ═══ -->
    <section class="mb-12 mb-md-16">
      <div class="section-header mb-8">
        <span class="section-kicker">Core Principles</span>
        <h2 class="section-heading mb-0">What You Can Expect</h2>
      </div>

      <v-row class="mb-8">
        <v-col v-for="pillar in valuePillars" :key="pillar.title" cols="12" md="4">
          <div class="pillar-card p-6 h-100">
            <div class="pillar-icon mb-4">
              <v-icon :icon="pillar.icon" size="24" color="primary"></v-icon>
            </div>
            <h3 class="pillar-title mb-2">{{ pillar.title }}</h3>
            <p class="pillar-desc mb-0">{{ pillar.description }}</p>
          </div>
        </v-col>
      </v-row>

      <!-- CTA Banner -->
      <div class="cta-banner p-8 p-md-12 text-center text-md-left d-flex flex-column flex-md-row align-center justify-space-between ga-6">
        <div>
          <h3 class="cta-banner-title mb-2">Looking for a focused development partner?</h3>
          <p class="cta-banner-sub mb-0">Explore projects or review my profile to see how I build and deliver.</p>
        </div>
        <div class="d-flex flex-wrap ga-3">
          <v-btn to="/projects" rounded="xl" size="large" class="cta-banner-btn-primary text-none px-7 font-weight-bold" elevation="0">
            <v-icon start>mdi-rocket-launch-outline</v-icon>
            Browse Projects
          </v-btn>
          <v-btn to="/about" variant="outlined" rounded="xl" size="large" class="cta-banner-btn-outline text-none px-7 font-weight-bold" elevation="0">
            <v-icon start>mdi-account-outline</v-icon>
            About Me
          </v-btn>
        </div>
      </div>
    </section>
  </v-container>
</template>

<style scoped>
.home-shell {
  position: relative;
  max-width: min(var(--page-max-width), 100%) !important;
}

/* ═══════════════════════════════════════════════
   HERO LIGHT - Elegant, Modern, Minimal
═══════════════════════════════════════════════ */
.hero-light {
  padding-top: clamp(20px, 4vw, 40px);
}

.hero-inner {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: clamp(28px, 4vw, 56px);
}

.hero-availability-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 100px;
  background: rgba(124, 14, 68, 0.06);
  border: 1px solid rgba(124, 14, 68, 0.16);
  color: var(--portfolio-primary, #7C0E44);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.hero-availability-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--portfolio-primary, #7C0E44);
}

.hero-title {
  font-size: clamp(1.95rem, 4.5vw, 4rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--portfolio-ink, #231219);
}

.hero-name-accent {
  color: var(--portfolio-primary, #7C0E44);
}

.hero-title-sub {
  color: var(--portfolio-ink, #231219);
}

.hero-role {
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1rem, 2vw, 1.45rem);
  font-weight: 600;
  color: var(--portfolio-secondary, #AA5E7A);
}

.hero-cursor {
  display: inline-block;
  color: var(--portfolio-primary, #7C0E44);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.hero-bio {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--portfolio-ink-soft, #4E3842);
  max-width: 52ch;
}

.hero-stat-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-pill-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.12);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(124, 14, 68, 0.04);
}

.hero-pill-val {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--portfolio-primary, #7C0E44);
}

.hero-pill-lbl {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--portfolio-muted, #7E636E);
}

.hero-btn-primary {
  background: var(--portfolio-primary, #7C0E44) !important;
  color: #FFFFFF !important;
  box-shadow: 0 4px 14px rgba(124, 14, 68, 0.2) !important;
  transition: all 0.2s ease;
}

.hero-btn-primary:hover {
  background: #901452 !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(124, 14, 68, 0.25) !important;
}

.hero-btn-outline {
  border-color: rgba(124, 14, 68, 0.2) !important;
  color: var(--portfolio-primary, #7C0E44) !important;
  background: #FFFFFF !important;
  transition: all 0.2s ease;
}

.hero-btn-outline:hover {
  border-color: var(--portfolio-primary, #7C0E44) !important;
  background: rgba(124, 14, 68, 0.05) !important;
  transform: translateY(-2px);
}

.hero-tech-chip {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  background: rgba(170, 94, 122, 0.08);
  border: 1px solid rgba(170, 94, 122, 0.18);
  color: var(--portfolio-primary, #7C0E44);
}

/* ═══════════════════════════════════════════════
   HERO VISUAL (Photo + Badges) - Normal Big Card
═══════════════════════════════════════════════ */
.hero-visual-block {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.hero-photo-stage {
  position: relative;
  width: clamp(340px, 36vw, 460px);
  max-width: 100%;
  aspect-ratio: 1 / 1.05;
  border-radius: 32px;
  background: #FFFFFF;
  border: 2px solid rgba(124, 14, 68, 0.14);
  box-shadow: 0 16px 44px rgba(124, 14, 68, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.hero-photo-ring {
  position: absolute;
  inset: -14px;
  border-radius: 40px;
  border: 1.5px dashed rgba(170, 94, 122, 0.32);
  pointer-events: none;
}

.hero-photo-backdrop {
  position: absolute;
  inset: 0;
  border-radius: 30px;
  background: linear-gradient(145deg, #FFFFFF 0%, #FAF3F0 100%);
  pointer-events: none;
}

.hero-photo {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 26px;
  display: block;
}

.hero-float-badge {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.12);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(124, 14, 68, 0.08);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--portfolio-ink, #231219);
  white-space: nowrap;
}

.badge-vue {
  top: 6%;
  left: -20px;
}

.badge-node {
  top: 20%;
  right: -24px;
}

.badge-exp {
  bottom: 16%;
  left: -18px;
}

.badge-loc {
  bottom: 6%;
  right: -18px;
}

/* ═══════════════════════════════════════════════
   STATS SECTION
═══════════════════════════════════════════════ */
.stat-card {
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.12);
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(124, 14, 68, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(124, 14, 68, 0.25);
  box-shadow: 0 8px 24px rgba(124, 14, 68, 0.08);
}

.stat-card-val {
  font-family: "Space Grotesk", sans-serif;
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
  color: var(--portfolio-primary, #7C0E44);
}

.stat-card-lbl {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--portfolio-muted, #7E636E);
}

/* ═══════════════════════════════════════════════
   SECTION HEADERS
═══════════════════════════════════════════════ */
.section-kicker {
  display: block;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--portfolio-primary, #7C0E44);
  margin-bottom: 6px;
}

.section-heading {
  font-size: clamp(1.6rem, 2.8vw, 2.3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--portfolio-ink, #231219);
}

/* ═══════════════════════════════════════════════
   STACK GRID
═══════════════════════════════════════════════ */
.stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}

.stack-node-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.12);
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 4px 16px rgba(124, 14, 68, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.stack-node-card:hover {
  transform: translateY(-3px);
  border-color: rgba(124, 14, 68, 0.25);
  box-shadow: 0 8px 24px rgba(124, 14, 68, 0.08);
}

.stack-node-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stack-node-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--portfolio-ink, #231219);
}

.stack-node-desc {
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--portfolio-muted, #7E636E);
}

/* ═══════════════════════════════════════════════
   COLLABORATION PANEL
═══════════════════════════════════════════════ */
.collab-panel {
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.12);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(124, 14, 68, 0.04);
}

.collab-subhead {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--portfolio-ink, #231219);
  line-height: 1.3;
}

.collab-subdesc {
  color: var(--portfolio-muted, #7E636E);
  line-height: 1.65;
}

.delivery-check-item {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--portfolio-ink-soft, #4E3842);
}

.collab-step-item {
  padding: 16px;
  border-radius: 14px;
  background: var(--portfolio-surface-soft, #FAF3F0);
  border: 1px solid rgba(124, 14, 68, 0.08);
}

.collab-step-number {
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--portfolio-primary, #7C0E44);
  background: rgba(124, 14, 68, 0.08);
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.collab-step-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--portfolio-ink, #231219);
}

.collab-step-desc {
  font-size: 0.86rem;
  color: var(--portfolio-muted, #7E636E);
  line-height: 1.55;
}

/* ═══════════════════════════════════════════════
   VALUES & CTA BANNER
═══════════════════════════════════════════════ */
.pillar-card {
  background: #FFFFFF;
  border: 1px solid rgba(124, 14, 68, 0.12);
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(124, 14, 68, 0.04);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.pillar-card:hover {
  transform: translateY(-3px);
  border-color: rgba(124, 14, 68, 0.25);
}

.pillar-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(124, 14, 68, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pillar-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--portfolio-ink, #231219);
}

.pillar-desc {
  font-size: 0.9rem;
  color: var(--portfolio-muted, #7E636E);
  line-height: 1.6;
}

.cta-banner {
  background: linear-gradient(135deg, #7C0E44 0%, #AA5E7A 100%);
  border-radius: 20px;
  color: #FFFFFF;
  padding: clamp(20px, 4vw, 44px);
  box-shadow: 0 8px 28px rgba(124, 14, 68, 0.2);
}

.cta-banner-title {
  font-size: clamp(1.35rem, 2.2vw, 1.85rem);
  font-weight: 800;
  color: #FFFFFF;
}

.cta-banner-sub {
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.95rem;
}

.cta-banner-btn-primary {
  background: #FFFFFF !important;
  color: var(--portfolio-primary, #7C0E44) !important;
}

.cta-banner-btn-primary:hover {
  background: #FAF3F0 !important;
  transform: translateY(-1px);
}

.cta-banner-btn-outline {
  border-color: rgba(255, 255, 255, 0.4) !important;
  color: #FFFFFF !important;
}

.cta-banner-btn-outline:hover {
  border-color: #FFFFFF !important;
  background: rgba(255, 255, 255, 0.1) !important;
  transform: translateY(-1px);
}

/* ═══════════════════════════════════════════════
   RESPONSIVE DESIGN
═══════════════════════════════════════════════ */
@media (max-width: 960px) {
  .hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-copy-block {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-bio {
    max-width: none;
  }

  .hero-stat-pills,
  .hero-cta-row,
  .hero-chips {
    justify-content: center;
  }

  .badge-vue { left: 0; }
  .badge-node { right: 0; }
  .badge-exp { left: 0; }
  .badge-loc { right: 0; }
}

@media (max-width: 600px) {
  .hero-float-badge {
    display: none;
  }

  .hero-photo-stage {
    width: min(340px, 100%);
    border-radius: 24px;
  }

  .hero-photo-ring {
    inset: -8px;
    border-radius: 28px;
  }

  .hero-photo {
    border-radius: 18px;
  }

  .stack-grid {
    grid-template-columns: 1fr;
  }

  .collab-panel {
    padding: 18px 14px;
  }

  .collab-step-item {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .hero-cta-row {
    width: 100%;
    flex-direction: column;
  }

  .hero-btn-primary,
  .hero-btn-outline {
    width: 100% !important;
    justify-content: center;
  }

  .hero-pill-item {
    flex: 1 1 100%;
    justify-content: center;
  }

  .cta-banner {
    padding: 20px 16px;
  }

  .cta-banner .d-flex {
    width: 100%;
    flex-direction: column;
  }

  .cta-banner-btn-primary,
  .cta-banner-btn-outline {
    width: 100% !important;
    justify-content: center;
  }
}

@media (max-width: 360px) {
  .hero-title {
    font-size: 1.85rem;
  }
  .hero-role {
    font-size: 0.95rem;
  }
}
</style>
