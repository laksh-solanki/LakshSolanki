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
    },
  },
});
