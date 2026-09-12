import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path must match the GitHub Pages project URL.
export default defineConfig({
  base: "/pi-dashboard/",
  plugins: [react()],
});
