<script setup>
import { computed, ref, watch } from "vue";
import { getMediaUrl } from "@/utils/mediaUrl";

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  template: {
    type: String,
    default: "achievement",
  },
});

const selectedTemplate = computed(() => {
  return props.form?.template || props.template || "achievement";
});

const achievementBgUrl = getMediaUrl("Picture/achievement_cert_template.png");
const completionBgUrl = getMediaUrl("Picture/learnkonnect_cert_template.png");
const pathwayBgUrl = getMediaUrl("Picture/CoursePathway_BG.jpg");
const partnerLogoUrl = getMediaUrl("Picture/sk.jfif");
const eduTechLogoUrl = getMediaUrl("Picture/LT-EduTech.png");
const profSignatureUrl = getMediaUrl("Picture/profSignature.png");
const febinSignatureUrl = getMediaUrl("Picture/febinsign.png");
const lntLogoUrl = getMediaUrl("Picture/LnT.png");

const localName = ref(props.form?.fname?.trim() || "Juliana Silva");
const localCourseName = ref(props.form?.course?.name || "Full Stack Web Development");
const localCoursesCount = ref(props.form?.coursesCount ?? 7);
const localLearningHours = ref(
  props.form?.learningHours ??
    (props.form?.course?.durationHours ? Number(props.form.course.durationHours) : 33)
);

watch(
  () => props.form,
  (newVal) => {
    localName.value = newVal?.fname?.trim() || "Juliana Silva";
    localCourseName.value = newVal?.course?.name || "Full Stack Web Development";
    if (newVal?.coursesCount != null) {
      localCoursesCount.value = newVal.coursesCount;
    }
    if (newVal?.learningHours != null) {
      localLearningHours.value = newVal.learningHours;
    } else if (newVal?.course?.durationHours) {
      localLearningHours.value = Number(newVal.course.durationHours);
    }
  },
  { deep: true }
);

const updateName = (e) => {
  const newName = e.target.innerText.trim() || "Juliana Silva";
  localName.value = newName;
  if (props.form) {
    props.form.fname = newName;
  }
};

const updateCourse = (e) => {
  const newCourseName = e.target.innerText.trim() || "Full Stack Web Development";
  localCourseName.value = newCourseName;
  if (props.form) {
    if (props.form.course) {
      props.form.course.name = newCourseName;
    } else {
      props.form.course = { name: newCourseName };
    }
  }
};

const updateCoursesCount = (e) => {
  const count = e.target.innerText.trim() || "7";
  localCoursesCount.value = count;
  if (props.form) {
    props.form.coursesCount = count;
  }
};

const updateLearningHours = (e) => {
  const hours = e.target.innerText.trim() || "33";
  localLearningHours.value = hours;
  if (props.form) {
    props.form.learningHours = hours;
  }
};

const issuedAt = new Date();
const dateToken = [
  issuedAt.getFullYear(),
  String(issuedAt.getMonth() + 1).padStart(2, "0"),
  String(issuedAt.getDate()).padStart(2, "0"),
].join("");

const issueDate = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(issuedAt);

const issueYear = String(issuedAt.getFullYear());

const course = computed(() => props.form?.course ?? {});
const learnerName = computed(() => localName.value);
const courseName = computed(() => localCourseName.value);
const courseCategory = computed(() => course.value?.category || "Professional Studies");
const courseLevel = computed(() => course.value?.level || "Premium Track");
const courseDuration = computed(() => {
  const hours = Number(course.value?.durationHours);
  return Number.isFinite(hours) && hours > 0 ? `${hours} Learning Hours` : `${localLearningHours.value} Learning Hours`;
});

const tokenFromText = (value, maxLength) => {
  const compact = (value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, maxLength);

  return compact.padEnd(maxLength, "X");
};

const certificateCode = computed(
  () => `MDL-${dateToken.slice(2)}-${tokenFromText(learnerName.value, 3)}-${tokenFromText(courseName.value, 4)}`,
);
</script>

<template>
  <div class="certificate-shell" :class="[`shell-${selectedTemplate}`]">
    <!-- 1. ACHIEVEMENT TEMPLATE (Landscape PDF style with Script Font) -->
    <div
      v-if="selectedTemplate === 'achievement'"
      class="certificate-canvas canvas-achievement"
    >
      <img :src="achievementBgUrl" class="achievement-bg-img" alt="" aria-hidden="true" />

      <div class="achievement-content-wrap">
        <!-- Recipient Name in Cursive Script Font -->
        <div class="achievement-name-box">
          <p
            class="achievement-name shaking-edit"
            contenteditable="true"
            @blur="updateName"
            v-text="learnerName"
          ></p>
        </div>

        <!-- Course text right after 'Course - ' -->
        <div class="achievement-course-box">
          <span
            class="achievement-course-text shaking-edit"
            contenteditable="true"
            @blur="updateCourse"
            v-text="courseName"
          ></span>
        </div>
      </div>
    </div>

    <!-- 2. COMPLETION TEMPLATE (Landscape PDF - LearnKonnect / L&T EduTech / SPU) -->
    <div
      v-else-if="selectedTemplate === 'completion'"
      class="certificate-canvas canvas-completion"
    >
      <img :src="completionBgUrl" class="completion-bg-img" alt="" aria-hidden="true" />

      <div class="completion-content-wrap">
        <div class="completion-name-box">
          <p
            class="completion-name shaking-edit"
            contenteditable="true"
            @blur="updateName"
            v-text="learnerName"
          ></p>
        </div>

        <div class="completion-details-box">
          <p class="completion-intro-line">For Successfully Completing the</p>
          <p class="completion-desc-line">
            <strong
              class="completion-course-title shaking-edit"
              contenteditable="true"
              @blur="updateCourse"
              v-text="courseName"
            ></strong>
            which covers
            <strong
              class="completion-highlight shaking-edit"
              contenteditable="true"
              @blur="updateCoursesCount"
              v-text="localCoursesCount"
            ></strong>
            courses and
            <strong
              class="completion-highlight shaking-edit"
              contenteditable="true"
              @blur="updateLearningHours"
              v-text="localLearningHours"
            ></strong>
            learning hours
          </p>
        </div>
      </div>
    </div>

    <!-- 3. COURSE PATHWAY TEMPLATE (Portrait L&T EduTech) -->
    <div
      v-else-if="selectedTemplate === 'pathway'"
      class="certificate-canvas canvas-pathway"
    >
      <img :src="pathwayBgUrl" class="pathway-bg-img" alt="" aria-hidden="true" />

      <div class="pathway-content-wrap">
        <div class="logo">
          <div class="partnerLogo commonLogo">
            <div class="figure">
              <img :src="partnerLogoUrl" alt="Partner Logo" />
            </div>
          </div>
          <div class="figure eduTechLogo commonLogo">
            <img :src="eduTechLogoUrl" alt="L&T EduTech" />
          </div>
        </div>

        <p class="certificateHeading">
          Certificate of Course <br />
          Pathway Completion
        </p>

        <div class="nameContent">
          <p
            class="recipient-name shaking-edit"
            contenteditable="true"
            @blur="updateName"
            v-text="learnerName"
          ></p>
        </div>

        <div class="content">
          <p>
            has completed the Course pathway titled
            <br />
            <span
              class="shaking-edit course-highlight"
              contenteditable="true"
              @blur="updateCourse"
              v-text="courseName"
            ></span>
            <br />
            which covers
            <br />
            <em
              class="shaking-edit number-highlight"
              contenteditable="true"
              @blur="updateCoursesCount"
              v-text="localCoursesCount"
            ></em>
            courses and
            <em
              class="shaking-edit number-highlight"
              contenteditable="true"
              @blur="updateLearningHours"
              v-text="localLearningHours"
            ></em>
            learning hours
          </p>
        </div>

        <footer class="pathway-footer">
          <div class="sign">
            <div class="left profLogo">
              <div class="figure">
                <img :src="profSignatureUrl" alt="Prof. (Dr.) Prafulkumar Udani Signature" />
              </div>
              <p class="ceoName">Prof. (Dr.) Prafulkumar Udani</p>
              <p class="ceo">
                Provost
                <span>Sankalchand Patel University</span>
              </p>
            </div>
            <div class="right">
              <div class="figure">
                <img :src="febinSignatureUrl" alt="M.F. Febin Signature" />
              </div>
              <p class="ceoName">M.F.Febin</p>
              <p class="ceo">Head <span>L&T EduTech</span></p>
            </div>
          </div>
          <div class="lnt">
            <div class="borderr">
              <div></div>
            </div>
            <div class="figure">
              <img :src="lntLogoUrl" alt="Larsen & Toubro" />
            </div>
          </div>
        </footer>
      </div>
    </div>

    <!-- 4. CLASSIC PREMIUM TEMPLATE (Mindlytic) -->
    <div v-else class="certificate-canvas canvas-premium">
      <span class="corner-ornament top-left"></span>
      <span class="corner-ornament top-right"></span>
      <span class="corner-ornament bottom-left"></span>
      <span class="corner-ornament bottom-right"></span>

      <header class="certificate-header">
        <div class="header-meta-pill">Issued {{ issueDate }}</div>
        <div class="header-branding">
          <p class="header-brand-name">Mindlytic</p>
          <p class="header-brand-subtitle">Verified Premium Learning Credential</p>
        </div>
        <div class="header-meta-pill align-right">{{ certificateCode }}</div>
      </header>

      <div class="header-divider" aria-hidden="true">
        <span class="divider-dot"></span>
      </div>

      <main class="certificate-main">
        <p class="section-kicker">Certificate of Excellence</p>
        <h1 class="certificate-title">Premium Course Completion</h1>
        <p class="certificate-intro">This document is proudly presented to</p>

        <div class="recipient-panel">
          <p 
            class="recipient-name shaking-edit" 
            contenteditable="true" 
            @blur="updateName"
            v-text="learnerName"
          ></p>
        </div>

        <p class="completion-copy">
          for successfully completing the 
          <strong 
            class="shaking-edit text-decoration-underline" 
            contenteditable="true" 
            @blur="updateCourse"
            v-text="courseName"
          ></strong>
          program and demonstrating applied capability across {{ courseCategory }} at the {{ courseLevel }} level.
        </p>

        <div class="credential-grid">
          <article class="credential-card">
            <span class="credential-label">Program Area</span>
            <strong>{{ courseCategory }}</strong>
          </article>

          <article class="credential-card">
            <span class="credential-label">Track Level</span>
            <strong>{{ courseLevel }}</strong>
          </article>

          <article class="credential-card">
            <span class="credential-label">Study Load</span>
            <strong>{{ courseDuration }}</strong>
          </article>
        </div>
      </main>

      <footer class="certificate-footer">
        <div class="signature-panel">
          <p class="signature-mark">Mindlytic Board</p>
          <div class="signature-line"></div>
          <p class="signature-caption">Issuing Authority</p>
        </div>

        <div class="seal-column" aria-hidden="true">
          <div class="foil-seal">
            <span class="seal-year">{{ issueYear }}</span>
            <span class="seal-title">Premium</span>
            <span class="seal-brand">Mindlytic</span>
          </div>
        </div>

        <div class="signature-panel align-right">
          <p class="signature-mark">Verification Desk</p>
          <div class="signature-line"></div>
          <p class="signature-caption">Authenticity Confirmed</p>
        </div>
      </footer>

      <div class="certificate-rail">
        <span>Issued {{ issueDate }}</span>
        <span>{{ courseDuration }}</span>
        <span>ID {{ certificateCode }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Alex+Brush&family=Great+Vibes&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Open+Sans:wght@400;600;700;800&family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap");

/* Base Shell Styles */
.certificate-shell {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.certificate-shell.shell-premium {
  padding: 8px;
  background: radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.7), transparent 25%),
              linear-gradient(135deg, #dbcaa8 0%, #f1e5d0 46%, #d8c19a 100%);
}

.certificate-shell.shell-pathway,
.certificate-shell.shell-completion,
.certificate-shell.shell-achievement {
  padding: 0;
  background: #ffffff;
}

.shaking-edit {
  display: inline-block;
  outline: none;
  cursor: text;
  transition: background 0.2s ease, transform 0.2s ease;
}
.shaking-edit:hover, .shaking-edit:focus {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1px) rotate(-1deg); }
  75% { transform: translateX(1px) rotate(1deg); }
}

/* ========================================================
   1. ACHIEVEMENT TEMPLATE (Landscape PDF with Script Font)
   ======================================================== */
.canvas-achievement {
  position: relative;
  width: 1123px;
  height: 794px;
  overflow: hidden;
  box-sizing: border-box;
  color: #111a2e;
  font-family: "Lora", "Georgia", serif;
  background: #ffffff;
}

.achievement-bg-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 1123px;
  height: 794px;
  object-fit: fill;
  pointer-events: none;
  z-index: 0;
}

.achievement-content-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 1123px;
  height: 794px;
  z-index: 1;
  pointer-events: none;
}

.achievement-name-box {
  position: absolute;
  top: 366px;
  left: 80px;
  width: 963px;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.achievement-name {
  margin: 0;
  color: #111a2e;
  font-family: "Great Vibes", "Alex Brush", cursive;
  font-size: 64px;
  font-weight: 400;
  line-height: 1.1;
  text-align: center;
  overflow-wrap: anywhere;
  letter-spacing: 0.02em;
}

.achievement-course-box {
  position: absolute;
  top: 506px;
  left: 388px;
  width: 480px;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.achievement-course-text {
  margin: 0;
  color: #1a2238;
  font-family: "Lora", "Georgia", serif;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

/* ========================================================
   2. COMPLETION TEMPLATE (Landscape PDF - LearnKonnect / SPU)
   ======================================================== */
.canvas-completion {
  position: relative;
  width: 1123px;
  height: 794px;
  overflow: hidden;
  box-sizing: border-box;
  color: #111111;
  font-family: "Open Sans", "Segoe UI", sans-serif;
  background: #ffffff;
}

.completion-bg-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 1123px;
  height: 794px;
  object-fit: fill;
  pointer-events: none;
  z-index: 0;
}

.completion-content-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 1123px;
  height: 794px;
  z-index: 1;
  pointer-events: none;
}

.completion-name-box {
  position: absolute;
  top: 334px;
  left: 44px;
  width: 724px;
  height: 110px;
  display: flex;
  align-items: flex-end;
  pointer-events: auto;
}

.completion-name {
  margin: 0;
  color: #111111;
  font-family: "Open Sans", "Segoe UI", sans-serif;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.completion-details-box {
  position: absolute;
  top: 472px;
  left: 44px;
  width: 724px;
  pointer-events: auto;
}

.completion-intro-line {
  margin: 0 0 5px;
  color: #222222;
  font-family: "Open Sans", "Segoe UI", sans-serif;
  font-size: 16.5px;
  font-weight: 500;
  line-height: 1.3;
}

.completion-desc-line {
  margin: 0;
  color: #222222;
  font-family: "Open Sans", "Segoe UI", sans-serif;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.45;
}

.completion-course-title {
  color: #111111;
  font-weight: 800;
}

.completion-highlight {
  color: #111111;
  font-weight: 800;
}

/* ========================================================
   3. COURSE PATHWAY TEMPLATE (L&T EduTech Portrait)
   ======================================================== */
.canvas-pathway {
  position: relative;
  width: 794px;
  height: 1123px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  color: #222222;
  font-family: "Poppins", sans-serif;
  background: #ffffff;
}

.pathway-bg-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 794px;
  height: 1123px;
  object-fit: fill;
  pointer-events: none;
  z-index: 0;
}

.pathway-content-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.canvas-pathway .figure {
  display: block;
  margin: 0;
  unicode-bidi: isolate;
}

.canvas-pathway .logo {
  margin: 155px 0 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.canvas-pathway .partnerLogo {
  padding-right: 30px;
  margin-right: 30px;
  position: relative;
}

.canvas-pathway .partnerLogo::before {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 85px;
  background-color: #707070;
  opacity: 0.5;
}

.canvas-pathway .partnerLogo .figure {
  width: auto;
  height: 85px;
  display: flex;
  align-items: center;
}

.canvas-pathway .commonLogo img {
  height: 85px;
  max-height: 85px;
  max-width: 100%;
  object-fit: contain;
  object-position: center;
}

.canvas-pathway .eduTechLogo {
  width: 175px;
  position: relative;
  height: 85px;
  display: flex;
  align-items: center;
}

.canvas-pathway .certificateHeading {
  font-family: "Open Sans", sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: #222222;
  line-height: 38px;
  text-transform: uppercase !important;
  margin: 50px auto 0;
  letter-spacing: 0 !important;
  text-align: center;
  width: 16cm;
}

.canvas-pathway .nameContent {
  width: 16cm;
  margin: 48px auto 38px;
  border-top: 2px solid #222222;
  border-bottom: 2px solid #222222;
  letter-spacing: 0;
  color: #222222;
  text-align: center;
}

.canvas-pathway .nameContent p {
  font-family: "Poppins", sans-serif;
  font-size: 38px;
  font-weight: 700;
  text-align: center;
  line-height: 46px;
  text-transform: uppercase;
  margin: 16px 0;
  letter-spacing: 1px;
  overflow-wrap: anywhere;
}

.canvas-pathway .content {
  width: 18cm;
  margin: 0 auto;
  color: #222222;
}

.canvas-pathway .content p {
  font-family: "Poppins", sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 36px;
  text-align: center;
  display: inline-block;
  width: 100%;
  margin: 0;
}

.canvas-pathway .content .course-highlight {
  font-weight: 800;
}

.canvas-pathway .content .number-highlight {
  font-style: normal;
  font-weight: 800;
}

.canvas-pathway .pathway-footer {
  margin-top: auto;
  margin-bottom: 45px;
  width: 100%;
  display: block;
}

.canvas-pathway .sign {
  width: 16cm;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.canvas-pathway .sign .left.profLogo {
  width: auto;
}

.canvas-pathway .sign .left.profLogo .figure {
  width: 135px;
  height: 48px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.canvas-pathway .sign .left.profLogo .figure img {
  max-width: 100%;
  max-height: 48px;
  object-fit: contain;
}

.canvas-pathway .sign .left.profLogo .ceoName {
  font-family: "Poppins", sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #222222;
  line-height: normal;
  margin: 0;
  text-align: center;
}

.canvas-pathway .sign .left.profLogo .ceo {
  font-family: "Poppins", sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  color: #222222;
  border-top: 1px solid #222222;
  text-align: center;
  margin: 3px 0 0;
  padding-top: 6px;
}

.canvas-pathway .sign .left.profLogo .ceo span {
  display: block;
  font-weight: 700;
  color: #222222;
}

.canvas-pathway .sign .right .figure {
  width: 135px;
  height: 48px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.canvas-pathway .sign .right .figure img {
  max-width: 100%;
  max-height: 48px;
  object-fit: contain;
}

.canvas-pathway .sign .right .ceoName {
  font-family: "Poppins", sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #222222;
  line-height: normal;
  margin: 0;
  text-align: center;
}

.canvas-pathway .sign .right .ceo {
  font-family: "Poppins", sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  border-top: 1px solid #222222;
  text-align: center;
  color: #222222;
  margin: 3px 0 0;
  padding-top: 6px;
}

.canvas-pathway .sign .right .ceo span {
  display: block;
  font-weight: 700;
}

.canvas-pathway .lnt {
  width: 17cm;
  margin: 36px auto 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.canvas-pathway .lnt .borderr {
  width: calc(100% - 75px);
}

.canvas-pathway .lnt .borderr > div {
  border: 1px solid #222222;
  width: 100%;
  display: block;
}

.canvas-pathway .lnt .figure {
  width: 60px;
  margin: 0 0 0 20px;
  display: flex;
  align-items: center;
}

.canvas-pathway .lnt .figure img {
  width: 100%;
  object-fit: contain;
}

/* ========================================================
   4. PREMIUM CLASSIC TEMPLATE (Mindlytic)
   ======================================================== */
.canvas-premium {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 30px 32px 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #231219;
  background: radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.78), transparent 28%),
              linear-gradient(155deg, #FFFFFF 0%, #FAF3F0 58%, #F5E5DC 100%);
  box-shadow: inset 0 0 0 1px rgba(124, 14, 68, 0.14),
              inset 0 0 0 10px rgba(255, 255, 255, 0.22),
              0 20px 40px rgba(124, 14, 68, 0.06);
}

.canvas-premium::before,
.canvas-premium::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.canvas-premium::before {
  inset: 10px;
  border: 1.5px solid rgba(124, 14, 68, 0.35);
}

.canvas-premium::after {
  inset: 20px;
  border: 1px solid rgba(170, 94, 122, 0.2);
}

.corner-ornament {
  position: absolute;
  width: 84px;
  height: 84px;
  border: 1.5px solid rgba(124, 14, 68, 0.25);
  border-radius: 50%;
  opacity: 0.55;
}

.corner-ornament::before,
.corner-ornament::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}

.corner-ornament::before {
  inset: 7px;
  border: 1px solid rgba(124, 14, 68, 0.18);
}

.corner-ornament::after {
  inset: 14px;
  border: 1px solid rgba(124, 14, 68, 0.18);
}

.top-left {
  top: -42px;
  left: -42px;
}

.top-right {
  top: -42px;
  right: -42px;
}

.bottom-left {
  bottom: -42px;
  left: -42px;
}

.bottom-right {
  bottom: -42px;
  right: -42px;
}

.certificate-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}

.header-meta-pill {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 14px;
  border-radius: 999px;
  color: #7C0E44;
  background: rgba(124, 14, 68, 0.08);
  border: 1px solid rgba(124, 14, 68, 0.2);
  font-family: "Segoe UI", "Trebuchet MS", sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.header-meta-pill.align-right {
  justify-self: end;
}

.header-branding {
  text-align: center;
}

.header-brand-name {
  margin: 0;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 2.15rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #231219;
}

.header-brand-subtitle,
.section-kicker,
.credential-label,
.signature-caption,
.certificate-rail {
  font-family: "Segoe UI", "Trebuchet MS", sans-serif;
}

.header-brand-subtitle {
  margin: 4px 0 0;
  color: #7E636E;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.header-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0 6px;
}

.header-divider::before,
.header-divider::after {
  content: "";
  border-top: 1px solid rgba(124, 14, 68, 0.15);
  flex: 1;
}

.divider-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(124, 14, 68, 0.8);
  box-shadow: 0 0 0 6px rgba(124, 14, 68, 0.12);
  margin: 0 16px;
}

.certificate-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 16px 0;
}

.section-kicker {
  margin: 0 0 8px;
  color: #7C0E44;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.certificate-title {
  margin: 0;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 2.85rem;
  line-height: 1.05;
  color: #7C0E44;
  letter-spacing: 0.01em;
}

.certificate-intro {
  margin: 12px 0 16px;
  color: #4E3842;
  font-size: 1.02rem;
}

.recipient-panel {
  width: min(100%, 620px);
  padding: 14px 24px;
  margin-bottom: 16px;
  border-radius: 22px;
  border: 1px solid rgba(170, 94, 122, 0.24);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(250, 243, 240, 0.9));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45),
              0 10px 24px rgba(124, 14, 68, 0.04);
}

.recipient-panel .recipient-name {
  margin: 0;
  color: #231219;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 2.5rem;
  line-height: 1.15;
  letter-spacing: 0.02em;
  overflow-wrap: anywhere;
}

.completion-copy {
  width: min(100%, 610px);
  margin: 0 0 24px;
  color: #4E3842;
  font-size: 1.05rem;
  line-height: 1.65;
}

.credential-grid {
  width: min(100%, 640px);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.credential-card {
  padding: 12px 10px;
  border-radius: 16px;
  border: 1px solid rgba(170, 94, 122, 0.18);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.credential-label {
  display: block;
  margin-bottom: 6px;
  color: #7E636E;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.credential-card strong {
  display: block;
  color: #231219;
  font-size: 1.02rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.certificate-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 16px;
}

.signature-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.signature-panel.align-right {
  align-items: flex-end;
  text-align: right;
}

.signature-mark {
  margin: 0 0 6px;
  color: #231219;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 1.15rem;
  font-style: italic;
}

.signature-line {
  width: min(100%, 170px);
  border-top: 1.5px solid rgba(124, 14, 68, 0.35);
}

.signature-caption {
  margin: 6px 0 0;
  color: #7E636E;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.seal-column {
  display: flex;
  justify-content: center;
}

.foil-seal {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #7C0E44;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0) 30%),
              radial-gradient(circle, #FAF3F0 0%, #E8CAD2 60%, #C4919E 100%);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.45),
              inset 0 0 0 9px rgba(124, 14, 68, 0.08),
              0 12px 24px rgba(124, 14, 68, 0.12);
}

.seal-year,
.seal-title,
.seal-brand {
  font-family: "Segoe UI", "Trebuchet MS", sans-serif;
  font-weight: 800;
  text-transform: uppercase;
}

.seal-year { font-size: 0.74rem; letter-spacing: 0.2em; }
.seal-title { font-size: 1.08rem; letter-spacing: 0.08em; }
.seal-brand { font-size: 0.65rem; letter-spacing: 0.18em; }

.certificate-rail {
  margin-top: 16px;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #7E636E;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-top: 1px solid rgba(124, 14, 68, 0.12);
}

/* Responsive Overrides */
@media (max-width: 700px) {
  .certificate-header,
  .certificate-footer,
  .certificate-rail,
  .header-divider {
    gap: 12px;
  }

  .certificate-header {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .header-meta-pill.align-right {
    justify-self: center;
  }

  .credential-grid {
    grid-template-columns: 1fr;
  }

  .certificate-footer {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .signature-panel,
  .signature-panel.align-right,
  .certificate-rail {
    align-items: center;
    text-align: center;
  }

  .certificate-rail {
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .certificate-shell.shell-premium {
    padding: 6px;
  }

  .canvas-premium {
    padding: 22px 20px 18px;
  }

  .canvas-premium::before {
    inset: 7px;
  }

  .canvas-premium::after {
    inset: 14px;
  }

  .corner-ornament {
    width: 58px;
    height: 58px;
  }
}
</style>
