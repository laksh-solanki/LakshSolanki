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
          background: "#f3f7f2",
          surface: "#ffffff",
          primary: "#136f63",
          secondary: "#f59e0b",
          error: "#dc2626",
          info: "#2563eb",
          success: "#15803d",
          warning: "#d97706",
        },
      },
    },
  },
});
