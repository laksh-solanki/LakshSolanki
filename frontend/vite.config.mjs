// Plugins
import Components from "unplugin-vue-components/vite";
import Vue from "@vitejs/plugin-vue";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import Fonts from "unplugin-fonts/vite";
import tailwindcss from "@tailwindcss/vite";
import vueDevTools from 'vite-plugin-vue-devtools'

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
  base: process.env.VITE_BASE_URL || '/',
  plugins: [
    stripFontPreloads(),
    tailwindcss(),
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify({ autoImport: true }),
    vueDevTools(),
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

  optimizeDeps: {
    exclude: ["vuetify"],
  },

  define: {
    // Removed process.env override as it breaks production build for Vuetify
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
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Your manualChunks logic is excellent for large apps
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("vuetify")) return "vuetify";
            if (id.includes("jspdf") || id.includes("pdfjs-dist")) return "pdf-tools";
            if (id.includes("jszip") || id.includes("file-saver") || id.includes("html2canvas")) return "file-tools";
            if (id.includes("marked") || id.includes("prismjs") || id.includes("dompurify")) return "ai-rendering";
            if (id.includes("firebase")) return "firebase";
            return "vendor";
          }
        },
      },
    },
  },
});