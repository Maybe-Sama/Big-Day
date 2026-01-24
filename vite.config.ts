import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3210,
    proxy: {
      /**
       * Paridad local vs prod:
       * - API real (Vercel Functions en /api/*): normalmente se sirve con `vercel dev` (default 3333).
       * - Endpoints legacy en Express (gofile, etc.): siguen en 3001.
       *
       * Control:
       * - VITE_API_MODE=vercel|express
       * - VITE_VERCEL_PROXY_TARGET (default http://localhost:3333)
       * - VITE_EXPRESS_PROXY_TARGET (default http://localhost:3001)
       */
      "/api/gofile": {
        target: process.env.VITE_EXPRESS_PROXY_TARGET || "http://localhost:3001",
        changeOrigin: true,
      },
      "/api": {
        target:
          (process.env.VITE_API_MODE || "express") === "express"
            ? process.env.VITE_EXPRESS_PROXY_TARGET || "http://localhost:3001"
            : process.env.VITE_VERCEL_PROXY_TARGET || "http://localhost:3333",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
