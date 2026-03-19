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

const heroSignals = [
  { label: "Delivery", value: "Fast turnaround" },
  { label: "Focus", value: "Premium UI systems" },
  { label: "Stack", value: "Vue + Node + APIs" },
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
    <section class="section-shell hero-card pa-5 pa-md-8 mb-8">
      <div class="hero-grid">
        <div class="hero-copy-column">
          <div class="hero-kicker-row startup-item" style="--delay: 0.06s">
            <v-chip color="secondary" variant="flat" class="hero-kicker">Full-Stack Developer Portfolio</v-chip>
            <span class="hero-availability">
              <span class="hero-status-dot" aria-hidden="true"></span>
              Select projects only
            </span>
          </div>

          <h1 class="hero-title startup-item" style="--delay: 0.14s">
            Clean Vue and Node experiences, designed with restraint.
          </h1>

          <p class="text-body-1 muted-copy hero-subtitle startup-item" style="--delay: 0.22s">
            I'm Laksh Solanki, a full-stack developer focused on polished UI systems, performance,
            and practical product engineering.
          </p>

          <div class="hero-actions startup-item" style="--delay: 0.3s">
            <v-btn color="primary" size="large" rounded="xl" class="text-none px-5 hero-primary-btn" to="/projects">
              Explore Projects
            </v-btn>
            <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-5 hero-secondary-btn" to="/about">
              View Full Profile
            </v-btn>
          </div>

          <div class="hero-meta-row startup-item" style="--delay: 0.38s">
            <span v-for="signal in heroSignals" :key="signal.label" class="hero-meta-pill">
              {{ signal.value }}
            </span>
          </div>
        </div>

        <div class="hero-profile-column">
          <div class="hero-profile startup-profile">
            <div class="hero-profile-glow" aria-hidden="true"></div>

            <div class="hero-profile-top">
              <div class="hero-photo-frame startup-item" style="--delay: 0.18s">
                <PhotoZoomDialog :src="myPhoto" alt="Laksh Solanki" :size="136" avatar-class="mx-auto d-flex hero-avatar" />
              </div>

              <div class="hero-profile-copy">
                <p class="hero-profile-kicker startup-item" style="--delay: 0.24s">Available now</p>
                <h2 class="hero-profile-name startup-item" style="--delay: 0.3s">Laksh Solanki</h2>
                <p class="hero-role startup-item" style="--delay: 0.36s">Senior Full-Stack Engineer</p>

                <div class="hero-profile-status startup-item" style="--delay: 0.42s">
                  <v-chip color="primary" variant="flat" size="small" class="text-none hero-status-chip">
                    Open for freelance
                  </v-chip>
                  <span>Gujarat, India</span>
                </div>
              </div>
            </div>

            <div class="hero-profile-facts">
              <div
                v-for="(fact, index) in profileFacts"
                :key="fact.label"
                class="hero-profile-fact startup-item"
                :style="{ '--delay': `${0.5 + index * 0.06}s` }"
              >
                <span>{{ fact.label }}</span>
                <strong>{{ fact.value }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  border-radius: 32px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background:
    radial-gradient(circle at 0% 0%, rgba(19, 111, 99, 0.08) 0%, transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 24%),
    linear-gradient(145deg, #ffffff 0%, #fbfdfc 42%, #eff5ff 100%);
  box-shadow: 0 26px 60px rgba(16, 35, 31, 0.1);
  animation: rise-in 0.45s ease;
}

.hero-card::before {
  content: "";
  position: absolute;
  left: -150px;
  bottom: -170px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 207, 183, 0.2) 0%, rgba(76, 207, 183, 0) 70%);
  opacity: 0.95;
  pointer-events: none;
}

.hero-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, transparent 18%, rgba(255, 255, 255, 0.72) 30%, transparent 46%),
    repeating-linear-gradient(90deg, rgba(19, 111, 99, 0.035) 0 1px, transparent 1px 28px);
  opacity: 0.72;
  pointer-events: none;
  transform: translateX(-120%);
  animation: hero-sheen 1.15s cubic-bezier(0.22, 1, 0.36, 1) 0.26s forwards;
}

.hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  gap: clamp(1.2rem, 2.2vw, 2rem);
  align-items: stretch;
}

.hero-copy-column,
.hero-profile-column {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-copy-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-profile-column {
  display: flex;
}

.hero-kicker-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.hero-title {
  margin-bottom: 1rem;
  max-width: 12ch;
  color: #0d1f1d;
  font-size: clamp(2.35rem, 4.2vw, 4rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.hero-subtitle {
  max-width: 46ch;
  font-size: 0.98rem;
  line-height: 1.72;
}

.hero-kicker {
  border-radius: 999px;
  box-shadow: 0 10px 22px rgba(19, 111, 99, 0.14);
  letter-spacing: 0.04em;
}

.hero-availability {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: rgba(255, 255, 255, 0.78);
  color: #34514c;
  box-shadow: 0 8px 18px rgba(16, 35, 31, 0.06);
  backdrop-filter: blur(12px);
}

.hero-status-dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: #0f8d79;
  box-shadow: 0 0 0 6px rgba(19, 111, 99, 0.12);
  animation: hero-status-pulse 2.8s ease-in-out infinite;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-bottom: 1rem;
}

.hero-primary-btn,
.hero-secondary-btn {
  min-height: 48px;
  border-radius: 999px;
  letter-spacing: 0.01em;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    background-color 0.24s ease,
    border-color 0.24s ease;
}

.hero-primary-btn {
  box-shadow: 0 14px 28px rgba(19, 111, 99, 0.16);
}

.hero-secondary-btn {
  background: rgba(255, 255, 255, 0.76);
  border-color: rgba(19, 111, 99, 0.16);
  box-shadow: 0 10px 20px rgba(16, 35, 31, 0.06);
  backdrop-filter: blur(12px);
}

.hero-primary-btn:hover,
.hero-secondary-btn:hover {
  transform: translateY(-2px);
}

.hero-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.hero-meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(19, 111, 99, 0.12);
  background: rgba(255, 255, 255, 0.82);
  color: #0e6155;
  font-size: 0.84rem;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(16, 35, 31, 0.06);
}

.hero-signals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.35rem;
}

.hero-signal {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(19, 111, 99, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(240, 247, 244, 0.96));
  box-shadow: 0 12px 26px rgba(16, 35, 31, 0.08);
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.hero-signal:hover {
  transform: translateY(-3px);
  border-color: rgba(19, 111, 99, 0.2);
  box-shadow: 0 18px 32px rgba(16, 35, 31, 0.12);
}

.hero-signal-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6a7f7a;
}

.hero-signal-value {
  color: #0f2f2a;
  font-size: 1.03rem;
  line-height: 1.35;
}

.hero-stack {
  padding-top: 1rem;
  border-top: 1px solid rgba(19, 111, 99, 0.12);
}

.hero-stack-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #136f63;
}

.hero-skill-row {
  row-gap: 0.7rem;
}

.hero-chip {
  background: rgba(255, 255, 255, 0.84);
  color: #0d5248;
  border: 1px solid rgba(19, 111, 99, 0.14);
  box-shadow: 0 9px 18px rgba(16, 35, 31, 0.06);
}

.hero-profile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  border-radius: 24px;
  padding: clamp(1rem, 1.8vw, 1.3rem);
  background:
    radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.14) 0%, transparent 28%),
    linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(241, 248, 245, 0.94));
  border: 1px solid rgba(19, 111, 99, 0.16);
  box-shadow: 0 18px 36px rgba(16, 35, 31, 0.1);
  overflow: hidden;
}

.startup-profile {
  opacity: 0;
  animation: profile-enter 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.22s forwards;
}

.hero-profile-glow {
  position: absolute;
  right: -62px;
  bottom: -92px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 207, 183, 0.2) 0%, rgba(76, 207, 183, 0) 70%);
  opacity: 0.95;
  pointer-events: none;
}

.hero-profile-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.hero-photo-frame {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(19, 111, 99, 0.12), rgba(255, 255, 255, 0.86));
  border: 1px solid rgba(19, 111, 99, 0.12);
  box-shadow: 0 12px 22px rgba(16, 35, 31, 0.07);
}

.hero-avatar {
  border: 3px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 12px 24px rgba(19, 111, 99, 0.2);
}

.hero-profile-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hero-profile-kicker {
  margin-bottom: 0.1rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #136f63;
}

.hero-profile-name {
  margin: 0;
  color: #0d1f1d;
  font-size: clamp(1.3rem, 1.9vw, 1.7rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.hero-role {
  margin: 0;
  color: #5d716e;
  font-weight: 500;
}

.hero-profile-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
  color: #506663;
  font-size: 0.88rem;
}

.hero-status-chip {
  box-shadow: 0 10px 20px rgba(19, 111, 99, 0.16);
}

.hero-profile-facts {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.1rem;
  margin-top: 0.1rem;
}

.hero-profile-fact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid rgba(19, 111, 99, 0.12);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease;
}

.hero-profile-fact:hover {
  transform: none;
  box-shadow: none;
}

.hero-profile-fact span {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6a7f7a;
}

.hero-profile-fact strong {
  color: #0f2f2a;
  font-size: 0.95rem;
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
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 1.35rem;
  }

  .hero-signals {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-profile-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-profile-top {
    align-items: flex-start;
  }

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
  .hero-kicker-row {
    align-items: flex-start;
  }

  .hero-availability {
    width: 100%;
    justify-content: flex-start;
  }

  .hero-title,
  .hero-subtitle {
    max-width: none;
  }

  .hero-signals,
  .hero-profile-facts {
    grid-template-columns: 1fr;
  }

  .hero-profile-top {
    flex-direction: column;
  }

  .hero-photo-frame {
    width: 100%;
    max-width: 220px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-primary-btn,
  .hero-secondary-btn {
    width: 100%;
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
  .hero-status-dot,
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

@keyframes hero-status-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(19, 111, 99, 0.12);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 10px rgba(19, 111, 99, 0.08);
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

