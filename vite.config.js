import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

function releaseMetadata() {
  const commit =
    process.env.IMPULSOX_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    "local";

  return {
    name: "impulsox-release-metadata",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify(
          {
            application: "IMPULSOX",
            version: process.env.npm_package_version || "0.1.0",
            commit,
          },
          null,
          2,
        ),
      });
    },
  };
}

export default defineConfig({
  plugins: [
    releaseMetadata(),
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
        globIgnores: ["**/assets/heic-to-*.js"],
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
