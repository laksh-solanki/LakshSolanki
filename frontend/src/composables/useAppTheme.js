import { computed, watch } from "vue";
import { useTheme } from "vuetify";

export const THEME_KEY = "portfolio_theme";
export const LIGHT_THEME = "portfolioLight";
export const DARK_THEME = "portfolioDark";

export function getInitialTheme() {
  if (typeof window === "undefined") return LIGHT_THEME;
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === LIGHT_THEME || saved === DARK_THEME) {
      return saved;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return DARK_THEME;
    }
  } catch {
    // ignore access issues
  }
  return LIGHT_THEME;
}

export function syncDocumentTheme(themeName) {
  if (typeof document === "undefined") return;
  const isDark = themeName === DARK_THEME;

  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("theme-dark", isDark);
  document.documentElement.classList.toggle("theme-light", !isDark);

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", isDark ? "#0F0C0E" : "#7C0E44");
  }
}

export function useAppTheme() {
  const theme = useTheme();

  const currentTheme = computed(() => theme.global.name.value);
  const isDark = computed(() => theme.global.current.value.dark || currentTheme.value === DARK_THEME);

  function setTheme(name) {
    if (name !== LIGHT_THEME && name !== DARK_THEME) return;
    theme.global.name.value = name;
    try {
      localStorage.setItem(THEME_KEY, name);
    } catch {
      // storage unavailable
    }
    syncDocumentTheme(name);
  }

  function toggleTheme() {
    setTheme(isDark.value ? LIGHT_THEME : DARK_THEME);
  }

  // Watch for external or programmatic changes
  watch(
    () => theme.global.name.value,
    (newTheme) => {
      syncDocumentTheme(newTheme);
    },
    { immediate: true }
  );

  return {
    currentTheme,
    isDark,
    setTheme,
    toggleTheme,
    LIGHT_THEME,
    DARK_THEME,
  };
}
