<template>
  <v-container fluid class="about-page pa-0">
    <section class="about-hero">
      <v-container class="py-12 py-md-16">
        <v-row align="center" class="ga-0">
          <v-col cols="12" md="7" class="pr-md-8">
            <p class="hero-kicker mb-3">About Mindlytic</p>
            <h1 class="hero-title mb-4">
              Crafting developer-first products with premium UI and clean architecture.
            </h1>
            <p class="hero-copy mb-0">
              I build fast, maintainable web experiences where design quality and engineering quality move together.
              From idea to launch, every detail is built to feel polished and perform reliably.
            </p>

            <div class="d-flex flex-wrap ga-3 mt-7">
              <v-btn color="primary" rounded="xl" size="large" class="text-none px-6" @click="scrollToSubscribe">
                Let's Collaborate
              </v-btn>
              <v-btn
                variant="outlined"
                rounded="xl"
                size="large"
                class="text-none px-6"
                color="primary"
                to="/projects"
              >
                View Projects
              </v-btn>
            </div>

            <div class="metrics-grid mt-8">
              <article v-for="item in stats" :key="item.label" class="metric-card">
                <p class="metric-value mb-1">{{ item.value }}</p>
                <p class="metric-label mb-0">{{ item.label }}</p>
              </article>
            </div>
          </v-col>

          <v-col cols="12" md="5" class="mt-8 mt-md-0">
            <v-card rounded="xl" elevation="0" class="hero-profile-card pa-5 pa-md-6">
              <div class="d-flex align-center ga-3 mb-4">
                <v-avatar size="54" class="profile-avatar">
                  <v-img :src="myPhoto" cover alt="Laksh Solanki"></v-img>
                </v-avatar>
                <div>
                  <p class="text-subtitle-1 font-weight-bold mb-1">Laksh Solanki</p>
                  <p class="text-caption profile-role mb-0">Founder, Mindlytic</p>
                </div>
              </div>

              <v-img :src="aboutPhoto" height="210" cover class="rounded-lg mb-4"></v-img>

              <ul class="hero-points">
                <li>Vue and Vuetify focused product engineering</li>
                <li>API integration and clean state architecture</li>
                <li>Performance and responsive quality on every screen</li>
              </ul>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section>
      <v-container class="py-10 py-md-14">
        <div class="section-shell story-panel pa-5 pa-md-8">
          <v-row align="center">
            <v-col cols="12" md="5" class="mb-6 mb-md-0">
              <v-img :src="aboutPhoto" height="340" cover class="rounded-xl story-image"></v-img>
            </v-col>
            <v-col cols="12" md="7" class="pl-md-8">
              <p class="section-label mb-2">Mission</p>
              <h2 class="text-h4 font-weight-bold mb-3">Build products that users trust and teams can scale</h2>
              <p class="muted-copy mb-5">
                Mindlytic focuses on practical engineering decisions that support long-term product growth. The goal is
                simple: make interfaces intuitive, keep codebases maintainable, and deliver features with consistency.
              </p>

              <v-list bg-color="transparent" class="pa-0">
                <v-list-item
                  v-for="point in missionPoints"
                  :key="point"
                  class="px-0"
                  density="compact"
                >
                  <template #prepend>
                    <v-icon icon="mdi-check-circle" color="primary" class="mr-2"></v-icon>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ point }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </section>

    <section>
      <v-container class="pb-10 pb-md-14">
        <div class="section-shell pa-5 pa-md-8">
          <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between mb-7 ga-3">
            <div>
              <p class="section-label mb-2">Core Strengths</p>
              <h2 class="text-h4 font-weight-bold mb-0">Why teams work with Mindlytic</h2>
            </div>
          </div>

          <v-row>
            <v-col v-for="card in strengths" :key="card.title" cols="12" sm="6" md="4">
              <v-card class="strength-card pa-5 h-100" rounded="xl" elevation="0">
                <v-avatar size="46" color="teal-lighten-5" class="mb-4">
                  <v-icon :icon="card.icon" color="teal-darken-2"></v-icon>
                </v-avatar>
                <h3 class="text-h6 font-weight-bold mb-2">{{ card.title }}</h3>
                <p class="mb-0 muted-copy">{{ card.description }}</p>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </section>

    <section>
      <v-container class="pb-10 pb-md-14">
        <div class="section-shell pa-5 pa-md-8 process-wrap">
          <p class="section-label mb-2">Workflow</p>
          <h2 class="text-h4 font-weight-bold mb-6">How projects are delivered</h2>

          <div class="process-grid">
            <article v-for="(step, index) in processSteps" :key="step.title" class="process-card">
              <span class="process-index">0{{ index + 1 }}</span>
              <h3 class="text-h6 font-weight-bold mb-2">{{ step.title }}</h3>
              <p class="muted-copy mb-0">{{ step.description }}</p>
            </article>
          </div>
        </div>
      </v-container>
    </section>

    <section class="about-cta pb-12 pb-md-16">
      <v-container>
        <div class="cta-strip">
          <div>
            <p class="text-overline mb-1 text-teal-lighten-3">Ready to Build?</p>
            <h2 class="text-h5 text-md-h4 font-weight-bold mb-1">Start with a quick introduction</h2>
            <p class="mb-0 text-grey-lighten-2">
              Click the button and fill the subscribe form below. I will reach out with next steps.
            </p>
          </div>
          <v-btn
            color="secondary"
            variant="flat"
            rounded="xl"
            size="large"
            class="text-none px-6"
            @click="scrollToSubscribe"
          >
            Go to Subscribe Form
          </v-btn>
        </div>
      </v-container>
    </section>
  </v-container>
</template>

<script setup>
import aboutPhoto from "@/assets/Picture/about_pho_1.jpg";
import myPhoto from "@/assets/Picture/my-pic.jpg";

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

.profile-avatar {
  border: 2px solid #ffffff;
  box-shadow: 0 12px 24px rgba(15, 48, 43, 0.18);
}

.profile-role {
  color: #58706a;
}

.hero-points {
  margin: 0;
  padding-left: 16px;
  color: #38514d;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.92rem;
}

.story-panel {
  overflow: hidden;
}

.story-image {
  border: 1px solid rgba(19, 111, 99, 0.16);
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

@media (max-width: 960px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .process-grid {
    grid-template-columns: 1fr;
  }
}
</style>
