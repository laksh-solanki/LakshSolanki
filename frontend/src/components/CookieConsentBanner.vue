<script setup>
import { computed, onMounted, ref } from "vue";

const STORAGE_KEY = "mindlytic_cookie_consent_v1";
const COOKIE_NAME = "mindlytic_cookie_consent";
const CONSENT_ACCEPTED = "accepted";
const CONSENT_REJECTED = "rejected";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const consentStatus = ref("");
const isInitialized = ref(false);
const isVisible = computed(() => isInitialized.value && !consentStatus.value);

const normalizeConsent = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === CONSENT_ACCEPTED || normalized === CONSENT_REJECTED) {
    return normalized;
  }
  return "";
};

const readConsentCookie = () => {
  if (typeof document === "undefined") return "";
  const escapedName = COOKIE_NAME.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

const persistConsent = (status) => {
  if (!status) return;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, status);
  }
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(status)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
  }
};

const emitConsentChange = (status) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("cookie-consent-changed", {
      detail: { status },
    }),
  );
};

const applyConsent = (status) => {
  const normalized = normalizeConsent(status);
  if (!normalized) return;
  consentStatus.value = normalized;
  persistConsent(normalized);
  emitConsentChange(normalized);
};

const acceptCookies = () => {
  applyConsent(CONSENT_ACCEPTED);
};

const rejectCookies = () => {
  applyConsent(CONSENT_REJECTED);
};

onMounted(() => {
  let savedStatus = "";
  try {
    savedStatus = normalizeConsent(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    savedStatus = "";
  }

  if (!savedStatus) {
    savedStatus = normalizeConsent(readConsentCookie());
  }

  if (savedStatus) {
    consentStatus.value = savedStatus;
    persistConsent(savedStatus);
    emitConsentChange(savedStatus);
  }

  isInitialized.value = true;
});
</script>

<template>
  <teleport to="body">
    <transition name="cookie-slide">
      <section
        v-if="isVisible"
        class="cookie-banner-minimal"
        role="dialog"
        aria-live="polite"
      >
        <div class="cookie-info">
          <v-icon color="primary" size="18" class="mr-2">mdi-cookie-outline</v-icon>
          <span class="cookie-text">We use cookies to improve your experience.</span>
        </div>
        <div class="cookie-actions">
          <v-btn
            variant="text"
            color="muted"
            size="small"
            class="text-none px-2 mini-btn"
            @click="rejectCookies"
          >
            Reject
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            size="small"
            rounded="pill"
            class="text-none px-4 mini-btn"
            @click="acceptCookies"
          >
            Accept
          </v-btn>
        </div>
      </section>
    </transition>
  </teleport>
</template>

<style scoped>
.cookie-banner-minimal {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10050;
  
  display: flex;
  align-items: center;
  gap: 16px;
  
  padding: 6px 8px 6px 18px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(15, 143, 124, 0.12);
  border-radius: 100px;
  box-shadow: 0 10px 30px -5px rgba(18, 38, 33, 0.12);
  
  width: auto;
  max-width: calc(100vw - 32px);
  pointer-events: auto;
}

.cookie-info {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
}

.cookie-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--portfolio-ink);
  letter-spacing: -0.01em;
}

.cookie-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-btn {
  font-weight: 700 !important;
  letter-spacing: 0.01em;
}

/* Slide Transition */
.cookie-slide-enter-active,
.cookie-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.cookie-slide-enter-from,
.cookie-slide-leave-to {
  transform: translateX(-50%) translateY(40px);
  opacity: 0;
}

/* Responsiveness */
@media (max-width: 640px) {
  .cookie-banner-minimal {
    bottom: 20px;
    padding: 10px 12px 10px 16px;
    border-radius: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: calc(100vw - 32px);
  }

  .cookie-info {
    white-space: normal;
  }

  .cookie-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .cookie-text {
    font-size: 0.825rem;
  }
}
</style>
