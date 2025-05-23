import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import alias from "../core/vite/alias";

export default () => {
  return defineConfig({
    plugins: [
      tailwindcss(),
      TanStackRouterVite({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "../core/src/routes",
        generatedRouteTree: "../core/src/routeTree.gen.ts",
      }),
      react({
        babel: {
          presets: ["jotai/babel/preset"],
        },
      }),
      svgr({
        svgrOptions: {
          exportType: "named",
          ref: true,
        },
      }),
    ],
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
