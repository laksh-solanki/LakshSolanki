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

    <!-- ═══ STATS SECTION ═══ -->
    <section class="mb-12 home-section">
      <v-row>
        <v-col
          v-for="(stat, index) in impactStats"
          :key="stat.label"
          cols="12"
          sm="4"
        >
          <div
            class="prem-stat-card startup-stat"
            :style="{ '--delay': `${0.08 + index * 0.09}s` }"
          >
            <div class="prem-stat-glow"></div>
            <span class="prem-stat-value">{{ stat.value }}</span>
            <span class="prem-stat-label">{{ stat.label }}</span>
          </div>
        </v-col>
      </v-row>
    </section>

    <!-- ═══ WHAT I BUILD ═══ -->
    <section class="mb-12 home-section">
      <div class="prem-section-head startup-heading" style="--delay: 0.08s">
        <div>
          <p class="prem-kicker">PREMIUM STACK</p>
          <h2 class="prem-section-title">What I Build</h2>
        </div>
        <v-btn
          to="/projects"
          variant="outlined"
          rounded="xl"
          class="prem-ghost-btn text-none"
        >
          <v-icon start size="16">mdi-arrow-right</v-icon>
          See all projects
        </v-btn>
      </div>

      <div class="prem-panel startup-flow-card">
        <div class="prem-panel-glow prem-panel-glow-tl"></div>
        <div class="prem-panel-glow prem-panel-glow-br"></div>

        <div class="prem-panel-header">
          <v-chip size="small" class="prem-year-chip">2026 Stack</v-chip>
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
            <v-icon v-if="node.icon" class="premium-node-core" :icon="node.icon" />
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
            <span class="premium-mobile-dot" :style="{ '--ring': node.ring }"></span>
            <v-icon v-if="node.icon" class="premium-mobile-icon" :icon="node.icon" size="16" />
            <span class="premium-mobile-label">{{ node.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ HOW I DELIVER ═══ -->
    <section class="mb-12 home-section">
      <div class="prem-section-head startup-heading" style="--delay: 0.08s">
        <div>
          <p class="prem-kicker">COLLABORATION MODEL</p>
          <h2 class="prem-section-title">How I Deliver</h2>
        </div>
      </div>

      <div class="prem-panel prem-deliver-panel startup-flow-card">
        <div class="prem-panel-glow prem-panel-glow-tl"></div>
        <v-row class="ga-0" align="start">
          <v-col cols="12" md="5" class="pr-md-8">
            <h3 class="prem-sub-title mb-3">
              Minimal process, maximum clarity and execution.
            </h3>
            <p class="prem-muted mb-6">
              I partner closely with teams to keep delivery lean, practical, and
              focused on real outcomes.
            </p>
            <div class="d-flex flex-wrap ga-2">
              <span
                v-for="(item, index) in deliveryFocus"
                :key="item"
                class="delivery-chip"
                :style="{ '--delay': `${0.2 + index * 0.05}s` }"
              >
                <v-icon size="12" class="mr-1">mdi-check-circle-outline</v-icon>
                {{ item }}
              </span>
            </div>
          </v-col>
          <v-col cols="12" md="7" class="mt-8 mt-md-0">
            <div class="collab-list">
              <article
                v-for="(item, index) in collaborationSteps"
                :key="item.step"
                class="collab-item"
                :style="{ '--delay': `${0.24 + index * 0.07}s` }"
              >
                <span class="collab-step">{{ item.step }}</span>
                <div>
                  <h4 class="collab-title mb-1">{{ item.title }}</h4>
                  <p class="prem-muted mb-0">{{ item.description }}</p>
                </div>
              </article>
            </div>
          </v-col>
        </v-row>
      </div>
    </section>

    <!-- ═══ WHAT YOU CAN EXPECT + CTA ═══ -->
    <section class="home-section">
      <div class="prem-section-head startup-heading" style="--delay: 0.1s">
        <div>
          <p class="prem-kicker">VALUES</p>
          <h2 class="prem-section-title">What You Can Expect</h2>
        </div>
      </div>

      <v-row class="mb-6">
        <v-col
          v-for="(pillar, index) in valuePillars"
          :key="pillar.title"
          cols="12"
          md="4"
        >
          <div
            class="prem-pillar-card startup-project"
            :style="{ '--delay': `${0.14 + index * 0.09}s` }"
          >
            <div class="prem-pillar-icon-wrap">
              <v-icon :icon="pillar.icon" size="22" class="prem-pillar-icon"></v-icon>
            </div>
            <h3 class="prem-pillar-title">{{ pillar.title }}</h3>
            <p class="prem-muted mb-0">{{ pillar.description }}</p>
          </div>
        </v-col>
      </v-row>

      <!-- CTA Banner -->
      <div class="prem-cta-banner startup-heading" style="--delay:0.2s">
        <div class="prem-cta-glow"></div>
        <div class="prem-cta-content">
          <h3 class="prem-cta-title">Looking for a focused development partner?</h3>
          <p class="prem-cta-sub">Explore projects or review my profile to see how I build and deliver.</p>
        </div>
        <div class="prem-cta-actions">
          <v-btn
            to="/projects"
            rounded="xl"
            size="large"
            class="prem-cta-btn-primary text-none px-7"
            elevation="0"
          >
            <v-icon start>mdi-rocket-launch-outline</v-icon>
            Browse Projects
          </v-btn>
          <v-btn
            to="/about"
            variant="outlined"
            rounded="xl"
            size="large"
            class="prem-cta-btn-outline text-none px-7"
            elevation="0"
          >
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
  color: #39bca3;
  margin-bottom: 1.4rem;
}
.hero-v2-eyebrow-dot {
  width: 8px; height: 8px;
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
.hero-v2-role-prefix { color: #39bca3; margin-right: 0.25rem; }
.hero-v2-typed { color: #e2e8f0; }
.hero-v2-cursor {
  color: #39bca3;
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
  background: rgba(15,143,124,0.12);
  border-color: rgba(15,143,124,0.35);
}
.hero-v2-stat-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  background: linear-gradient(135deg, #39bca3, #0f8f7c);
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
  background: linear-gradient(108deg, #0b6f60, #0f8f7c) !important;
  color: #fff !important;
  box-shadow: 0 8px 28px rgba(15,143,124,0.48) !important;
  transition: box-shadow 0.22s, transform 0.18s !important;
}
.hero-v2-btn-primary:hover {
  box-shadow: 0 12px 36px rgba(15,143,124,0.65) !important;
  transform: translateY(-2px);
}
.hero-v2-btn-outline {
  border-color: rgba(15,143,124,0.5) !important;
  color: #39bca3 !important;
}
.hero-v2-btn-outline:hover {
  background: rgba(15,143,124,0.1) !important;
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
  background: rgba(15,143,124,0.1);
  border: 1px solid rgba(15,143,124,0.24);
  color: #39bca3;
  letter-spacing: 0.03em;
  cursor: default;
  transition: background 0.18s, border-color 0.18s;
}
.hero-v2-chip:hover {
  background: rgba(15,143,124,0.2);
  border-color: rgba(15,143,124,0.48);
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
  border: 1px solid rgba(15,143,124,0.14);
  top: 50%; left: 50%;
  transform: translate(-50%, -48%);
  pointer-events: none;
  animation: ring-spin 24s linear infinite;
}
.hero-v2-ring-1 { width: 420px; height: 420px; }
.hero-v2-ring-2 { width: 540px; height: 540px; border-color: rgba(15,143,124,0.08); animation-duration: 36s; animation-direction: reverse; }
.hero-v2-ring-3 { width: 660px; height: 660px; border-color: rgba(57,188,163,0.06); animation-duration: 52s; }

.hero-v2-photo-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 100%, rgba(15,143,124,0.55) 0%, rgba(11,111,96,0.25) 38%, transparent 68%);
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
  background: radial-gradient(ellipse, rgba(15,143,124,0.6) 0%, transparent 72%);
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
  filter: drop-shadow(0 24px 64px rgba(15,143,124,0.42)) drop-shadow(0 4px 16px rgba(0,0,0,0.5));
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
  background: linear-gradient(to bottom, rgba(15,143,124,0.7), transparent);
  animation: scroll-line-pulse 2.4s ease-in-out infinite;
}
.hero-v2-scroll-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(15,143,124,0.6);
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
  0%,100% { box-shadow: 0 0 8px 2px rgba(57,188,163,0.7); }
  50%     { box-shadow: 0 0 14px 5px rgba(57,188,163,0.35); }
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

/* ═══════════════════════════════════════════════
   PREMIUM STAT CARDS
═══════════════════════════════════════════════ */
.prem-stat-card {
  position: relative;
  overflow: hidden;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(15,143,124,0.18);
  border-radius: 20px;
  padding: 2rem 1.8rem;
  text-align: center;
  backdrop-filter: blur(14px);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  box-shadow: 0 10px 30px rgba(15,143,124,0.06);
}
.prem-stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(15,143,124,0.12);
  border-color: rgba(15,143,124,0.35);
}
.prem-stat-glow {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: radial-gradient(ellipse at 50% 0%, rgba(15,143,124,0.12) 0%, transparent 65%);
  pointer-events: none;
}
.prem-stat-value {
  display: block;
  font-size: clamp(2.4rem, 4vw, 3.2rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #0b6f60 0%, #0f8f7c 50%, #39bca3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 0.5rem;
}
.prem-stat-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #5e706a;
}

/* ═══════════════════════════════════════════════
   PREMIUM SECTION HEADING
═══════════════════════════════════════════════ */
.prem-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.prem-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #39bca3;
  margin-bottom: 0.35rem;
}
.prem-section-title {
  font-size: clamp(1.6rem, 2.8vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(110deg, #0e201d 0%, #0b6f60 55%, #0f8f7c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}
.prem-ghost-btn {
  border-color: rgba(15,143,124,0.28) !important;
  color: #0f8f7c !important;
  transition: background 0.2s, border-color 0.2s !important;
}
.prem-ghost-btn:hover {
  background: rgba(15,143,124,0.06) !important;
  border-color: rgba(15,143,124,0.5) !important;
}

/* ═══════════════════════════════════════════════
   PREMIUM PANEL (shared glass card)
═══════════════════════════════════════════════ */
.prem-panel {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(15,143,124,0.15);
  background:
    radial-gradient(ellipse at 8% 12%, rgba(15,143,124,0.05) 0%, transparent 48%),
    radial-gradient(ellipse at 90% 88%, rgba(57,188,163,0.04) 0%, transparent 44%),
    linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(244,249,247,0.85) 55%, rgba(237,245,242,0.85) 100%);
  backdrop-filter: blur(14px);
  padding: 2rem 2rem;
  box-shadow: 0 16px 40px rgba(0,0,0,0.06);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.prem-panel:hover {
  box-shadow: 0 24px 56px rgba(0,0,0,0.09), 0 0 0 1px rgba(15,143,124,0.22);
  transform: translateY(-2px);
}
.prem-panel-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(70px);
  opacity: 0.6;
}
.prem-panel-glow-tl {
  top: -120px;
  left: -80px;
  background: radial-gradient(circle, rgba(15,143,124,0.25) 0%, transparent 70%);
}
.prem-panel-glow-br {
  bottom: -100px;
  right: -60px;
  background: radial-gradient(circle, rgba(57,188,163,0.25) 0%, transparent 70%);
}
.prem-panel-header {
  margin-bottom: 1.2rem;
}
.prem-year-chip {
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em !important;
  background: rgba(15,143,124,0.08) !important;
  border: 1px solid rgba(15,143,124,0.22) !important;
  color: #0f8f7c !important;
  backdrop-filter: blur(8px);
}

/* Deliver panel extras */
.prem-deliver-panel .prem-panel-glow-tl {
  background: radial-gradient(circle, rgba(15,143,124,0.2) 0%, transparent 70%);
}
.prem-deliver-panel .prem-panel-glow-br {
  background: radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%);
}

/* ─── Sub-title & muted ─── */
.prem-sub-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0e201d;
  letter-spacing: -0.02em;
  max-width: 26ch;
  line-height: 1.4;
}
.prem-muted {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #5e706a;
}

/* ─── Delivery chips ─── */
.delivery-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.85rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(15,143,124,0.06);
  border: 1px solid rgba(15,143,124,0.18);
  color: #0f8f7c;
  opacity: 0;
  animation: chip-in 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
  transition: background 0.2s, border-color 0.2s;
}
.delivery-chip:hover {
  background: rgba(15,143,124,0.12);
  border-color: rgba(15,143,124,0.3);
}

/* ─── Collab steps ─── */
.collab-list {
  display: grid;
  gap: 0.9rem;
}
.collab-item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 16px;
  border: 1px solid rgba(15,143,124,0.12);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(8px);
  opacity: 0;
  animation: startup-scale 0.62s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
  transition: border-color 0.22s, background 0.22s;
}
.collab-item:hover {
  border-color: rgba(15,143,124,0.28);
  background: rgba(15,143,124,0.04);
}
.collab-step {
  min-width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(135deg, #0f8f7c, #0b6f60);
  flex-shrink: 0;
}
.collab-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #0e201d;
}

/* ═══════════════════════════════════════════════
   PREMIUM PILLAR CARDS
═══════════════════════════════════════════════ */
.prem-pillar-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(15,143,124,0.2);
  background:
    radial-gradient(ellipse at 10% 0%, rgba(15,143,124,0.14) 0%, transparent 55%),
    linear-gradient(150deg, #071812 0%, #080e18 100%);
  padding: 1.8rem 1.6rem;
  height: 100%;
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}
.prem-pillar-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 54px rgba(15,143,124,0.2);
  border-color: rgba(15,143,124,0.42);
}
.prem-pillar-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(15,143,124,0.12);
  border: 1px solid rgba(15,143,124,0.26);
  display: grid;
  place-items: center;
  margin-bottom: 1.2rem;
  transition: background 0.22s, border-color 0.22s;
}
.prem-pillar-card:hover .prem-pillar-icon-wrap {
  background: rgba(15,143,124,0.22);
  border-color: rgba(15,143,124,0.5);
}
.prem-pillar-icon {
  color: #39bca3 !important;
}
.prem-pillar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.6rem;
  letter-spacing: -0.01em;
}

/* ═══════════════════════════════════════════════
   CTA BANNER
═══════════════════════════════════════════════ */
.prem-cta-banner {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(15,143,124,0.22);
  background:
    radial-gradient(ellipse at 0% 50%, rgba(15,143,124,0.1) 0%, transparent 52%),
    radial-gradient(ellipse at 100% 50%, rgba(57,188,163,0.08) 0%, transparent 52%),
    linear-gradient(120deg, #ffffff 0%, #f4f9f7 60%, #edf5f2 100%);
  padding: 2.2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.8rem;
  box-shadow: 0 16px 40px rgba(0,0,0,0.06);
}
.prem-cta-glow {
  position: absolute;
  top: -80px;
  left: -60px;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15,143,124,0.15) 0%, transparent 70%);
  filter: blur(64px);
  pointer-events: none;
}
.prem-cta-content {
  flex: 1;
  min-width: 240px;
}
.prem-cta-title {
  font-size: clamp(1.25rem, 2.5vw, 1.7rem);
  font-weight: 800;
  color: #0e201d;
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}
.prem-cta-sub {
  font-size: 0.95rem;
  color: #5e706a;
  line-height: 1.65;
  margin: 0;
}
.prem-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  flex-shrink: 0;
}
.prem-cta-btn-primary {
  background: linear-gradient(108deg, #0b6f60, #0f8f7c) !important;
  color: #fff !important;
  box-shadow: 0 8px 28px rgba(15,143,124,0.45) !important;
  transition: box-shadow 0.22s, transform 0.18s !important;
}
.prem-cta-btn-primary:hover {
  box-shadow: 0 12px 36px rgba(15,143,124,0.62) !important;
  transform: translateY(-2px);
}
.prem-cta-btn-outline {
  border-color: rgba(15,143,124,0.48) !important;
  color: #39bca3 !important;
  transition: background 0.2s !important;
}
.prem-cta-btn-outline:hover {
  background: rgba(15,143,124,0.1) !important;
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
  
  /* Premium panels responsive */
  .prem-stat-card {
    padding: 1.5rem 1.2rem;
  }
  .prem-panel {
    padding: 1.5rem 1.25rem;
  }
  .collab-item {
    gap: 0.75rem;
    padding: 0.8rem 1rem;
  }
  .prem-cta-banner {
    padding: 1.5rem 1.25rem;
    flex-direction: column;
    text-align: center;
    gap: 1.25rem;
  }
  .prem-cta-actions {
    justify-content: center;
    width: 100%;
  }
  .prem-cta-btn-primary, .prem-cta-btn-outline {
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
  .premium-connector,
  .premium-node,
  .premium-mobile-item {
    animation: none;
    opacity: 1;
  }
  .luxe-flow-card, .premium-node, .stat-card { transition: none; }
}
</style>
