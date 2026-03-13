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

const featuredProjects = [
  {
    title: "Certificate Generator",
    description: "Generate branded certificates in-browser and export polished PDFs.",
    image: getMediaUrl("project_img/Project-1.png"),
    to: "/projects/certificate-gen",
  },
  {
    title: "Mindlytic AI Assistant",
    description: "Prompt-driven coding assistant with markdown rendering and code snippets.",
    image: getMediaUrl("project_img/Project-5.png"),
    to: "/projects/mindly_ai",
  },
  {
    title: "PDF to Image Utility",
    description: "Fast conversion utility for extracting high quality images from PDFs.",
    image: getMediaUrl("Picture/Project-3.jpg"),
    to: "/projects/pdf-img",
  },
];
</script>

<template>
  <v-container class="py-8 py-md-14 home-shell">
    <section class="section-shell hero-card pa-6 pa-md-10 mb-10">
      <div class="glow-dot hero-dot"></div>
      <div class="hero-orbit hero-orbit-one" aria-hidden="true"></div>
      <div class="hero-orbit hero-orbit-two" aria-hidden="true"></div>
      <v-row align="center" class="ga-0">
        <v-col cols="12" md="7" class="pr-md-8 hero-copy-column">
          <v-chip color="secondary" variant="flat" class="font-weight-bold mb-4 startup-item" style="--delay: 0.08s">
            Full-Stack Developer Portfolio
          </v-chip>
          <h1 class="text-h3 text-md-h2 mb-4 hero-title startup-item" style="--delay: 0.16s">
            Building fast, elegant web experiences that people enjoy using.
          </h1>
          <p class="text-body-1 muted-copy mb-6 hero-subtitle startup-item" style="--delay: 0.24s">
            I am Laksh Solanki, a developer focused on Vue, Node.js, and modern product engineering.
            I design and ship applications that balance performance, usability, and maintainability.
          </p>

          <div class="d-flex flex-wrap ga-3 mb-6 startup-item" style="--delay: 0.32s">
            <v-btn color="primary" size="large" rounded="xl" class="text-none px-6" to="/projects">
              Explore Projects
            </v-btn>
            <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-6" to="/about">
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
              <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="150" avatar-class="mx-auto d-flex profile-ring" />
            </div>
            <h2 class="text-h5 text-center mt-5 mb-1 startup-item" style="--delay: 0.28s">Laksh Solanki</h2>
            <p class="text-center muted-copy mb-5 startup-item" style="--delay: 0.34s">Senior Full-Stack Engineer</p>
            <v-divider class="mb-4 startup-item" style="--delay: 0.4s"></v-divider>
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
        <v-col v-for="(stat, index) in impactStats" :key="stat.label" cols="12" sm="4">
          <v-card class="section-shell pa-6 stat-card h-100 startup-stat border " rounded="xl" :style="{ '--delay': `${0.08 + index * 0.09}s` }" flat>
            <p class="text-h4 font-weight-bold mb-1">{{ stat.value }}</p>
            <p class="muted-copy mb-0">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <section class="mb-10 home-section">
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3 startup-heading" style="--delay: 0.08s">
        <h2 class="text-h4 mb-0">What I Build</h2>
        <v-btn to="/projects" variant="text" color="primary" class="text-none">See all projects</v-btn>
      </div>
      <v-card class="section-shell pa-6 pa-md-8 luxe-flow-card startup-flow-card" flat>
        <div class="luxe-orb"></div>

        <div class="d-flex align-center justify-space-between mb-5 flex-wrap ga-3 luxe-head">
          <div class="d-flex align-center ga-3">
            <div>
              <p class="text-overline mb-0 luxe-kicker">PREMIUM STACK</p>
            </div>
          </div>
          <v-chip size="small" color="secondary" variant="flat" class="luxe-chip">2026</v-chip>
        </div>

        <div class="luxe-flow" aria-label="What I Build tree">
          <span class="luxe-step is-root" style="--d: 0.06s">
            html
          </span>
          <span class="luxe-link" style="--d: 0.1s"></span>

          <span class="luxe-step" style="--d: 0.14s">
            css
            <span class="luxe-sub">tailwind</span>
          </span>
          <span class="luxe-link" style="--d: 0.18s"></span>

          <span class="luxe-step" style="--d: 0.22s">
            js
            <span class="luxe-sub">backend</span>
          </span>
          <span class="luxe-link" style="--d: 0.26s"></span>

          <span class="luxe-step" style="--d: 0.3s">vue</span>
          <span class="luxe-link" style="--d: 0.34s"></span>

          <span class="luxe-step is-leaf" style="--d: 0.38s">vuetify</span>
        </div>
      </v-card>
    </section>

    <section class="home-section">
      <h2 class="text-h4 mb-4 startup-heading" style="--delay: 0.1s">Featured Work</h2>
      <v-row>
        <v-col v-for="(project, index) in featuredProjects" :key="project.title" cols="12" md="4">
          <v-card
            class="section-shell project-card h-100 startup-project"
            :style="{ '--delay': `${0.14 + index * 0.1}s` }"
            :to="project.to"
            flat
          >
            <v-img :src="project.image" height="190" cover loading="lazy" decoding="async" class="project-media"></v-img>
            <div class="pa-5">
              <h3 class="text-h6 mb-2">{{ project.title }}</h3>
              <p class="muted-copy mb-4">{{ project.description }}</p>
              <span class="text-primary font-weight-bold">Open project ?</span>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </v-container>
</template>

<style scoped>
.home-shell {
  max-width: 1220px;
  position: relative;
}

.hero-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  animation: rise-in 0.45s ease;
}

.hero-card::before {
  content: "";
  position: absolute;
  top: -120px;
  left: -100px;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 207, 183, 0.18) 0%, rgba(76, 207, 183, 0) 72%);
  opacity: 0;
  z-index: 0;
  pointer-events: none;
  animation: hero-blob-enter 1.35s cubic-bezier(0.22, 1, 0.36, 1) 0.08s forwards;
}

.hero-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 14%, rgba(255, 255, 255, 0.09) 34%, transparent 56%);
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
  background: radial-gradient(circle, rgba(76, 207, 183, 0.18) 0%, rgba(76, 207, 183, 0) 70%);
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

.stat-card,
.project-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.stat-card:hover,
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(16, 35, 31, 0.12);
}

.luxe-flow-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(19, 111, 99, 0.24);
  background:
    radial-gradient(circle at 7% 14%, rgba(19, 111, 99, 0.16) 0%, transparent 34%),
    linear-gradient(155deg, #ffffff 0%, #f5fcf8 54%, #eef7ff 100%);
  box-shadow: 0 18px 36px rgba(16, 35, 31, 0.11);
  transition: transform 0.28s ease, box-shadow 0.28s ease;
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
  background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 74%);
  pointer-events: none;
  animation: luxe-orb-float 6s ease-in-out infinite;
}

.luxe-head,
.luxe-flow {
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

.luxe-flow {
  display: grid;
  grid-template-columns: auto 34px auto 34px auto 34px auto 34px auto;
  align-items: center;
  gap: 0.48rem;
}

.luxe-step {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  padding: 0.48rem 0.82rem;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.22);
  background: rgba(255, 255, 255, 0.86);
  color: #0d5248;
  font-weight: 700;
  text-transform: lowercase;
  backdrop-filter: blur(4px);
  box-shadow: 0 9px 18px rgba(13, 82, 72, 0.09);
  transition: transform 0.24s ease, background-color 0.24s ease, box-shadow 0.24s ease;
  animation: luxe-step-in 0.4s ease both;
  animation-delay: var(--d, 0s);
}

.luxe-step:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14px 24px rgba(13, 82, 72, 0.14);
}

.luxe-step.is-root {
  background: rgba(19, 111, 99, 0.14);
}

.luxe-step.is-leaf {
  background: rgba(245, 158, 11, 0.13);
  border-color: rgba(245, 158, 11, 0.26);
  color: #6d4307;
}

.luxe-step-avatar {
  border: 1px solid #ffffff;
}

.luxe-sub {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0e6155;
  background: rgba(19, 111, 99, 0.11);
  border: 1px solid rgba(19, 111, 99, 0.24);
}

.luxe-link {
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(19, 111, 99, 0.2), rgba(19, 111, 99, 0.56));
  transform-origin: left center;
  transform: scaleX(0);
  animation: luxe-link-in 0.35s ease forwards;
  animation-delay: var(--d, 0s);
}

.project-card {
  overflow: hidden;
}

.project-media {
  transition: transform 0.4s ease;
}

.project-card:hover .project-media {
  transform: scale(1.04);
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

@keyframes luxe-step-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes luxe-link-in {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
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

@media (max-width: 960px) {
  .luxe-flow {
    grid-template-columns: 1fr;
    gap: 0.52rem;
  }

  .luxe-link {
    width: 2px;
    height: 14px;
    margin-left: 1.08rem;
    background: rgba(19, 111, 99, 0.45);
    transform-origin: top center;
    transform: scaleY(0);
    animation: luxe-link-vertical 0.3s ease forwards;
    animation-delay: var(--d, 0s);
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

  .luxe-chip {
    display: none;
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
  .luxe-step,
  .luxe-link {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .luxe-flow-card,
  .luxe-step,
  .stat-card,
  .project-card {
    transition: none;
  }
}

@keyframes luxe-link-vertical {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}
</style>
