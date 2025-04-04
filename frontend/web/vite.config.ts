import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import alias from "./vite/alias";

export default () => {
  return defineConfig({
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
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
      },
      open: false,
    },
    resolve: {
      alias,
    },
    publicDir: "../core/public",
    envDir: "../../",
  });
};
