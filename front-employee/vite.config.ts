import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api/v1/auth": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
      "/api/v1/users": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
      "/api/v1/preferences": {
        target: "http://localhost:9010",
        changeOrigin: true,
      },
      "/api/v1/monitoring": {
        target: "http://localhost:9015",
        changeOrigin: true,
      },
      "/api/v1/accounts": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:9005",
        ws: true,
        changeOrigin: true,
      },
      "/api/v1/loan": {
        target: "http://localhost:9001",
        changeOrigin: true,
      },
      "/api/v1/tariffs": {
        target: "http://localhost:9001",
        changeOrigin: true,
      },
    },
  },
});
