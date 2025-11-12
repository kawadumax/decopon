import path from "node:path";

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

import { alias } from "../vite.aliases";

const RESERVED_MODES = new Set(["development", "production", "test"]);

const resolveEnvMode = (mode: string | undefined, fallback: string) => {
  const explicit = process.env.VITE_PLATFORM?.trim();
  if (explicit) {
    return explicit;
  }
  if (mode && !RESERVED_MODES.has(mode)) {
    return mode;
  }
  return fallback;
};

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, "../../");
  const envMode = resolveEnvMode(mode, "web");
  const env = loadEnv(envMode, envDir, "");
  Object.assign(process.env, env);

  return {
    resolve: { alias },
    publicDir: path.resolve(__dirname, "public"),
    envDir,
    test: {
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
      coverage: {
        reporter: ["text", "json", "html"],
      },
    },
  };
});
