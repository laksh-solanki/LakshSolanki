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
import { getInitialTheme } from "@/composables/useAppTheme";

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
    defaultTheme: getInitialTheme(),
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
        dark: true,
        colors: {
          background: "#0F0C0E",
          surface: "#1A1418",
          "surface-bright": "#2D1F28",
          "surface-light": "#241A21",
          "surface-variant": "#30202B",
          primary: "#F06292",
          "on-primary": "#FFFFFF",
          secondary: "#C77D98",
          "on-secondary": "#FFFFFF",
          accent: "#F4A6B8",
          "on-accent": "#160B10",
          error: "#CF6679",
          "on-error": "#000000",
          info: "#B88DA6",
          success: "#66BB6A",
          warning: "#FFA726",
          "on-background": "#F7EDF2",
          "on-surface": "#F7EDF2",
        },
      },
    },
  },
});
