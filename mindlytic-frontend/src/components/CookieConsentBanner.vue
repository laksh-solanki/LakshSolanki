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
        class="cookie-banner"
        role="dialog"
        aria-live="polite"
        aria-label="Cookie preferences"
      >
        <div class="cookie-copy">
          <p class="cookie-title mb-1">Cookie Preferences</p>
          <p class="cookie-text mb-0">
            We use cookies for essential site functionality and optional experience improvements.
            Choose Accept or Reject.
          </p>
        </div>
        <div class="cookie-actions">
          <v-btn
            variant="outlined"
            color="primary"
            rounded="lg"
            class="text-none consent-btn"
            @click="rejectCookies"
          >
            Reject
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            rounded="lg"
            class="text-none consent-btn"
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
.cookie-banner {
  position: fixed;
  left: 50%;
  bottom: max(12px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: min(960px, calc(100vw - 24px));
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(76, 207, 183, 0.24);
  background:
    radial-gradient(circle at 8% 0%, rgba(76, 207, 183, 0.18), transparent 42%),
    linear-gradient(155deg, rgba(8, 20, 18, 0.96), rgba(5, 14, 13, 0.96));
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.36);
  pointer-events: auto;
}

.cookie-copy {
  min-width: 0;
}

.cookie-title {
  font-weight: 700;
  color: var(--portfolio-ink);
}

.cookie-text {
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--portfolio-muted);
}

.cookie-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.consent-btn {
  min-width: 94px;
  font-weight: 700;
}

.cookie-slide-enter-active,
.cookie-slide-leave-active {
  transition:
    transform 0.24s ease,
    opacity 0.24s ease;
}

.cookie-slide-enter-from,
.cookie-slide-leave-to {
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
}

@media (max-width: 760px) {
  .cookie-banner {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px;
    bottom: max(8px, env(safe-area-inset-bottom));
  }

  .cookie-actions {
    width: 100%;
    justify-content: stretch;
  }

  .consent-btn {
    flex: 1 1 0;
    min-width: 0;
  }
}
</style>
