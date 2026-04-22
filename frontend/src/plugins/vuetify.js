// Styles
import "vuetify/styles";

// Composables
import { h } from "vue";
import { createVuetify } from "vuetify";
import * as mdiIcons from "@mdi/js";
import { aliases as mdiAliases, mdi } from "vuetify/iconsets/mdi-svg";

const toMdiJsExportName = (iconName) => {
  if (typeof iconName !== "string" || !iconName.startsWith("mdi-")) {
    return null;
  }

  const token = iconName
    .slice(4)
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");

  return `mdi${token}`;
};

const resolveMdiSvgIcon = (icon) => {
  if (typeof icon !== "string") {
    return icon;
  }

  if (icon.startsWith("svg:")) {
    return icon.slice(4);
  }

  const exportName = toMdiJsExportName(icon);
  if (!exportName) {
    return icon;
  }

  return mdiIcons[exportName] ?? mdiIcons.mdiHelpCircleOutline;
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
