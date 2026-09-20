import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: resolve(root, "tsconfig.app.json"),
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test", "demo"],
      rollupTypes: true
    })
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        index: resolve(root, "src/index.ts"),
        preview: resolve(root, "src/preview-entry.ts")
      },
      name: "ReactFileManager",
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@tanstack/react-virtual"
      ]
    }
  }
});
