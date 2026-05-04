// Plugins
import Components from "unplugin-vue-components/vite";
import Vue from "@vitejs/plugin-vue";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import Fonts from "unplugin-fonts/vite";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";


export default defineConfig(async () => {

  return {
    base: process.env.VITE_BASE_URL || "/",
    plugins: [
      Vue({
        template: { transformAssetUrls },
      }),
      Vuetify({ autoImport: true }),
      Components(),
      Fonts({
        fontsource: {
          families: [
            { name: "Roboto", weights: [400, 700] },
            { name: "Manrope", weights: [400, 700] },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
    },

    server: {
      port: 3000,
      host: true,
      open: true,
      strictPort: true,
    },
    css: {
      devSourcemap: true,
    },
    build: {
      target: "esnext",
      cssCodeSplit: true,

      chunkSizeWarningLimit: 1300,
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