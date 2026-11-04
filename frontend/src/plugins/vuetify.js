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
} from "vuetify/components";

const resolveMdiSvgIcon = (icon) => {
  if (typeof icon !== "string") {
    return icon;
  }

  if (icon.startsWith("svg:")) {
    return icon.slice(4);
  }

  const normalized = icon.startsWith("mdi-") ? icon : `mdi-${icon}`;
  return iconMap[normalized] ?? iconMap[icon] ?? iconMap["mdi-help-circle-outline"] ?? "";
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
    defaultTheme: "portfolioLight",
    themes: {
      portfolioLight: {
        dark: false,
        colors: {
          background: "#F2DACE",
          surface: "#FFFFFF",
          "surface-bright": "#FAF3F0",
          "surface-light": "#FAF3F0",
          "surface-variant": "#EBD5CA",
          primary: "#7C0E44",
          "on-primary": "#FFFFFF",
          secondary: "#AA5E7A",
          "on-secondary": "#FFFFFF",
          accent: "#D49A9A",
          "on-accent": "#231219",
          error: "#A81D37",
          "on-error": "#FFFFFF",
          info: "#5C2D46",
          success: "#7C0E44",
          warning: "#993B58",
          "on-background": "#231219",
          "on-surface": "#231219",
        },
      },
      portfolioDark: {
        dark: false,
        colors: {
          background: "#F2DACE",
          surface: "#FFFFFF",
          "surface-bright": "#FAF3F0",
          "surface-light": "#FAF3F0",
          "surface-variant": "#EBD5CA",
          primary: "#7C0E44",
          "on-primary": "#FFFFFF",
          secondary: "#AA5E7A",
          "on-secondary": "#FFFFFF",
          accent: "#D49A9A",
          "on-accent": "#231219",
          error: "#A81D37",
          "on-error": "#FFFFFF",
          info: "#5C2D46",
          success: "#7C0E44",
          warning: "#993B58",
          "on-background": "#231219",
          "on-surface": "#231219",
        },
      },
    },
  },
});
