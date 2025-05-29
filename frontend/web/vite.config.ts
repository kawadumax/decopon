import path from "node:path";
import { alias, plugins } from "@decopon/core";
import { defineConfig } from "vite";

export default () => {
  return defineConfig({
    plugins,
    server: {
      host: "localhost",
      port: 5173,
      watch: {
        usePolling: true,
        ignored: ["!**/node_modules/@decopon/core/**"],
      },
      open: false,
    },
    resolve: {
      alias: {
        ...alias,
        "@decopon/core": path.resolve(__dirname, "../core/src"),
      },
    },
    optimizeDeps: {
      exclude: ["@decopon/core"],
    },
    publicDir: "../core/public",
    envDir: "../../",
  });
};
