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
    defaultTheme: "portfolioDark",
    themes: {
      portfolioDark: {
        dark: true,
        colors: {
          background: "#061110",
          surface: "#0d1d1a",
          "surface-bright": "#17302b",
          "surface-light": "#122623",
          primary: "#4ccfb7",
          secondary: "#f2b450",
          error: "#f87171",
          info: "#60a5fa",
          success: "#34d399",
          warning: "#f59e0b",
        },
      },
    },
  },
});
