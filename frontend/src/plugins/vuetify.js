// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";

export default createVuetify({
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: "portfolioLight",
    themes: {
      portfolioLight: {
        dark: false,
        colors: {
          background: "#f5f8fb",
          surface: "#ffffff",
          "surface-bright": "#fcfeff",
          "surface-light": "#eef5f2",
          "surface-variant": "#e4eee9",
          primary: "#0f8f7c",
          "on-primary": "#f7fffd",
          secondary: "#d18a1f",
          "on-secondary": "#231603",
          error: "#d95364",
          "on-error": "#ffffff",
          info: "#3b82f6",
          success: "#16a34a",
          warning: "#d97706",
          "on-background": "#10201d",
          "on-surface": "#13211f",
        },
      },
      portfolioDark: {
        dark: true,
        colors: {
          background: "#0d1117",
          surface: "#161b22",
          "surface-bright": "#21262d",
          "surface-light": "#30363d",
          "surface-variant": "#30363d",
          primary: "#10a37f",
          "on-primary": "#ffffff",
          secondary: "#d18a1f",
          "on-secondary": "#ffffff",
          error: "#f85149",
          "on-error": "#ffffff",
          info: "#58a6ff",
          success: "#3fb950",
          warning: "#d29922",
          "on-background": "#c9d1d9",
          "on-surface": "#f0f6fc",
        },
      },
    },
  },
});
