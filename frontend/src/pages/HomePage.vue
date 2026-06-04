<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const myPhotoBg = getMediaUrl("Picture/my-pic-no-bg.png");

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

const profileFacts = [
  { label: "Location", value: "Gujarat, India" },
  { label: "Availability", value: "Open for freelance" },
  { label: "Focus", value: "Developer Tools" },
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
  "Weekly demos with transparent progress",
];

const collaborationSteps = [
  {
    step: "01",
    title: "Scope",
    description:
      "Define the user journey, set a focused milestone, and align on technical priorities.",
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
      "I keep requirements concrete and decisions documented, so projects move with less friction.",
    icon: "mdi-compass-outline",
  },
  {
    title: "Reliability",
    description:
      "Code is structured for maintainability, predictable behavior, and long-term product growth.",
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
    ring: "#059669",
    desc: "Building highly reactive, component-driven user interfaces with the Composition API.",
  },
  {
    id: "node",
    label: "Node.js & Fastify",
    icon: "mdi-nodejs",
    ring: "#16a34a",
    desc: "Developing blazing-fast, scalable backend services and RESTful APIs.",
  },
  {
    id: "javascript",
    label: "Modern JavaScript",
    icon: "mdi-language-javascript",
    ring: "#ca8a04",
    desc: "Leveraging ES6+ for robust, maintainable application logic and rich interactions.",
  },
  {
    id: "mongodb",
    label: "MongoDB",
    icon: "mdi-database",
    ring: "#15803d",
    desc: "Designing flexible, high-performance NoSQL database schemas.",
  },
  {
    id: "css",
    label: "Advanced CSS",
    icon: "mdi-language-css3",
    ring: "#2563eb",
    desc: "Crafting fluid, accessible, and ultra-responsive modern layouts.",
  },
  {
    id: "vuetify",
    label: "Vuetify & UI Libraries",
    icon: "mdi-view-dashboard",
    ring: "#9333ea",
    desc: "Accelerating development with polished, accessible Material Design components.",
  },
];
</script>

<template>
  <v-container class="home-shell">
    <!-- ═══ HERO SECTION ═══ -->
    <section class="hero-v2 mb-10" aria-label="Hero">
      <!-- Background layers -->
      <div class="hero-v2-bg" aria-hidden="true">
        <div class="hero-v2-mesh"></div>
        <div class="hero-v2-blob hero-v2-blob-1"></div>
        <div class="hero-v2-blob hero-v2-blob-2"></div>
        <div class="hero-v2-blob hero-v2-blob-3"></div>
        <div class="hero-v2-grid"></div>
      </div>

      <div class="hero-v2-inner">
        <!-- LEFT copy -->
        <div class="hero-v2-copy">
          <div class="hero-v2-eyebrow startup-item" style="--delay:0.05s">
            <span class="hero-v2-eyebrow-dot"></span>
            Available for freelance
          </div>

          <h1 class="hero-v2-title startup-item" style="--delay:0.14s">
            Hi, I'm <span class="hero-v2-name-grad">Laksh</span>
            <br />
            <span class="hero-v2-title-line2">Solanki</span>
          </h1>

          <div class="hero-v2-role startup-item" style="--delay:0.22s">
            <span class="hero-v2-role-prefix">—&nbsp;</span>
            <span class="hero-v2-typed">{{ typedText }}</span>
            <span class="hero-v2-cursor" aria-hidden="true">|</span>
          </div>

          <p class="hero-v2-desc startup-item" style="--delay:0.3s">
            I craft blazing-fast web applications with Vue 3,
            Node.js &amp; MongoDB — turning complex ideas into
            elegant, maintainable products.
          </p>

          <!-- Stat pills -->
          <div class="hero-v2-stats startup-item" style="--delay:0.38s">
            <div v-for="stat in impactStats" :key="stat.label" class="hero-v2-stat-pill">
              <span class="hero-v2-stat-value">{{ stat.value }}</span>
              <span class="hero-v2-stat-label">{{ stat.label }}</span>
            </div>
          </div>

          <!-- CTAs -->
          <div class="hero-v2-ctas startup-item" style="--delay:0.46s">
            <v-btn color="primary" size="large" rounded="xl" class="hero-v2-btn-primary text-none px-7" to="/projects"
              prepend-icon="mdi-rocket-launch-outline" text="Explore Projects" elevation="0" />
            <v-btn variant="outlined" size="large" color="primary" rounded="xl"
              class="hero-v2-btn-outline text-none px-7" to="/about" elevation="0">
              <v-icon start>mdi-account-outline</v-icon>
              About Me
            </v-btn>
          </div>

          <!-- Tech chips -->
          <div class="hero-v2-chips">
            <span v-for="(skill, i) in techStack" :key="skill" class="hero-v2-chip startup-chip"
              :style="{ '--delay': `${0.52 + i * 0.045}s` }">{{ skill }}</span>
          </div>
        </div>

        <!-- RIGHT photo -->
        <div class="hero-v2-photo-wrap startup-item" style="--delay:0.1s">
          <!-- Decorative rings -->
          <div class="hero-v2-ring hero-v2-ring-1" aria-hidden="true"></div>
          <div class="hero-v2-ring hero-v2-ring-2" aria-hidden="true"></div>
          <div class="hero-v2-ring hero-v2-ring-3" aria-hidden="true"></div>

          <!-- Glow pad behind photo -->
          <div class="hero-v2-photo-glow" aria-hidden="true"></div>

          <!-- Base platform -->
          <div class="hero-v2-platform" aria-hidden="true"></div>

          <!-- The actual photo -->
          <img :src="myPhotoBg" alt="Laksh Solanki" class="hero-v2-photo" draggable="false" />

          <!-- Floating badges -->
          <div class="hero-v2-badge hero-v2-badge-vue">
            <v-icon size="18" color="#41b883">mdi-vuejs</v-icon>
            Vue 3
          </div>
          <div class="hero-v2-badge hero-v2-badge-node">
            <v-icon size="18" color="#84c93f">mdi-nodejs</v-icon>
            Node.js
          </div>
          <div class="hero-v2-badge hero-v2-badge-exp">
            <v-icon size="14" color="#f7c325">mdi-star</v-icon>
            4+ yrs exp
          </div>
          <div class="hero-v2-badge hero-v2-badge-location">
            <v-icon size="14" color="#ff6b6b">mdi-map-marker</v-icon>
            Gujarat, India
          </div>
        </div>
      </div>

      <!-- Bottom scroll cue -->
      <div class="hero-v2-scroll-cue" aria-hidden="true">
        <span class="hero-v2-scroll-line"></span>
        <span class="hero-v2-scroll-label">scroll</span>
      </div>
    </section>

    <!-- ═══ DARK SECTION WRAPPER ═══ -->
    <div class="home-dark-content">
      <div class="home-dark-inner">
        <!-- ═══ STATS SECTION ═══ -->
        <section class="mb-16 home-section">
          <v-row>
            <v-col v-for="(stat, index) in impactStats" :key="stat.label" cols="12" sm="4">
              <div class="prem-stat-card startup-stat" :style="{ '--delay': `${0.08 + index * 0.09}s` }">
                <div class="prem-stat-glow"></div>
                <span class="prem-stat-value">{{ stat.value }}</span>
                <span class="prem-stat-label">{{ stat.label }}</span>
              </div>
            </v-col>
          </v-row>
        </section>

        <!-- ═══ WHAT I BUILD ═══ -->
        <section class="mb-16 home-section">
          <div class="clean-section-head startup-heading" style="--delay: 0.08s">
            <div>
              <span class="clean-kicker">Core Stack</span>
              <h2 class="clean-section-title">Technologies I build with</h2>
            </div>
            <v-btn to="/projects" variant="outlined" rounded="xl" class="clean-btn-projects text-none px-5" text="See All Projects"
              append-icon="mdi-arrow-right" />
          </div>

          <div class="clean-stack-panel startup-flow-card">
            <div class="clean-panel-bg"></div>

            <div class="clean-stack-grid">
              <div v-for="(node, index) in premiumStackNodes" :key="node.id" class="clean-node-card"
                :style="{ '--delay': `${0.1 + index * 0.05}s` }">
                <div class="clean-node-bg" :style="{ background: `radial-gradient(circle at 100% 100%, ${node.ring}20 0%, transparent 70%)` }"></div>
                <div class="clean-node-icon-wrap" :style="{ color: node.ring }">
                  <v-icon v-if="node.icon" :icon="node.icon" size="32" />
                </div>
                <div class="clean-node-content">
                  <h4 class="clean-node-title">{{ node.label }}</h4>
                  <p class="clean-node-desc">{{ node.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ HOW I DELIVER ═══ -->
        <section class="mb-16 home-section">
          <div class="clean-section-head startup-heading" style="--delay: 0.08s">
            <div>
              <span class="clean-kicker">COLLABORATION MODEL</span>
              <h2 class="clean-section-title">How I Deliver</h2>
            </div>
          </div>

          <div class="clean-panel startup-flow-card">
            <div class="clean-panel-bg"></div>
            <v-row class="ga-0 position-relative z-2" align="start">
              <v-col cols="12" md="5" class="pr-md-8">
                <h3 class="clean-sub-title mb-3">
                  Minimal process, maximum clarity and execution.
                </h3>
                <p class="clean-muted mb-6">
                  I partner closely with teams to keep delivery lean, practical, and
                  focused on real outcomes.
                </p>
                <div class="d-flex flex-wrap ga-2">
                  <span v-for="(item, index) in deliveryFocus" :key="item" class="clean-delivery-chip"
                    :style="{ '--delay': `${0.2 + index * 0.05}s` }">
                    <v-icon size="14" class="mr-1" color="#39bca3">mdi-check-circle-outline</v-icon>
                    {{ item }}
                  </span>
                </div>
              </v-col>
              <v-col cols="12" md="7" class="mt-8 mt-md-0">
                <div class="clean-collab-list">
                  <article v-for="(item, index) in collaborationSteps" :key="item.step" class="clean-collab-item"
                    :style="{ '--delay': `${0.24 + index * 0.07}s` }">
                    <span class="clean-collab-step">{{ item.step }}</span>
                    <div>
                      <h4 class="clean-collab-title mb-1">{{ item.title }}</h4>
                      <p class="clean-collab-desc mb-0">{{ item.description }}</p>
                    </div>
                  </article>
                </div>
              </v-col>
            </v-row>
          </div>
        </section>

        <!-- ═══ WHAT YOU CAN EXPECT + CTA ═══ -->
        <section class="home-section mb-6">
          <div class="clean-section-head startup-heading" style="--delay: 0.1s">
            <div>
              <span class="clean-kicker">VALUES</span>
              <h2 class="clean-section-title">What You Can Expect</h2>
            </div>
          </div>

          <v-row class="mb-12">
            <v-col v-for="(pillar, index) in valuePillars" :key="pillar.title" cols="12" md="4">
              <div class="clean-pillar-card startup-project" :style="{ '--delay': `${0.14 + index * 0.09}s` }">
                <div class="clean-pillar-icon-wrap">
                  <v-icon :icon="pillar.icon" size="24" class="clean-pillar-icon"></v-icon>
                </div>
                <h3 class="clean-pillar-title">{{ pillar.title }}</h3>
                <p class="clean-pillar-desc mb-0">{{ pillar.description }}</p>
              </div>
            </v-col>
          </v-row>

          <!-- CTA Banner -->
          <div class="clean-cta-banner startup-heading" style="--delay:0.2s">
            <div class="clean-cta-bg"></div>
            <div class="clean-cta-content">
              <h3 class="clean-cta-title">Looking for a focused development partner?</h3>
              <p class="clean-cta-sub">Explore projects or review my profile to see how I build and deliver.</p>
            </div>
            <div class="clean-cta-actions">
              <v-btn to="/projects" rounded="xl" size="large" class="clean-cta-btn-primary text-none px-7" elevation="0">
                <v-icon start>mdi-rocket-launch-outline</v-icon>
                Browse Projects
              </v-btn>
              <v-btn to="/about" variant="outlined" rounded="xl" size="large" class="clean-cta-btn-outline text-none px-7"
                elevation="0">
                <v-icon start>mdi-account-outline</v-icon>
                About Me
              </v-btn>
            </div>
          </div>
        </section>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.home-shell {
  position: relative;
}

/* ═══════════════════════════════════════════════
   HERO V2 - Full bleed dark split-screen
═══════════════════════════════════════════════ */
.hero-v2 {
  position: relative;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  min-height: 92vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  isolation: isolate;
}

/* Background stack */
.hero-v2-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 68% 44%, rgba(99, 60, 232, 0.28) 0%, transparent 58%),
    radial-gradient(ellipse 60% 50% at 12% 82%, rgba(22, 200, 170, 0.18) 0%, transparent 52%),
    linear-gradient(138deg, #08041a 0%, #0f062e 35%, #0a0f26 65%, #060d1f 100%);
  z-index: 0;
}

.hero-v2-mesh {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.022) 0px, rgba(255, 255, 255, 0.022) 1px, transparent 1px, transparent 64px),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.022) 0px, rgba(255, 255, 255, 0.022) 1px, transparent 1px, transparent 64px);
  pointer-events: none;
}

.hero-v2-grid {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 120% 100% at 50% 100%, rgba(99, 60, 232, 0.12) 0%, transparent 52%);
  pointer-events: none;
}

.hero-v2-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  pointer-events: none;
  animation: hero2-blob-drift 12s ease-in-out infinite alternate;
}

.hero-v2-blob-1 {
  width: 520px;
  height: 520px;
  top: -140px;
  left: -100px;
  background: radial-gradient(circle, rgba(122, 65, 255, 0.28) 0%, transparent 70%);
  animation-delay: 0s;
}

.hero-v2-blob-2 {
  width: 420px;
  height: 420px;
  bottom: -120px;
  right: 5%;
  background: radial-gradient(circle, rgba(22, 200, 170, 0.22) 0%, transparent 70%);
  animation-delay: -4s;
}

.hero-v2-blob-3 {
  width: 340px;
  height: 340px;
  top: 30%;
  right: 28%;
  background: radial-gradient(circle, rgba(247, 99, 132, 0.14) 0%, transparent 70%);
  animation-delay: -8s;
}

/* Inner layout */
.hero-v2-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 3rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: 6rem 2.5rem 5rem;
  width: 100%;
}

/* ── Copy side ── */
.hero-v2-copy {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-v2-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #39bca3;
  margin-bottom: 1.4rem;
}

.hero-v2-eyebrow-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #39bca3;
  box-shadow: 0 0 8px 2px rgba(57, 188, 163, 0.7);
  animation: pulse-dot 2s ease-in-out infinite;
}

.hero-v2-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(3rem, 5.5vw, 5.2rem);
  font-weight: 900;
  line-height: 1.0;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0 0 0.6rem;
}

.hero-v2-name-grad {
  background: linear-gradient(92deg, #39bca3 0%, #0f8f7c 48%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-v2-title-line2 {
  color: rgba(255, 255, 255, 0.88);
}

.hero-v2-role {
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
  min-height: 2rem;
  display: flex;
  align-items: center;
}

.hero-v2-role-prefix {
  color: #39bca3;
  margin-right: 0.25rem;
}

.hero-v2-typed {
  color: #e2e8f0;
}

.hero-v2-cursor {
  color: #39bca3;
  font-weight: 300;
  animation: blink-cursor 0.9s step-end infinite;
}

.hero-v2-desc {
  font-size: 1.05rem;
  line-height: 1.72;
  color: rgba(255, 255, 255, 0.55);
  max-width: 46ch;
  margin-bottom: 2rem;
}

/* Stat pills */
.hero-v2-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-bottom: 2rem;
}

.hero-v2-stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.55rem 1.1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  min-width: 80px;
  transition: background 0.22s, border-color 0.22s;
}

.hero-v2-stat-pill:hover {
  background: rgba(15, 143, 124, 0.15) !important;
  border-color: rgba(15, 143, 124, 0.4) !important;
}

.hero-v2-stat-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  background: #0f8f7c;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-v2-stat-label {
  font-size: 0.67rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  margin-top: 2px;
  text-align: center;
}

/* CTA buttons */
.hero-v2-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-bottom: 2rem;
}

.hero-v2-btn-primary {
  transition: box-shadow 0.22s, transform 0.18s !important;
}

.hero-v2-btn-primary:hover {
  box-shadow: 0 12px 36px rgba(15, 143, 124, 0.35) !important;
  transform: translateY(-2px);
}

.hero-v2-btn-outline {
  border: 1px solid #0f8f7c !important;
  color: #fff !important;
}

.hero-v2-btn-outline:hover {
  background: rgba(15, 143, 124, 0.2) !important;
}

/* Tech chips */
.hero-v2-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.hero-v2-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.72rem;
  border-radius: 999px;
  background: rgba(15, 143, 124, 0.1);
  border: 1px solid rgba(15, 143, 124, 0.24);
  color: #39bca3;
  letter-spacing: 0.03em;
  cursor: default;
  transition: background 0.18s, border-color 0.18s;
}

.hero-v2-chip:hover {
  background: rgba(15, 143, 124, 0.2);
  border-color: rgba(15, 143, 124, 0.48);
}

/* ── Photo side ── */
.hero-v2-photo-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  min-height: 520px;
}

.hero-v2-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(15, 143, 124, 0.14);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -48%);
  pointer-events: none;
  animation: ring-spin 24s linear infinite;
}

.hero-v2-ring-1 {
  width: 420px;
  height: 420px;
}

.hero-v2-ring-2 {
  width: 540px;
  height: 540px;
  border-color: rgba(15, 143, 124, 0.08);
  animation-duration: 36s;
  animation-direction: reverse;
}

.hero-v2-ring-3 {
  width: 660px;
  height: 660px;
  border-color: rgba(57, 188, 163, 0.06);
  animation-duration: 52s;
}

.hero-v2-photo-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 100%, #0f8f7c 0%, rgba(15, 143, 124, 0.28) 38%, transparent 68%);
  filter: blur(28px);
  pointer-events: none;
}

.hero-v2-platform {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 24px;
  border-radius: 50%;
  background: radial-gradient(ellipse, #0f8f7c 0%, transparent 72%);
  filter: blur(10px);
  pointer-events: none;
}

.hero-v2-photo {
  position: relative;
  z-index: 2;
  width: clamp(280px, 36vw, 440px);
  max-height: 92%;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 60px 80px rgba(15, 143, 124, 0.6)) drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5));
  animation: photo-float 6s ease-in-out infinite;
  user-select: none;
}

/* Floating badges */
.hero-v2-badge {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  padding: 0.42rem 0.82rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 10, 40, 0.72);
  color: #e2e8f0;
  white-space: nowrap;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
}

.hero-v2-badge-vue {
  top: 18%;
  left: -2%;
  animation: badge-float 5s ease-in-out infinite;
}

.hero-v2-badge-node {
  top: 38%;
  right: -4%;
  animation: badge-float 5.8s ease-in-out -1.5s infinite;
}

.hero-v2-badge-exp {
  bottom: 30%;
  left: 2%;
  animation: badge-float 4.6s ease-in-out -2.8s infinite;
}

.hero-v2-badge-location {
  top: 8%;
  right: 6%;
  animation: badge-float 6.2s ease-in-out -0.8s infinite;
}

/* Scroll cue */
.hero-v2-scroll-cue {
  position: absolute;
  bottom: 2.2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  z-index: 2;
  animation: fade-up-cue 1s ease 1.6s both;
}

.hero-v2-scroll-line {
  width: 1.5px;
  height: 36px;
  background: linear-gradient(to bottom, rgba(15, 143, 124, 0.7), transparent);
  animation: scroll-line-pulse 2.4s ease-in-out infinite;
}

.hero-v2-scroll-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(15, 143, 124, 0.6);
}

.profile-fact,
.startup-item,
.startup-heading,
.startup-stat,
.startup-project,
.startup-chip {
  opacity: 0;
  animation-fill-mode: both;
  will-change: transform, opacity;
}

.startup-item,
.startup-heading {
  animation: startup-rise 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.startup-chip {
  transform-origin: left center;
  animation: chip-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.profile-fact,
.startup-stat {
  animation: startup-scale 0.62s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.startup-project {
  animation: startup-card 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

/* Hero V2 animations (new photo hero) */
@keyframes hero2-blob-drift {
  from {
    transform: translate(0, 0) scale(1);
  }

  to {
    transform: translate(24px, 18px) scale(1.06);
  }
}

@keyframes blink-cursor {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

@keyframes pulse-dot {

  0%,
  100% {
    box-shadow: 0 0 8px 2px rgba(57, 188, 163, 0.7);
  }

  50% {
    box-shadow: 0 0 14px 5px rgba(57, 188, 163, 0.35);
  }
}

@keyframes ring-spin {
  from {
    transform: translate(-50%, -48%) rotate(0deg);
  }

  to {
    transform: translate(-50%, -48%) rotate(360deg);
  }
}

@keyframes photo-float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-14px);
  }
}

@keyframes badge-float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-7px);
  }
}

@keyframes fade-up-cue {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes scroll-line-pulse {

  0%,
  100% {
    opacity: 0.5;
    transform: scaleY(1);
    transform-origin: top;
  }

  50% {
    opacity: 1;
    transform: scaleY(1.18);
  }
}

.startup-flow-card {
  animation: startup-panel 0.78s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both;
}

/* ═══════════════════════════════════════════════
   DARK SECTION WRAPPER
═══════════════════════════════════════════════ */
.home-dark-content {
  position: relative;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: linear-gradient(to bottom, #060d1f 0%, #08041a 45%, #050212 100%);
  padding: 5rem 0 7rem;
  overflow: hidden;
  box-sizing: border-box;
}

.home-dark-content::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 80% 20%, rgba(15, 143, 124, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 15% 75%, rgba(57, 188, 163, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

.home-dark-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2.5rem;
  width: 100%;
  position: relative;
  z-index: 2;
  box-sizing: border-box;
}

/* ═══════════════════════════════════════════════
   PREMIUM STAT CARDS
═══════════════════════════════════════════════ */
.prem-stat-card {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 24px;
  padding: 2.2rem 1.8rem;
  text-align: center;
  backdrop-filter: blur(20px);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.prem-stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(15, 143, 124, 0.15);
  border-color: rgba(15, 143, 124, 0.4) !important;
  background: radial-gradient(circle at top left, rgba(15, 143, 124, 0.15), transparent 70%), rgba(255, 255, 255, 0.04) !important;
}

.prem-stat-glow {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: radial-gradient(ellipse at 50% 0%, rgba(15, 143, 124, 0.15) 0%, transparent 65%);
  pointer-events: none;
}

.prem-stat-value {
  display: block;
  font-size: clamp(2.4rem, 4vw, 3.4rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #ffffff 30%, #a7f3d0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.prem-stat-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6) !important;
}

/* ═══════════════════════════════════════════════
   CLEAN SECTION HEADING
═══════════════════════════════════════════════ */
.clean-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.clean-kicker {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #39bca3 !important; /* glowing emerald */
  margin-bottom: 0.5rem;
  display: block;
}

.clean-section-title {
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 900;
  color: #ffffff !important;
  letter-spacing: -0.03em;
  margin: 0;
}

.clean-btn-projects {
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

.clean-btn-projects:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

/* ═══════════════════════════════════════════════
   CLEAN PANEL
═══════════════════════════════════════════════ */
.clean-panel, .clean-stack-panel {
  position: relative;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.01) !important;
  border: 1px solid rgba(255, 255, 255, 0.04) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  padding: 3rem;
  overflow: hidden;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.clean-stack-panel {
  margin-top: 1rem;
}

.clean-panel:hover, .clean-stack-panel:hover {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
}

.clean-panel-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

/* Inside clean-panel */
.clean-sub-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff !important;
  letter-spacing: -0.02em;
  line-height: 1.4;
}

.clean-muted {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.55) !important;
}

/* Delivery chips */
.clean-delivery-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
  opacity: 0;
  animation: chip-in 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
  transition: all 0.25s ease;
}

.clean-delivery-chip:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Collab list */
.clean-collab-list {
  display: grid;
  gap: 1rem;
}

.clean-collab-item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 1.2rem;
  padding: 1.2rem 1.4rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.04) !important;
  background: rgba(255, 255, 255, 0.015) !important;
  opacity: 0;
  animation: startup-scale 0.62s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.clean-collab-item:hover {
  background: rgba(255, 255, 255, 0.04) !important;
  border-color: rgba(15, 143, 124, 0.2) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  transform: translateX(6px);
}

.clean-collab-step {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 800;
  color: #39bca3 !important; /* neon emerald */
  background: rgba(57, 188, 163, 0.1) !important;
  border: 1px solid rgba(57, 188, 163, 0.2) !important;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.clean-collab-item:hover .clean-collab-step {
  color: #ffffff !important;
  background: #39bca3 !important;
  border-color: #39bca3 !important;
  box-shadow: 0 0 12px rgba(57, 188, 163, 0.4);
}

.clean-collab-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff !important;
}

.clean-collab-desc {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5) !important;
  line-height: 1.6;
}

/* ═══════════════════════════════════════════════
   CLEAN PILLAR CARDS
═══════════════════════════════════════════════ */
.clean-pillar-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02) !important;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  padding: 2.2rem 1.8rem;
  height: 100%;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.clean-pillar-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.12) !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

.clean-pillar-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  display: grid;
  place-items: center;
  margin-bottom: 1.4rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.clean-pillar-card:hover .clean-pillar-icon-wrap {
  background: #0f8f7c !important;
  color: #ffffff !important;
  transform: scale(1.05) rotate(-5deg);
  box-shadow: 0 10px 20px rgba(15, 143, 124, 0.3);
}

.clean-pillar-icon {
  color: #0f8f7c !important;
  transition: color 0.3s ease;
}

.clean-pillar-card:hover .clean-pillar-icon {
  color: #ffffff !important;
}

.clean-pillar-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff !important;
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
}

.clean-pillar-desc {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5) !important;
  line-height: 1.65;
}

/* ═══════════════════════════════════════════════
   CLEAN CTA BANNER
═══════════════════════════════════════════════ */
.clean-cta-banner {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(8, 4, 26, 0.8) 100%) !important;
  border: 1px solid rgba(15, 143, 124, 0.2) !important;
  padding: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.clean-cta-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: radial-gradient(circle at 100% 50%, rgba(15, 143, 124, 0.18) 0%, transparent 80%);
  pointer-events: none;
}

.clean-cta-content {
  flex: 1;
  min-width: 280px;
  position: relative;
  z-index: 2;
}

.clean-cta-title {
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  font-weight: 900;
  color: #ffffff !important;
  letter-spacing: -0.02em;
  margin-bottom: 0.6rem;
}

.clean-cta-sub {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.7) !important;
  line-height: 1.6;
  margin: 0;
}

.clean-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.clean-cta-btn-primary {
  background: #0f8f7c !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(15, 143, 124, 0.3) !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.clean-cta-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15, 143, 124, 0.45) !important;
  background: #0d7667 !important;
}

.clean-cta-btn-outline {
  background: rgba(255, 255, 255, 0.03) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  font-weight: 700;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.clean-cta-btn-outline:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
}

.clean-stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  position: relative;
  z-index: 2;
}

.clean-node-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 20px;
  padding: 2rem 1.8rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  animation: clean-fade-up 0.6s ease-out both;
  animation-delay: var(--delay);
}

.clean-node-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.12) !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

.clean-node-bg {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.clean-node-card:hover .clean-node-bg {
  opacity: 1;
}

.clean-node-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  z-index: 2;
}

.clean-node-card:hover .clean-node-icon-wrap {
  transform: scale(1.08) translateY(-2px);
  background: rgba(255, 255, 255, 0.06) !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.clean-node-content {
  position: relative;
  z-index: 2;
}

.clean-node-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff !important;
  margin: 0 0 0.5rem 0;
}

.clean-node-desc {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5) !important;
  line-height: 1.6;
  margin: 0;
}

@keyframes clean-fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
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

@keyframes startup-scale {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.94);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes startup-card {
  from {
    opacity: 0;
    transform: translateY(26px) rotateX(10deg) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) rotateX(0deg) scale(1);
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

@keyframes chip-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.92);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes profile-enter {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes hero-sheen {
  from {
    opacity: 0;
    transform: translateX(-135%);
  }

  35% {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translateX(135%);
  }
}

/* Hero blob/orbit animations no longer used but kept for compatibility */
@keyframes hero-blob-enter {
  from {
    opacity: 0;
    transform: translate3d(-24px, -18px, 0) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes orbit-settle-one {
  from {
    opacity: 0;
    transform: scale(0.82) rotate(-18deg);
  }

  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes orbit-settle-two {
  from {
    opacity: 0;
    transform: scale(0.84) rotate(20deg);
  }

  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes dot-enter {
  from {
    opacity: 0;
    box-shadow: 0 0 0 0 rgba(19, 111, 99, 0);
    transform: scale(0.5);
  }

  to {
    opacity: 1;
    box-shadow: 0 0 0 6px rgba(19, 111, 99, 0.13);
    transform: scale(1);
  }
}

@keyframes halo-enter {
  from {
    opacity: 0;
    transform: scale(0.82);
  }

  to {
    opacity: 0.92;
    transform: scale(1);
  }
}



@keyframes luxe-orb-float {

  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(10px, -7px, 0);
  }
}

@media (max-width: 760px) {
  .clean-stack-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .clean-stack-panel,
  .clean-panel,
  .clean-cta-banner {
    padding: 2rem 1.25rem;
  }
  
  .clean-section-title {
    font-size: 1.6rem;
  }
  
  .clean-node-card {
    padding: 1.5rem;
  }
}

@media (max-width: 900px) {
  .hero-v2-inner {
    grid-template-columns: 1fr;
    padding: 4rem 1.5rem 3rem;
    gap: 2rem;
    text-align: center;
  }

  .hero-v2-copy {
    align-items: center;
  }

  .hero-v2-desc {
    max-width: none;
  }

  .hero-v2-eyebrow {
    justify-content: center;
  }

  .hero-v2-ctas {
    justify-content: center;
  }

  .hero-v2-chips {
    justify-content: center;
  }

  .hero-v2-stats {
    justify-content: center;
  }

  .hero-v2-photo-wrap {
    min-height: 340px;
    order: -1;
  }

  .hero-v2-photo {
    width: clamp(200px, 60vw, 320px);
  }

  .hero-v2-ring-2,
  .hero-v2-ring-3 {
    display: none;
  }

  .hero-v2-ring-1 {
    width: 300px;
    height: 300px;
  }

  .hero-v2-badge-vue {
    top: 10%;
    left: 4%;
  }

  .hero-v2-badge-node {
    top: 10%;
    right: 4%;
  }

  .hero-v2-badge-exp {
    bottom: 16%;
    left: 2%;
  }

  .hero-v2-badge-location {
    display: none;
  }
}

@media (max-width: 600px) {
  .hero-v2 {
    min-height: auto;
  }

  .hero-v2-scroll-cue {
    display: none;
  }

  .hero-v2-badge {
    font-size: 0.68rem;
    padding: 0.32rem 0.6rem;
  }

  .luxe-flow-card {
    padding: 1.15rem !important;
  }

  /* Premium panels responsive */
  .prem-stat-card {
    padding: 1.5rem 1.2rem;
  }

  .clean-panel,
  .clean-stack-panel {
    padding: 1.5rem 1.25rem;
  }

  .clean-collab-item {
    gap: 0.75rem;
    padding: 0.8rem 1.2rem;
  }

  .clean-cta-banner {
    padding: 2rem 1.5rem;
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }

  .clean-cta-actions {
    justify-content: center;
    width: 100%;
  }

  .clean-cta-btn-primary,
  .clean-cta-btn-outline {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {

  .hero-v2-blob,
  .hero-v2-photo,
  .hero-v2-ring,
  .hero-v2-badge,
  .hero-v2-cursor,
  .hero-v2-eyebrow-dot,
  .hero-v2-scroll-line,
  .startup-item,
  .startup-heading,
  .startup-stat,
  .startup-project,
  .startup-flow-card,
  .startup-chip,
  .profile-fact,
  .luxe-orb,
  .clean-node-card,
  .clean-delivery-chip,
  .clean-collab-item {
    animation: none;
    opacity: 1;
  }

  .luxe-flow-card,
  .clean-node-card,
  .clean-node-icon-wrap,
  .clean-pillar-card,
  .clean-pillar-icon-wrap,
  .clean-panel,
  .clean-stack-panel,
  .clean-cta-btn-primary,
  .clean-cta-btn-outline,
  .clean-collab-item,
  .stat-card {
    transition: none;
  }
}
</style>
