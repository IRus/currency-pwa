import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";
import {VitePWA} from "vite-plugin-pwa";

export default defineConfig({
  // Relative, so the app works under any path prefix: at the container root for
  // `docker run`, and under /currency/ in production where the reverse proxy
  // strips the prefix before it reaches us.
  base: "./",
  plugins: [
    react(),
    VitePWA({
      strategies: "generateSW",
      // index.html registers the worker by hand so it can reload the page once
      // when an updated worker takes over.
      injectRegister: false,
      // The manifest is a static file in public/, not generated here.
      manifest: false,
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // The default patterns cover only js/css/html, which would leave the
        // icons and the web app manifest out of the precache.
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
        // No navigateFallback on purpose. There is no client-side routing, and
        // since every URL in the document is relative, index.html served for
        // some deeper path would resolve its bundle against that path and
        // render nothing. "/" and "/index.html" both come from the precache via
        // workbox's directoryIndex, which is all this app navigates to.
        navigateFallback: undefined
      }
    })
  ],
  build: {
    sourcemap: true
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "*.test.js"]
  }
});
