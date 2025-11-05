import { defineConfig } from "vite";
import { createTauriViteConfig } from "../shared/vite.config.base";

export default defineConfig(() =>
  createTauriViteConfig({
    platformDir: __dirname,
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
