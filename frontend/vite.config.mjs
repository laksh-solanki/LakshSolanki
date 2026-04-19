// Plugins
import Components from "unplugin-vue-components/vite";
import Vue from "@vitejs/plugin-vue";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import Fonts from "unplugin-fonts/vite";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const isDev = process.env.NODE_ENV !== "production";

const stripFontPreloads = () => ({
  name: "strip-font-preloads",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler(html) {
      return html.replace(/\s*<link rel="preload" as="font"[^>]*>\s*/g, "");
    },
  },
});

export default defineConfig(async () => {
  // Only load devtools in development — prevents it from bloating the prod bundle
  const devToolsPlugin = isDev
    ? [(await import("vite-plugin-vue-devtools")).default()]
    : [];

  return {
    base: process.env.VITE_BASE_URL || "/",

    plugins: [
      stripFontPreloads(),
      Vue({
        template: { transformAssetUrls },
      }),
      Vuetify({ autoImport: true }),
      ...devToolsPlugin,
      Components(),
      Fonts({
        fontsource: {
          families: [
            { name: "Roboto", weights: [400, 700] },
            { name: "Manrope", weights: [400, 700] },
            { name: "Space Grotesk", weights: [400, 700] },
            { name: "JetBrains Mono", weights: [400, 600] },
          ],
        },
      }),
    ],

    optimizeDeps: {},

    define: {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "production"
      ),
    },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
    },

    server: {
      port: 3000,
      host: true,
    },

    build: {
      target: "esnext",
      cssCodeSplit: false,

      chunkSizeWarningLimit: 1200,
      minify: "esbuild",

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("vuetify")) return "vuetify";
              if (id.includes("jspdf") || id.includes("pdfjs-dist"))
                return "pdf-tools";
              if (
                id.includes("jszip") ||
                id.includes("file-saver") ||
                id.includes("html2canvas")
              )
                return "file-tools";
              if (
                id.includes("marked") ||
                id.includes("prismjs") ||
                id.includes("dompurify")
              )
                return "ai-rendering";
              if (id.includes("firebase")) return "firebase";
              return "vendor";
            }
          },
        },
      },
    },
  };
});