<script setup>
import PhotoZoomDialog from "@/components/PhotoZoomDialog.vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const myPhoto = getMediaUrl("Picture/my-pic.jpg");

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
    <section class="hero-card hero-full-bleed pa-6 pa-md-10 mb-10">
      <div class="glow-dot hero-dot"></div>
      <div class="hero-orbit hero-orbit-one" aria-hidden="true"></div>
      <div class="hero-orbit hero-orbit-two" aria-hidden="true"></div>
      <v-row align="center" class="ga-0">
        <v-col cols="12" md="7" class="pr-md-8 hero-copy-column">
          <v-chip
            color="secondary"
            variant="flat"
            class="font-weight-bold mb-4 startup-item"
            style="--delay: 0.08s"
          >
            Full-Stack Developer Portfolio
          </v-chip>
          <h1
            class="text-h3 text-md-h2 mb-4 hero-title startup-item"
            style="--delay: 0.16s"
          >
            Building fast, elegant web experiences that people enjoy using.
          </h1>
          <p
            class="text-body-1 muted-copy mb-6 hero-subtitle startup-item"
            style="--delay: 0.24s"
          >
            I am Laksh Solanki, a developer focused on Vue, Node.js, and modern
            product engineering. I design and ship applications that balance
            performance, usability, and maintainability.
          </p>

          <div
            class="d-flex flex-wrap ga-3 mb-6 startup-item"
            style="--delay: 0.32s"
          >
            <v-btn
              color="primary"
              size="large"
              rounded="xl"
              class="text-none px-6"
              to="/projects"
            >
              Explore Projects
            </v-btn>
            <v-btn
              variant="outlined"
              color="primary"
              size="large"
              rounded="xl"
              class="text-none px-6"
              to="/about"
            >
              View Full Profile
            </v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2 hero-skill-row">
            <v-chip
              v-for="(skill, index) in techStack"
              :key="skill"
              color="primary"
              variant="tonal"
              size="small"
              class="startup-chip"
              :style="{ '--delay': `${0.4 + index * 0.05}s` }"
            >
              {{ skill }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" md="5" class="mt-8 mt-md-0 hero-profile-column">
          <div class="hero-profile pa-5 startup-profile">
            <div class="profile-halo" aria-hidden="true"></div>
            <div class="startup-item" style="--delay: 0.2s">
              <PhotoZoomDialog
                :src="myPhoto"
                alt="Laksh Solanki"
                :size="150"
                avatar-class="mx-auto d-flex profile-ring"
              />
            </div>
            <h2
              class="text-h5 text-center mt-5 mb-1 startup-item"
              style="--delay: 0.28s"
            >
              Laksh Solanki
            </h2>
            <p
              class="text-center muted-copy mb-5 startup-item"
              style="--delay: 0.34s"
            >
              Senior Full-Stack Engineer
            </p>
            <v-divider
              class="mb-4 startup-item"
              style="--delay: 0.4s"
            ></v-divider>
            <div class="d-flex flex-column ga-2">
              <div
                v-for="(fact, index) in profileFacts"
                :key="fact.label"
                class="d-flex justify-space-between profile-fact"
                :style="{ '--delay': `${0.46 + index * 0.07}s` }"
              >
                <span class="muted-copy">{{ fact.label }}</span>
                <strong>{{ fact.value }}</strong>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
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

.hero-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  animation: rise-in 0.45s ease;
}

.hero-full-bleed {
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.98), rgba(239, 247, 244, 0.96));
}

.hero-card::before {
  content: "";
  position: absolute;
  top: -120px;
  left: -100px;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(76, 207, 183, 0.18) 0%,
    rgba(76, 207, 183, 0) 72%
  );
  opacity: 0;
  z-index: 0;
  pointer-events: none;
  animation: hero-blob-enter 1.35s cubic-bezier(0.22, 1, 0.36, 1) 0.08s forwards;
}

.hero-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 14%,
    rgba(255, 255, 255, 0.09) 34%,
    transparent 56%
  );
  opacity: 0;
  transform: translateX(-135%);
  z-index: 0;
  pointer-events: none;
  animation: hero-sheen 1.15s cubic-bezier(0.22, 1, 0.36, 1) 0.34s forwards;
}

.hero-dot {
  top: 26px;
  right: 28px;
  opacity: 0;
  animation: dot-enter 0.72s cubic-bezier(0.22, 1, 0.36, 1) 0.42s forwards;
}

.hero-orbit {
  position: absolute;
  border: 1px solid rgba(76, 207, 183, 0.14);
  border-radius: 999px;
  opacity: 0;
  z-index: 0;
  pointer-events: none;
}

.hero-orbit-one {
  top: 46px;
  right: 23%;
  width: 168px;
  height: 168px;
  animation: orbit-settle-one 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
}

.hero-orbit-two {
  right: -54px;
  bottom: -84px;
  width: 260px;
  height: 260px;
  border-color: rgba(242, 180, 80, 0.16);
  animation: orbit-settle-two 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.28s forwards;
}

.hero-copy-column,
.hero-profile-column {
  position: relative;
  z-index: 1;
}

.hero-title {
  line-height: 1.1;
  max-width: 17ch;
}

.hero-subtitle {
  max-width: 55ch;
}

.hero-skill-row {
  row-gap: 0.6rem;
}

.hero-profile {
  position: relative;
  border-radius: 22px;
  background: linear-gradient(165deg, #ffffff, #eef8f3);
  border: 1px solid rgba(19, 111, 99, 0.2);
}

.startup-profile {
  opacity: 0;
  animation: profile-enter 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.22s forwards;
}

.profile-halo {
  position: absolute;
  right: -52px;
  bottom: -76px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(76, 207, 183, 0.18) 0%,
    rgba(76, 207, 183, 0) 70%
  );
  opacity: 0;
  pointer-events: none;
  animation: halo-enter 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.36s forwards;
}

.profile-ring {
  border: 3px solid #ffffff;
  box-shadow: 0 14px 35px rgba(19, 111, 99, 0.25);
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

@media (max-width: 600px) {
  .hero-dot {
    display: none;
  }

  .hero-orbit-two {
    right: -92px;
    bottom: -120px;
  }

  .hero-title,
  .hero-subtitle {
    max-width: none;
  }

  .luxe-flow-card {
    padding: 1.15rem !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-card::before,
  .hero-card::after,
  .hero-dot,
  .hero-orbit,
  .profile-halo,
  .startup-item,
  .startup-heading,
  .startup-stat,
  .startup-project,
  .startup-flow-card,
  .startup-chip,
  .startup-profile,
  .profile-fact,
  .luxe-orb,
  .premium-connector,
  .premium-node,
  .premium-mobile-item {
    animation: none;
    opacity: 1;
  }

  .luxe-flow-card,
  .premium-node,
  .stat-card {
    transition: none;
  }
}
</style>
