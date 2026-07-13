import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

export default defineConfig(({ mode }) => ({
  plugins: [react(), babel({ presets: [] })],
  publicDir: mode === "lib" ? false : undefined,
  build:
    mode === "lib"
      ? {
          lib: {
            entry: "./src/index.ts",
            formats: ["es"],
            fileName: () => "index.js",
          },
          rollupOptions: {
            external: [
              "react",
              "react-dom",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
            ],
          },
        }
      : undefined,
}));
