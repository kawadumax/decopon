import { defineConfig } from "vite";
import { createTauriViteConfig } from "../shared/vite.config.base";

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

export default defineConfig(({ mode }) =>
  createTauriViteConfig({
    platformDir: __dirname,
    envMode: resolveEnvMode(mode, "windows"),
    resolveHost: (envHost) =>
      envHost
        ? {
            host: envHost,
            hmr: {
              protocol: "ws",
              host: envHost,
              port: 1421,
            },
          }
        : { host: false },
  }),
);
