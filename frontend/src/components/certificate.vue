<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  variant: {
    type: String,
    default: "premium",
  }
});

const localName = ref(props.form?.fname?.trim() || "Learner Name");
const localCourseName = ref(props.form?.course?.name || "Professional Program");

watch(() => props.form, (newVal) => {
  localName.value = newVal?.fname?.trim() || "Learner Name";
  localCourseName.value = newVal?.course?.name || "Professional Program";
}, { deep: true });

const updateName = (e) => {
  const newName = e.target.innerText.trim() || 'Learner Name';
  localName.value = newName;
  if (props.form) {
    props.form.fname = newName;
  }
};

const updateCourse = (e) => {
  const newCourseName = e.target.innerText.trim() || 'Professional Program';
  localCourseName.value = newCourseName;
  if (props.form) {
    if (props.form.course) {
      props.form.course.name = newCourseName;
    } else {
      props.form.course = { name: newCourseName };
    }
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
  return Number.isFinite(hours) && hours > 0 ? `${hours} Learning Hours` : "Self-paced";
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
  <div class="certificate-shell" :class="[`is-${variant}`]">
    
    <!-- PREMIUM CLASSIC TEMPLATE -->
    <div v-if="variant === 'premium'" class="certificate-canvas canvas-premium">
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

    <!-- MODERN GEOMETRIC TEMPLATE -->
    <div v-else-if="variant === 'modern'" class="canvas-modern">
      <div class="modern-sidebar">
        <div class="modern-brand">
          <div class="modern-logo-shape"></div>
          <h2>Mindlytic</h2>
          <p>Verified Credential</p>
        </div>

        <div class="modern-details">
          <div class="modern-detail-item">
            <span class="modern-detail-label">Issue Date</span>
            <span class="modern-detail-value">{{ issueDate }}</span>
          </div>
          <div class="modern-detail-item">
            <span class="modern-detail-label">Credential ID</span>
            <span class="modern-detail-value">{{ certificateCode }}</span>
          </div>
          <div class="modern-detail-item">
            <span class="modern-detail-label">Track Level</span>
            <span class="modern-detail-value">{{ courseLevel }}</span>
          </div>
          <div class="modern-detail-item">
            <span class="modern-detail-label">Study Load</span>
            <span class="modern-detail-value">{{ courseDuration }}</span>
          </div>
        </div>

        <div class="modern-sidebar-seal">
           M — {{ issueYear }}
        </div>
      </div>
      
      <div class="modern-main">
        <div class="modern-header">
           <span class="modern-badge">Professional Certification</span>
        </div>
        
        <h1 class="modern-title">Certificate of Completion</h1>
        <p class="modern-intro">This officially certifies that</p>
        
        <p 
          class="modern-recipient-name shaking-edit" 
          contenteditable="true" 
          @blur="updateName"
          v-text="learnerName"
        ></p>
        
        <p class="modern-body">
          has successfully fulfilled the requirements and completed the
          <strong 
            class="shaking-edit text-highlight" 
            contenteditable="true" 
            @blur="updateCourse"
            v-text="courseName"
          ></strong>
          program, demonstrating outstanding capability and mastery in {{ courseCategory }}.
        </p>

        <div class="modern-footer">
          <div class="signature-panel modern-signature">
            <p class="signature-mark">Mindlytic Board</p>
            <div class="signature-line modern-line"></div>
            <p class="signature-caption">Issuing Authority</p>
          </div>
          <div class="signature-panel modern-signature">
            <p class="signature-mark">Course Instructor</p>
            <div class="signature-line modern-line"></div>
            <p class="signature-caption">Program Director</p>
          </div>
        </div>
      </div>
    </div>

    <!-- MINIMAL CLEAN TEMPLATE -->
    <div v-else class="canvas-minimal">
       <div class="minimal-wrapper">
         <div class="minimal-top">
           <p class="minimal-brand">Mindlytic Education</p>
           <p class="minimal-serial">No. {{ certificateCode }}</p>
         </div>

         <div class="minimal-center">
           <h1 class="minimal-title">Certificate of Achievement</h1>
           <p class="minimal-subtitle">Proudly presented to</p>

           <p 
            class="minimal-name shaking-edit" 
            contenteditable="true" 
            @blur="updateName"
            v-text="learnerName"
           ></p>

           <div class="minimal-divider"></div>

           <p class="minimal-text">
             In recognition of successful completion and outstanding performance in the
           </p>

           <p 
            class="minimal-course shaking-edit" 
            contenteditable="true" 
            @blur="updateCourse"
            v-text="courseName"
           ></p>

           <p class="minimal-details-text">
             A {{ courseDuration }} program at the {{ courseLevel }} level in {{ courseCategory }}.
           </p>
         </div>

         <div class="minimal-bottom">
           <div class="minimal-sig">
             <span class="minimal-date-val">{{ issueDate }}</span>
             <span class="minimal-sig-label">Date of Issue</span>
           </div>
           
           <div class="minimal-seal-wrap">
             <div class="minimal-seal-inner"></div>
           </div>

           <div class="minimal-sig">
             <span class="minimal-sig-mark">Mindlytic</span>
             <span class="minimal-sig-label">Authorized Signature</span>
           </div>
         </div>
       </div>
    </div>

  </div>
</template>

<style scoped>
/* Base Styles */
.certificate-shell {
  width: 100%;
  height: 100%;
  padding: 8px;
  background: radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.7), transparent 25%),
              linear-gradient(135deg, #dbcaa8 0%, #f1e5d0 46%, #d8c19a 100%);
  transition: all 0.5s ease;
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
   PREMIUM CLASSIC TEMPLATE
   ======================================================== */
.canvas-premium {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 30px 32px 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #10201d;
  background: radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.78), transparent 28%),
              linear-gradient(155deg, #fffdfa 0%, #f5ecdd 58%, #efe2cc 100%);
  box-shadow: inset 0 0 0 1px rgba(125, 104, 68, 0.18),
              inset 0 0 0 10px rgba(255, 255, 255, 0.22),
              0 20px 40px rgba(53, 40, 20, 0.12);
}

.canvas-premium::before,
.canvas-premium::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.canvas-premium::before {
  inset: 10px;
  border: 1.5px solid rgba(132, 104, 49, 0.5);
}

.canvas-premium::after {
  inset: 20px;
  border: 1px solid rgba(19, 111, 99, 0.18);
}

.corner-ornament {
  position: absolute;
  width: 84px;
  height: 84px;
  border: 1.5px solid rgba(159, 123, 62, 0.45);
  border-radius: 50%;
  opacity: 0.55;
}

.corner-ornament::before,
.corner-ornament::after {
  content: "";
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(159, 123, 62, 0.38);
  border-radius: 50%;
}

.corner-ornament::after {
  inset: 30px;
}

.top-left { top: -28px; left: -28px; }
.top-right { top: -28px; right: -28px; }
.bottom-left { bottom: -28px; left: -28px; }
.bottom-right { right: -28px; bottom: -28px; }

.certificate-header,
.certificate-main,
.certificate-footer,
.certificate-rail,
.header-divider {
  position: relative;
  z-index: 1;
}

.certificate-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.header-meta-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 6px 14px;
  border-radius: 999px;
  color: #6c5318;
  background: rgba(242, 180, 80, 0.14);
  border: 1px solid rgba(160, 121, 47, 0.24);
  font-family: "Segoe UI", "Trebuchet MS", sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.header-meta-pill.align-right { justify-self: end; }
.header-branding { text-align: center; }

.header-brand-name,
.certificate-title,
.recipient-name,
.signature-mark {
  font-family: "Palatino Linotype", "Book Antiqua", Georgia, serif;
}

.header-brand-name {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #113730;
}

.header-brand-subtitle,
.section-kicker,
.certificate-intro,
.completion-copy,
.credential-label,
.signature-caption,
.certificate-rail {
  font-family: "Segoe UI", "Trebuchet MS", sans-serif;
}

.header-brand-subtitle {
  margin: 4px 0 0;
  color: #6e7a76;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.header-divider {
  margin: 12px auto 0;
  width: min(100%, 640px);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 14px;
}

.header-divider::before,
.header-divider::after {
  content: "";
  border-top: 1px solid rgba(17, 55, 48, 0.18);
}

.divider-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(154, 116, 36, 0.72);
  box-shadow: 0 0 0 6px rgba(154, 116, 36, 0.12);
}

.certificate-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.section-kicker {
  margin: 0 0 10px;
  color: #956f22;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.certificate-title {
  margin: 0;
  font-size: 3.05rem;
  line-height: 1.03;
  color: #0f2c28;
  letter-spacing: 0.01em;
}

.certificate-intro {
  margin: 14px 0 18px;
  color: #5d6d69;
  font-size: 1.05rem;
}

.recipient-panel {
  width: min(100%, 620px);
  padding: 16px 24px;
  margin-bottom: 18px;
  border-radius: 22px;
  border: 1px solid rgba(158, 122, 53, 0.24);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(250, 242, 226, 0.86));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45),
              0 10px 24px rgba(86, 67, 34, 0.06);
}

.recipient-name {
  margin: 0;
  color: #0f2925;
  font-size: 2.75rem;
  line-height: 1.12;
  letter-spacing: 0.02em;
  overflow-wrap: anywhere;
}

.completion-copy {
  width: min(100%, 610px);
  margin: 0 0 28px;
  color: #495955;
  font-size: 1.08rem;
  line-height: 1.7;
}

.credential-grid {
  width: min(100%, 640px);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.credential-card {
  padding: 14px 12px;
  border-radius: 18px;
  border: 1px solid rgba(19, 111, 99, 0.14);
  background: rgba(255, 255, 255, 0.62);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.credential-label {
  display: block;
  margin-bottom: 8px;
  color: #6e7d79;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.credential-card strong {
  display: block;
  color: #132e2a;
  font-size: 1.08rem;
  line-height: 1.4;
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
  margin: 0 0 8px;
  color: #16322d;
  font-size: 1.18rem;
  font-style: italic;
}

.signature-line {
  width: min(100%, 170px);
  border-top: 1.5px solid rgba(21, 53, 48, 0.4);
}

.signature-caption {
  margin: 8px 0 0;
  color: #5e6d69;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.seal-column {
  display: flex;
  justify-content: center;
}

.foil-seal {
  width: 108px;
  height: 108px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #694e10;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0) 28%),
              radial-gradient(circle, #fdf0bd 0%, #e8bb5a 52%, #b37a1f 100%);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.35),
              inset 0 0 0 10px rgba(153, 102, 25, 0.12),
              0 14px 26px rgba(120, 87, 22, 0.18);
}

.seal-year,
.seal-title,
.seal-brand {
  font-weight: 800;
  text-transform: uppercase;
}

.seal-year { font-size: 0.76rem; letter-spacing: 0.2em; }
.seal-title { font-size: 1.12rem; letter-spacing: 0.08em; }
.seal-brand { font-size: 0.68rem; letter-spacing: 0.18em; }

.certificate-rail {
  margin-top: 18px;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #586965;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-top: 1px solid rgba(21, 53, 48, 0.12);
}

/* ========================================================
   MODERN GEOMETRIC TEMPLATE
   ======================================================== */
.certificate-shell.is-modern {
  background: linear-gradient(135deg, #232732 0%, #111318 100%);
}

.canvas-modern {
  width: 100%;
  height: 100%;
  display: flex;
  background: #1c1e26;
  color: #d1d8e0;
  box-shadow: inset 0 0 0 1px rgba(90, 105, 130, 0.2), 0 20px 40px rgba(0, 0, 0, 0.5);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.modern-sidebar {
  width: 260px;
  background: #111318;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2d3748;
}

.modern-brand h2 {
  color: #f8fafc;
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.modern-brand p {
  color: #4fd1c5;
  font-size: 0.8rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 4px;
}

.modern-logo-shape {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4fd1c5 0%, #319795 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  transform: rotate(45deg);
}

.modern-details {
  margin-top: auto;
  margin-bottom: 40px;
}

.modern-detail-item {
  margin-bottom: 20px;
}

.modern-detail-label {
  display: block;
  font-size: 0.75rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.modern-detail-value {
  display: block;
  font-size: 0.9rem;
  color: #e2e8f0;
  font-weight: 600;
}

.modern-sidebar-seal {
  font-size: 1.2rem;
  font-weight: 800;
  color: #4a5568;
  letter-spacing: 4px;
}

.modern-main {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.modern-header {
  margin-bottom: 40px;
}

.modern-badge {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(79, 209, 197, 0.1);
  color: #4fd1c5;
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.modern-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.1;
  margin-bottom: 10px;
}

.modern-intro {
  font-size: 1.2rem;
  color: #94a3b8;
  margin-bottom: 40px;
}

.modern-recipient-name {
  font-size: 3rem;
  color: #fff;
  font-weight: 700;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 2px solid #2d3748;
  display: inline-block;
}
.modern-recipient-name.shaking-edit:hover { background: rgba(255, 255, 255, 0.1); }

.modern-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #cbd5e1;
  max-width: 500px;
  margin-bottom: 50px;
}

.text-highlight {
  color: #4fd1c5;
  font-weight: 600;
}
.text-highlight.shaking-edit:hover { background: rgba(255, 255, 255, 0.1); }

.modern-footer {
  display: flex;
  gap: 60px;
  margin-top: auto;
}

.modern-signature .signature-mark {
  color: #f8fafc;
  font-family: 'Segoe UI', sans-serif;
  font-style: normal;
  font-weight: 600;
}

.modern-line {
  border-top-color: #4a5568;
}

/* ========================================================
   MINIMAL CLEAN TEMPLATE
   ======================================================== */
.certificate-shell.is-minimal {
  background: #f1f5f9;
}

.canvas-minimal {
  width: 100%;
  height: 100%;
  background: #ffffff;
  color: #334155;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.minimal-wrapper {
  width: 100%;
  height: 100%;
  border: 1px solid #cbd5e1;
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.minimal-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.8rem;
  color: #64748b;
}

.minimal-brand { font-weight: 700; color: #0f172a; }

.minimal-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.minimal-title {
  font-family: Georgia, serif;
  font-size: 2.8rem;
  color: #0f172a;
  font-weight: 400;
  margin-bottom: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.minimal-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 40px;
  letter-spacing: 1px;
}

.minimal-name {
  font-family: Georgia, serif;
  font-size: 4rem;
  color: #2563eb;
  font-weight: 400;
  margin-bottom: 20px;
}

.minimal-divider {
  width: 60px;
  height: 2px;
  background: #2563eb;
  margin: 0 auto 30px;
}

.minimal-text {
  font-size: 1.1rem;
  color: #475569;
  max-width: 500px;
  margin-bottom: 10px;
}

.minimal-course {
  font-size: 1.8rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 15px;
}

.minimal-details-text {
  font-size: 0.95rem;
  color: #64748b;
}

.minimal-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 30px;
}

.minimal-sig {
  text-align: center;
  width: 200px;
}

.minimal-date-val, .minimal-sig-mark {
  display: block;
  font-size: 1.2rem;
  color: #0f172a;
  margin-bottom: 8px;
  font-family: Georgia, serif;
}

.minimal-sig-mark { font-style: italic; }

.minimal-sig-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-top: 1px solid #cbd5e1;
  padding-top: 8px;
}

.minimal-seal-wrap {
  width: 80px;
  height: 80px;
  border: 2px dashed #94a3b8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimal-seal-inner {
  width: 64px;
  height: 64px;
  background: #f1f5f9;
  border-radius: 50%;
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
  .certificate-shell {
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
