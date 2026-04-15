<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const myPhoto = getMediaUrl("Picture/my-pic.jpg");
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
  "Tailwind CSS",
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
    id: "html",
    label: "HTML",
    short: "H5",
    icon: "mdi-language-html5",
    x: 70,
    y: 120,
    ring: "#ff7a1a",
  },
  {
    id: "css",
    label: "CSS",
    short: "C3",
    icon: "mdi-language-css3",
    x: 370,
    y: 54,
    ring: "#1c9cff",
  },
  {
    id: "javascript",
    label: "JavaScript",
    short: "JS",
    icon: "mdi-language-javascript",
    x: 600,
    y: 54,
    ring: "#f7c325",
  },
  {
    id: "node",
    label: "Node.js",
    short: "N",
    icon: "mdi-nodejs",
    x: 890,
    y: 120,
    ring: "#11d46d",
  },
  {
    id: "vue",
    label: "Vue",
    short: "V",
    icon: "mdi-vuejs",
    x: 890,
    y: 322,
    ring: "#2ec9ff",
  },
  {
    id: "fastify",
    label: "Fastify",
    short: "F",
    icon: "mdi-server",
    x: 370,
    y: 388,
    ring: "#99a8bf",
  },
  {
    id: "mongodb",
    label: "MongoDB",
    short: "M",
    icon: "mdi-database",
    x: 73,
    y: 328,
    ring: "#11c864",
  },
  {
    id: "vuetify",
    label: "Vuetify",
    short: "VU",
    icon: "mdi-view-dashboard",
    x: 603,
    y: 383,
    ring: "#df61ff",
  },
];

const premiumStackLinks = [
  ["html", "css"],
  ["css", "javascript"],
  ["javascript", "node"],
   ["node", "vue"],
  ["vue", "vuetify"],
  ["vuetify", "fastify"],
  ["fastify", "mongodb"],
];

const premiumNodeLookup = Object.fromEntries(
  premiumStackNodes.map((node) => [node.id, node]),
);
const premiumStackLines = premiumStackLinks
  .map(([from, to]) => {
    const source = premiumNodeLookup[from];
    const target = premiumNodeLookup[to];
    if (!source || !target) return null;
    return {
      key: `${from}-${to}`,
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y,
    };
  })
  .filter(Boolean);
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
            <v-btn
              color="primary"
              size="large"
              rounded="xl"
              class="hero-v2-btn-primary text-none px-7"
              to="/projects"
              elevation="0"
            >
              <v-icon start>mdi-rocket-launch-outline</v-icon>
              Explore Projects
            </v-btn>
            <v-btn
              variant="outlined"
              size="large"
              rounded="xl"
              class="hero-v2-btn-outline text-none px-7"
              to="/about"
              elevation="0"
            >
              <v-icon start>mdi-account-outline</v-icon>
              About Me
            </v-btn>
          </div>

          <!-- Tech chips -->
          <div class="hero-v2-chips">
            <span
              v-for="(skill, i) in techStack"
              :key="skill"
              class="hero-v2-chip startup-chip"
              :style="{ '--delay': `${0.52 + i * 0.045}s` }"
            >{{ skill }}</span>
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
          <img
            :src="myPhotoBg"
            alt="Laksh Solanki"
            class="hero-v2-photo"
            draggable="false"
          />

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

    <section class="mb-10 home-section">
      <v-row>
        <v-col
          v-for="(stat, index) in impactStats"
          :key="stat.label"
          cols="12"
          sm="4"
        >
          <v-card
            class="section-shell pa-6 stat-card h-100 startup-stat border"
            rounded="xl"
            :style="{ '--delay': `${0.08 + index * 0.09}s` }"
            flat
          >
            <p class="text-h4 font-weight-bold mb-1">{{ stat.value }}</p>
            <p class="muted-copy mb-0">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <section class="mb-10 home-section">
      <div
        class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3 startup-heading"
        style="--delay: 0.08s"
      >
        <h2 class="text-h4 mb-0">What I Build</h2>
        <v-btn to="/projects" variant="text" color="primary" class="text-none"
          >See all projects</v-btn
        >
      </div>
      <v-card
        class="section-shell pa-6 pa-md-8 luxe-flow-card startup-flow-card"
        flat
      >
        <div class="luxe-orb"></div>

        <div
          class="d-flex align-center justify-space-between mb-5 flex-wrap ga-3 luxe-head"
        >
          <div class="d-flex align-center ga-3">
            <div>
              <p class="text-overline mb-0 luxe-kicker">PREMIUM STACK</p>
            </div>
          </div>
          <v-chip
            size="small"
            color="secondary"
            variant="flat"
            class="luxe-chip"
            >2026</v-chip
          >
        </div>

        <div class="premium-stack-map" aria-label="Premium stack graph">
          <svg
            class="premium-stack-lines"
            viewBox="0 0 980 500"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <line
              v-for="(line, index) in premiumStackLines"
              :key="line.key"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              class="premium-connector"
              :style="{ '--d': `${0.08 + index * 0.04}s` }"
            />
          </svg>

          <div
            v-for="(node, index) in premiumStackNodes"
            :key="node.id"
            class="premium-node"
            tabindex="0"
            :aria-label="node.label"
            :style="{
              left: `${(node.x / 980) * 100}%`,
              top: `${(node.y / 500) * 100}%`,
              '--ring': node.ring,
              '--d': `${0.2 + index * 0.04}s`,
            }"
          >
            <v-icon
              v-if="node.icon"
              class="premium-node-core"
              :icon="node.icon"
            />
            <span v-else class="premium-node-core">{{ node.short }}</span>
            <span class="premium-node-check">✓</span>
            <span class="premium-node-label">{{ node.label }}</span>
          </div>
        </div>

        <div class="premium-stack-mobile" aria-label="Premium stack list">
          <div
            v-for="(node, index) in premiumStackNodes"
            :key="`${node.id}-mobile`"
            class="premium-mobile-item"
            :style="{ '--d': `${0.12 + index * 0.03}s` }"
          >
            <span
              class="premium-mobile-dot"
              :style="{ '--ring': node.ring }"
            ></span>
            <v-icon
              v-if="node.icon"
              class="premium-mobile-icon"
              :icon="node.icon"
              size="16"
            />
            <span class="premium-mobile-label">{{ node.label }}</span>
          </div>
        </div>
      </v-card>
    </section>

    <section class="mb-10 home-section">
      <div
        class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3 startup-heading"
        style="--delay: 0.08s"
      >
        <h2 class="text-h4 mb-0">How I Deliver</h2>
      </div>
      <v-card
        class="section-shell pa-6 pa-md-8 minimal-content-card startup-flow-card"
        flat
      >
        <v-row class="ga-0" align="start">
          <v-col cols="12" md="5" class="pr-md-6">
            <p class="text-overline mb-2 content-kicker">COLLABORATION MODEL</p>
            <h3 class="text-h5 mb-3 content-title">
              Minimal process, maximum clarity and execution.
            </h3>
            <p class="muted-copy mb-5">
              I partner closely with teams to keep delivery lean, practical, and
              focused on real outcomes.
            </p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="(item, index) in deliveryFocus"
                :key="item"
                size="small"
                color="primary"
                variant="tonal"
                class="delivery-chip"
                :style="{ '--delay': `${0.2 + index * 0.05}s` }"
              >
                {{ item }}
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="7" class="mt-6 mt-md-0">
            <div class="collab-list">
              <article
                v-for="(item, index) in collaborationSteps"
                :key="item.step"
                class="collab-item"
                :style="{ '--delay': `${0.24 + index * 0.07}s` }"
              >
                <span class="collab-step">{{ item.step }}</span>
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold mb-1">
                    {{ item.title }}
                  </h4>
                  <p class="muted-copy mb-0">{{ item.description }}</p>
                </div>
              </article>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </section>

    <section class="home-section">
      <div
        class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3 startup-heading"
        style="--delay: 0.1s"
      >
        <h2 class="text-h4 mb-0">What You Can Expect</h2>
      </div>
      <v-row>
        <v-col
          v-for="(pillar, index) in valuePillars"
          :key="pillar.title"
          cols="12"
          md="4"
        >
          <v-card
            class="section-shell pa-5 h-100 expectation-card startup-project"
            :style="{ '--delay': `${0.14 + index * 0.09}s` }"
            flat
          >
            <v-avatar size="42" color="primary" variant="tonal" class="mb-4">
              <v-icon :icon="pillar.icon" size="20"></v-icon>
            </v-avatar>
            <h3 class="text-h6 mb-2">{{ pillar.title }}</h3>
            <p class="muted-copy mb-0">{{ pillar.description }}</p>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="section-shell pa-5 pa-md-6 mt-6 cta-slab startup-heading" flat>
        <v-row align="center">
          <v-col cols="12" md="8">
            <h3 class="text-h5 mb-2">Looking for a focused development partner?</h3>
            <p class="muted-copy mb-0">
              Explore projects or review my profile to see how I build and deliver.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="d-flex flex-wrap ga-3 justify-md-end mt-4 mt-md-0">
            <v-btn to="/projects" color="primary" rounded="xl" class="text-none">
              Browse Projects
            </v-btn>
            <v-btn to="/about" variant="outlined" color="primary" rounded="xl" class="text-none">
              About Me
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </section>
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
    repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 64px),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 64px);
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
  width: 520px; height: 520px;
  top: -140px; left: -100px;
  background: radial-gradient(circle, rgba(122, 65, 255, 0.28) 0%, transparent 70%);
  animation-delay: 0s;
}
.hero-v2-blob-2 {
  width: 420px; height: 420px;
  bottom: -120px; right: 5%;
  background: radial-gradient(circle, rgba(22, 200, 170, 0.22) 0%, transparent 70%);
  animation-delay: -4s;
}
.hero-v2-blob-3 {
  width: 340px; height: 340px;
  top: 30%; right: 28%;
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
  color: #7cf5d0;
  margin-bottom: 1.4rem;
}
.hero-v2-eyebrow-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #7cf5d0;
  box-shadow: 0 0 8px 2px rgba(124, 245, 208, 0.7);
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
  background: linear-gradient(92deg, #a78bfa 0%, #60a5fa 52%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-v2-title-line2 {
  color: rgba(255,255,255,0.88);
}

.hero-v2-role {
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  margin-bottom: 1.5rem;
  min-height: 2rem;
  display: flex;
  align-items: center;
}
.hero-v2-role-prefix { color: #a78bfa; margin-right: 0.25rem; }
.hero-v2-typed { color: #e2e8f0; }
.hero-v2-cursor {
  color: #7cf5d0;
  font-weight: 300;
  animation: blink-cursor 0.9s step-end infinite;
}

.hero-v2-desc {
  font-size: 1.05rem;
  line-height: 1.72;
  color: rgba(255,255,255,0.55);
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
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  min-width: 80px;
  transition: background 0.22s, border-color 0.22s;
}
.hero-v2-stat-pill:hover {
  background: rgba(167,139,250,0.13);
  border-color: rgba(167,139,250,0.36);
}
.hero-v2-stat-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-v2-stat-label {
  font-size: 0.67rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(255,255,255,0.45);
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
  background: linear-gradient(108deg, #7c3aed, #4f46e5) !important;
  color: #fff !important;
  box-shadow: 0 8px 28px rgba(99, 60, 232, 0.48) !important;
  transition: box-shadow 0.22s, transform 0.18s !important;
}
.hero-v2-btn-primary:hover {
  box-shadow: 0 12px 36px rgba(99, 60, 232, 0.65) !important;
  transform: translateY(-2px);
}
.hero-v2-btn-outline {
  border-color: rgba(167,139,250,0.55) !important;
  color: #c4b5fd !important;
}
.hero-v2-btn-outline:hover {
  background: rgba(167,139,250,0.1) !important;
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
  background: rgba(167,139,250,0.12);
  border: 1px solid rgba(167,139,250,0.26);
  color: #c4b5fd;
  letter-spacing: 0.03em;
  cursor: default;
  transition: background 0.18s, border-color 0.18s;
}
.hero-v2-chip:hover {
  background: rgba(167,139,250,0.22);
  border-color: rgba(167,139,250,0.5);
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
  border: 1px solid rgba(167,139,250,0.15);
  top: 50%; left: 50%;
  transform: translate(-50%, -48%);
  pointer-events: none;
  animation: ring-spin 24s linear infinite;
}
.hero-v2-ring-1 { width: 420px; height: 420px; }
.hero-v2-ring-2 { width: 540px; height: 540px; border-color: rgba(96,165,250,0.1); animation-duration: 36s; animation-direction: reverse; }
.hero-v2-ring-3 { width: 660px; height: 660px; border-color: rgba(52,211,153,0.07); animation-duration: 52s; }

.hero-v2-photo-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 100%, rgba(122, 65, 255, 0.55) 0%, rgba(99, 60, 232, 0.25) 38%, transparent 68%);
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
  background: radial-gradient(ellipse, rgba(122,65,255,0.6) 0%, transparent 72%);
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
  filter: drop-shadow(0 24px 64px rgba(122, 65, 255, 0.45)) drop-shadow(0 4px 16px rgba(0,0,0,0.5));
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
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(15, 10, 40, 0.72);
  color: #e2e8f0;
  white-space: nowrap;
  box-shadow: 0 8px 28px rgba(0,0,0,0.35);
}
.hero-v2-badge-vue   { top: 18%; left: -2%; animation: badge-float 5s ease-in-out infinite; }
.hero-v2-badge-node  { top: 38%; right: -4%; animation: badge-float 5.8s ease-in-out -1.5s infinite; }
.hero-v2-badge-exp   { bottom: 30%; left: 2%; animation: badge-float 4.6s ease-in-out -2.8s infinite; }
.hero-v2-badge-location { top: 8%; right: 6%; animation: badge-float 6.2s ease-in-out -0.8s infinite; }

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
  background: linear-gradient(to bottom, rgba(167,139,250,0.7), transparent);
  animation: scroll-line-pulse 2.4s ease-in-out infinite;
}
.hero-v2-scroll-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(167,139,250,0.6);
}

.profile-fact,
.startup-item,
.startup-heading,
.startup-stat,
.startup-project,
.startup-flow-card,
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
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(24px, 18px) scale(1.06); }
}
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes pulse-dot {
  0%,100% { box-shadow: 0 0 8px 2px rgba(124,245,208,0.7); }
  50%     { box-shadow: 0 0 14px 5px rgba(124,245,208,0.35); }
}
@keyframes ring-spin {
  from { transform: translate(-50%, -48%) rotate(0deg); }
  to   { transform: translate(-50%, -48%) rotate(360deg); }
}
@keyframes photo-float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-14px); }
}
@keyframes badge-float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-7px); }
}
@keyframes fade-up-cue {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes scroll-line-pulse {
  0%,100% { opacity: 0.5; transform: scaleY(1); transform-origin: top; }
  50%     { opacity: 1;   transform: scaleY(1.18); }
}

.startup-flow-card {
  animation: startup-panel 0.78s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both;
}

.stat-card {
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(16, 35, 31, 0.12);
}

.minimal-content-card {
  border-color: rgba(19, 111, 99, 0.18);
  background: linear-gradient(158deg, #ffffff, #f2faf7);
}

.content-kicker {
  letter-spacing: 0.12em;
  color: #136f63;
  font-weight: 700;
}

.content-title {
  max-width: 23ch;
}

.delivery-chip {
  opacity: 0;
  animation: chip-in 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.collab-list {
  display: grid;
  gap: 0.8rem;
}

.collab-item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(15, 143, 124, 0.14);
  background: rgba(255, 255, 255, 0.82);
  opacity: 0;
  animation: startup-scale 0.62s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.collab-step {
  min-width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: #0b6f60;
  background: rgba(15, 143, 124, 0.12);
}

.expectation-card {
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.expectation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(16, 35, 31, 0.12);
}

.cta-slab {
  border-style: dashed;
  border-width: 1px;
  border-color: rgba(15, 143, 124, 0.26);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.95), rgba(236, 247, 243, 0.96));
}

.luxe-flow-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(19, 111, 99, 0.24);
  background:
    radial-gradient(
      circle at 7% 14%,
      rgba(19, 111, 99, 0.16) 0%,
      transparent 34%
    ),
    linear-gradient(155deg, #ffffff 0%, #f5fcf8 54%, #eef7ff 100%);
  box-shadow: 0 18px 36px rgba(16, 35, 31, 0.11);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease;
}

.luxe-flow-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 44px rgba(16, 35, 31, 0.15);
}

.luxe-orb {
  position: absolute;
  top: -100px;
  right: -50px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(245, 158, 11, 0.2) 0%,
    rgba(245, 158, 11, 0) 74%
  );
  pointer-events: none;
  animation: luxe-orb-float 6s ease-in-out infinite;
}

.luxe-head {
  position: relative;
  z-index: 1;
}

.luxe-kicker {
  letter-spacing: 0.13em;
  color: #136f63;
  font-weight: 700;
}

.luxe-avatar {
  border: 2px solid #ffffff;
  box-shadow: 0 8px 20px rgba(19, 111, 99, 0.22);
}

.luxe-chip {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.premium-stack-map {
  --node-size: clamp(48px, 6.2vw, 78px);
  --check-size: clamp(14px, 1.9vw, 22px);
  position: relative;
  z-index: 1;
  width: 100%;
  aspect-ratio: 980 / 500;
  border-radius: 20px;
  border: 1px solid rgba(81, 132, 196, 0.24);
  background:
    radial-gradient(circle at 18% 22%, rgba(39, 119, 216, 0.2), transparent 46%),
    radial-gradient(circle at 86% 18%, rgba(99, 102, 241, 0.14), transparent 48%),
    linear-gradient(160deg, #f9fcff 0%, #eef5ff 48%, #eaf2fb 100%);
  overflow: hidden;
}

.premium-stack-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.premium-connector {
  stroke: rgba(59, 113, 178, 0.36);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: premium-line-in 0.8s ease forwards;
  animation-delay: var(--d, 0s);
}

.premium-node {
  position: absolute;
  width: var(--node-size);
  height: var(--node-size);
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 2px solid color-mix(in srgb, var(--ring) 82%, white 18%);
  background-color: #071a31;
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--ring) 22%, transparent 78%),
    0 12px 28px rgba(1, 11, 27, 0.44);
  color: #eaf3ff;
  animation: premium-node-in 0.45s ease both;
  animation-delay: var(--d, 0s);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  transform: translate(-50%, -50%);
}

.premium-node:hover {
  transform: translate(-50%, calc(-50% - 3px)) scale(1.03);
  box-shadow:
    0 0 0 5px color-mix(in srgb, var(--ring) 34%, transparent 66%),
    0 16px 34px rgba(1, 11, 27, 0.52);
}

.premium-node:focus-visible {
  outline: 2px solid rgba(229, 245, 255, 0.95);
  outline-offset: 2px;
}

.premium-node-core {
  font-size: clamp(1.8rem, 1vw, 1.02rem);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.premium-node-check {
  position: absolute;
  top: calc(var(--check-size) * -0.3);
  right: calc(var(--check-size) * -0.2);
  width: var(--check-size);
  height: var(--check-size);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: clamp(0.58rem, 1vw, 0.8rem);
  font-weight: 900;
  color: #ffffff;
  background: #17c964;
  border: 2px solid #0a1f3d;
  box-shadow: 0 6px 12px rgba(8, 68, 42, 0.42);
}

.premium-node-label {
  position: absolute;
  bottom: calc(var(--node-size) * -0.4);
  left: 50%;
  transform: translate(-50%, 7px);
  white-space: nowrap;
  font-size: clamp(0.58rem, 0.95vw, 0.74rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(18, 54, 96, 0.92);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.65);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.2s ease;
}

.premium-node:hover .premium-node-label,
.premium-node:focus-visible .premium-node-label {
  opacity: 1;
  transform: translate(-50%, 0);
}

.premium-stack-mobile {
  display: none;
}

.premium-mobile-item {
  display: inline-flex;
  align-items: center;
  gap: 0.58rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(125, 182, 255, 0.24);
  background: rgba(10, 26, 50, 0.78);
  color: #e2eeff;
  font-weight: 700;
  animation: premium-mobile-item-in 0.36s ease both;
  animation-delay: var(--d, 0s);
}

.premium-mobile-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ring);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ring) 34%, transparent 66%);
}

.premium-mobile-label {
  font-size: 0.82rem;
}

.premium-mobile-icon {
  color: #d8eaff;
  opacity: 0.95;
}

@keyframes rise-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
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
  from { opacity: 0; transform: translate3d(-24px,-18px,0) scale(0.9); }
  to   { opacity: 1; transform: translate3d(0,0,0) scale(1); }
}
@keyframes orbit-settle-one {
  from { opacity: 0; transform: scale(0.82) rotate(-18deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes orbit-settle-two {
  from { opacity: 0; transform: scale(0.84) rotate(20deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes dot-enter {
  from { opacity: 0; box-shadow: 0 0 0 0 rgba(19,111,99,0); transform: scale(0.5); }
  to   { opacity: 1; box-shadow: 0 0 0 6px rgba(19,111,99,0.13); transform: scale(1); }
}
@keyframes halo-enter {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 0.92; transform: scale(1); }
}

@keyframes premium-node-in {
  from {
    opacity: 0;
    transform: translate(-50%, -44%) scale(0.92);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes premium-line-in {
  from {
    stroke-dashoffset: 1000;
  }

  to {
    stroke-dashoffset: 0;
  }
}

@keyframes premium-mobile-item-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
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
  .premium-stack-map {
    display: none;
  }

  .premium-stack-mobile {
    display: flex;
    flex-wrap: wrap;
    gap: 0.54rem;
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
  .hero-v2-desc { max-width: none; }
  .hero-v2-eyebrow { justify-content: center; }
  .hero-v2-ctas { justify-content: center; }
  .hero-v2-chips { justify-content: center; }
  .hero-v2-stats { justify-content: center; }
  .hero-v2-photo-wrap {
    min-height: 340px;
    order: -1;
  }
  .hero-v2-photo { width: clamp(200px, 60vw, 320px); }
  .hero-v2-ring-2, .hero-v2-ring-3 { display: none; }
  .hero-v2-ring-1 { width: 300px; height: 300px; }
  .hero-v2-badge-vue   { top: 10%; left: 4%; }
  .hero-v2-badge-node  { top: 10%; right: 4%; }
  .hero-v2-badge-exp   { bottom: 16%; left: 2%; }
  .hero-v2-badge-location { display: none; }
}

@media (max-width: 600px) {
  .hero-v2 { min-height: auto; }
  .hero-v2-scroll-cue { display: none; }
  .hero-v2-badge { font-size: 0.68rem; padding: 0.32rem 0.6rem; }
  .luxe-flow-card { padding: 1.15rem !important; }
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
  .premium-connector,
  .premium-node,
  .premium-mobile-item {
    animation: none;
    opacity: 1;
  }
  .luxe-flow-card, .premium-node, .stat-card { transition: none; }
}
</style>
