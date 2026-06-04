// Styles
import "vuetify/styles";

// Composables
import { h } from "vue";
import { createVuetify } from "vuetify";
import { iconMap } from "./icons";
import { aliases as mdiAliases, mdi } from "vuetify/iconsets/mdi-svg";
import {
  VFileUpload,
  VFileUploadDropzone,
  VFileUploadItem,
  VFileUploadList,
} from 'vuetify/labs/VFileUpload'

const resolveMdiSvgIcon = (icon) => {
  if (typeof icon !== "string") {
    return icon;
  }

  if (icon.startsWith("svg:")) {
    return icon.slice(4);
  }

  return iconMap[icon] ?? iconMap["mdi-help-circle-outline"] ?? "";
};

const mdiSvgCompat = {
  component: (props) => {
    const { icon, ...rest } = props;

    return h(mdi.component, {
      ...rest,
      icon: resolveMdiSvgIcon(icon),
    });
  },
};

export default createVuetify({
  icons: {
    defaultSet: "mdiSvgCompat",
    aliases: mdiAliases,
    sets: {
      mdiSvgCompat,
    },
  },
  components: {
    VFileUpload,
    VFileUploadDropzone,
    VFileUploadItem,
    VFileUploadList,
  },
  theme: {
    defaultTheme: "portfolioDark",
    themes: {
      portfolioLight: {
        dark: true,
        colors: {
          background: "#060e0c",
          surface: "#0d201b",
          "surface-bright": "#152d27",
          "surface-light": "#1c3c34",
          "surface-variant": "#1c3c34",
          primary: "#0f8f7c",
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
      portfolioDark: {
        dark: true,
        colors: {
          background: "#0d1117",
          surface: "#161b22",
          "surface-bright": "#21262d",
          "surface-light": "#30363d",
          "surface-variant": "#30363d",
          primary: "#0f8f7c",
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
