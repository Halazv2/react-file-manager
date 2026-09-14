import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Relative base so the demo works on GitHub Pages and locally.
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@halazv2/react-file-manager": resolve(root, "src/index.ts")
    }
  },
  build: {
    outDir: "dist-demo",
    emptyOutDir: true
  },
  test: {
    include: ["src/**/*.test.ts"]
  }
});
