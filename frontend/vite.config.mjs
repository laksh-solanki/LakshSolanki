// Plugins
import Components from "unplugin-vue-components/vite";
import Vue from "@vitejs/plugin-vue";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import Fonts from "unplugin-fonts/vite";
import tailwindcss from "@tailwindcss/vite";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

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

export default defineConfig({
  plugins: [
    stripFontPreloads(),
    tailwindcss(),
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify({ autoImport: true }),
    Components(),
    Fonts({
      fontsource: {
        families: [
          {
            name: "Roboto",
            weights: [400, 500, 700],
            styles: ["normal"],
            subset: "latin",
          },
        ],
      },
    }),
  ],

  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
    exclude: ["vuetify"],
  },

  define: {
    "process.env": {},
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },

  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("vuetify")) {
            return "vuetify";
          }

          if (
            id.includes("jspdf") ||
            id.includes("pdfjs-dist") ||
            id.includes("jszip") ||
            id.includes("file-saver") ||
            id.includes("html2canvas")
          ) {
            return "tooling";
          }

          if (id.includes("marked") || id.includes("prismjs") || id.includes("dompurify")) {
            return "ai-rendering";
          }

          return "vendor";
        },
      },
    },
  },
});
