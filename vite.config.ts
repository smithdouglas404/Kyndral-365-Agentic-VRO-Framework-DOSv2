import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

function replitHmrFix(): Plugin {
  return {
    name: "replit-hmr-fix",
    enforce: "pre",
    resolveId(id) {
      if (id === "/@vite/client" || id === "@vite/client") {
        return "\0vite-client-stub";
      }
    },
    load(id) {
      if (id === "\0vite-client-stub") {
        return `
          export function createHotContext() { return { accept() {}, dispose() {}, prune() {}, invalidate() {}, on() {}, send() {}, data: {} }; }
          export function updateStyle() {}
          export function removeStyle() {}
          export function injectQuery() { return ""; }
          console.debug("[vite] HMR disabled in Replit environment");
        `;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    replitHmrFix(),
    react(),
    tailwindcss(),
    metaImagesPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
