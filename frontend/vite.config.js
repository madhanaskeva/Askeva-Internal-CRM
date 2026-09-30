import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Pages are lazy-loaded; the remaining large chunk is React + Ant Design itself.
    chunkSizeWarningLimit: 700,
  },
});
