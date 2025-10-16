import path from "node:path";

import { defineConfig } from "vitest/config";

import { alias } from "../vite.aliases";

export default defineConfig({
  resolve: { alias },
  publicDir: path.resolve(__dirname, "public"),
  envDir: path.resolve(__dirname, "../../"),
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
