import path from "node:path";
import { defineConfig } from "vite";
import alias from "../core/buildSettings/alias";
import plugins from "../core/buildSettings/plugins";
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
