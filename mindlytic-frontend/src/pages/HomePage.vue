<script setup>
import myPhoto from "@/assets/Picture/my-pic.jpg";

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
  "Tailwind CSS",
  "Web Performance",
];

const services = [
  {
    icon: "mdi-code-tags",
    title: "Frontend Engineering",
    description:
      "Accessible, responsive interfaces with strong component architecture and polished interactions.",
  },
  {
    icon: "mdi-server-network",
    title: "Backend APIs",
    description:
      "Robust APIs, authentication flows, and scalable database design for production-grade reliability.",
  },
  {
    icon: "mdi-rocket-launch-outline",
    title: "Product Delivery",
    description:
      "From idea to release: planning, execution, deployment, and measurable iteration cycles.",
  },
];

const featuredProjects = [
  {
    title: "Certificate Generator",
    description: "Generate branded certificates in-browser and export polished PDFs.",
    image: new URL("../assets/Picture/Project-1.png", import.meta.url).href,
    to: "/projects/certificate-gen",
  },
  {
    title: "Mindlytic AI Assistant",
    description: "Prompt-driven coding assistant with markdown rendering and code snippets.",
    image: new URL("../assets/Picture/Project-5.png", import.meta.url).href,
    to: "/projects/mindly_ai",
  },
  {
    title: "PDF to Image Utility",
    description: "Fast conversion utility for extracting high quality images from PDFs.",
    image: new URL("../assets/Picture/Project-3.jpg", import.meta.url).href,
    to: "/projects/pdf-img",
  },
];
</script>

<template>
  <v-container class="py-8 py-md-14 home-shell">
    <section class="section-shell hero-card pa-6 pa-md-10 mb-10">
      <div class="glow-dot hero-dot"></div>
      <v-row align="center" class="ga-0">
        <v-col cols="12" md="7" class="pr-md-8">
          <v-chip color="secondary" variant="flat" class="font-weight-bold mb-4">
            Full-Stack Developer Portfolio
          </v-chip>
          <h1 class="text-h3 text-md-h2 mb-4 hero-title">
            Building fast, elegant web experiences that people enjoy using.
          </h1>
          <p class="text-body-1 muted-copy mb-6 hero-subtitle">
            I am Laksh Solanki, a developer focused on Vue, Node.js, and modern product engineering.
            I design and ship applications that balance performance, usability, and maintainability.
          </p>

          <div class="d-flex flex-wrap ga-3 mb-6">
            <v-btn color="primary" size="large" rounded="xl" class="text-none px-6" to="/projects">
              Explore Projects
            </v-btn>
            <v-btn variant="outlined" color="primary" size="large" rounded="xl" class="text-none px-6" to="/profile">
              View Full Profile
            </v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="skill in techStack"
              :key="skill"
              color="primary"
              variant="tonal"
              size="small"
            >
              {{ skill }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" md="5" class="mt-8 mt-md-0">
          <div class="hero-profile pa-5">
            <v-avatar size="150" class="mx-auto d-flex profile-ring" :image="myPhoto"></v-avatar>
            <h2 class="text-h5 text-center mt-5 mb-1">Laksh Solanki</h2>
            <p class="text-center muted-copy mb-5">Senior Full-Stack Engineer</p>
            <v-divider class="mb-4"></v-divider>
            <div class="d-flex flex-column ga-2">
              <div class="d-flex justify-space-between">
                <span class="muted-copy">Location</span>
                <strong>Gujarat, India</strong>
              </div>
              <div class="d-flex justify-space-between">
                <span class="muted-copy">Availability</span>
                <strong>Open for freelance</strong>
              </div>
              <div class="d-flex justify-space-between">
                <span class="muted-copy">Focus</span>
                <strong>SaaS + Developer Tools</strong>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </section>

    <section class="mb-10">
      <v-row>
        <v-col v-for="stat in impactStats" :key="stat.label" cols="12" sm="4">
          <v-card class="section-shell pa-6 stat-card h-100" flat>
            <p class="text-h4 font-weight-bold mb-1">{{ stat.value }}</p>
            <p class="muted-copy mb-0">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <section class="mb-10">
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
        <h2 class="text-h4">What I Build</h2>
        <v-btn to="/projects" variant="text" color="primary" class="text-none">See all projects</v-btn>
      </div>
      <v-row>
        <v-col v-for="service in services" :key="service.title" cols="12" md="4">
          <v-card class="section-shell pa-6 h-100 service-card" flat>
            <v-avatar color="primary" variant="tonal" size="48" class="mb-4">
              <v-icon :icon="service.icon"></v-icon>
            </v-avatar>
            <h3 class="text-h6 mb-2">{{ service.title }}</h3>
            <p class="muted-copy mb-0">{{ service.description }}</p>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <section>
      <h2 class="text-h4 mb-4">Featured Work</h2>
      <v-row>
        <v-col v-for="project in featuredProjects" :key="project.title" cols="12" md="4">
          <v-card class="section-shell project-card h-100" :to="project.to" flat>
            <v-img :src="project.image" height="190" cover class="project-media"></v-img>
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
}

.hero-card {
  overflow: hidden;
  animation: rise-in 0.45s ease;
}

.hero-dot {
  top: 26px;
  right: 28px;
}

.hero-title {
  line-height: 1.1;
  max-width: 17ch;
}

.hero-subtitle {
  max-width: 55ch;
}

.hero-profile {
  border-radius: 22px;
  background: linear-gradient(165deg, #ffffff, #eef8f3);
  border: 1px solid rgba(19, 111, 99, 0.2);
}

.profile-ring {
  border: 3px solid #ffffff;
  box-shadow: 0 14px 35px rgba(19, 111, 99, 0.25);
}

.stat-card,
.service-card,
.project-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.stat-card:hover,
.service-card:hover,
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(16, 35, 31, 0.12);
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
</style>

