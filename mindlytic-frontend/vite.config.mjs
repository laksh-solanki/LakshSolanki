// Plugins
import Components from "unplugin-vue-components/vite";
import Vue from "@vitejs/plugin-vue";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import Fonts from "unplugin-fonts/vite";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    // Use 'autoImport' if you want Vuetify components to load automatically
    Vuetify({ autoImport: true }),
    Components(),
    Fonts({
      fontsource: {
        families: [
          {
            name: "Roboto",
            weights: [100, 300, 400, 500, 700, 900],
            styles: ["normal", "italic"],
          },
        ],
      },
    }),
  ],

  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    },
    exclude: ["vuetify"],
  },

  define: {
    "process.env": {},
    // REMOVED: pdfjsLib definition here.
    // Set this inside your component script instead!
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },

  server: {
    port: 3000,
  },

  // Suggested: Add build options to handle the worker file if you use it locally
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-vendor": ["jspdf"], // Moves jspdf to its own file to keep the main bundle small
        },
      },
    },
  },
});
