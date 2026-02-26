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
    proxy: {
      "/api/v1/auth": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
      "/api/v1/users": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
      "/api/v1/accounts": {
        target: "http://localhost:9005",
        changeOrigin: true,
      },
    },
  },
});
