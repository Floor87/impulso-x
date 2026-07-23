import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["brand/*.png", "brand/*.jpeg", "icons/*.png"],
      manifest: {
        name: "IMPULSOX",
        short_name: "IMPULSOX",
        description: "Seguimiento diario de habitos, entrenamiento, alimentacion, agua y progreso.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#f7f5ef",
        theme_color: "#0d1712",
        categories: ["health", "fitness", "lifestyle", "productivity"],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{html,js,css,png,jpeg,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
});
