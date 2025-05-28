import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import type { Plugin, PluginOption } from "vite";
import svgr from "vite-plugin-svgr";
const plugins: (Plugin<unknown> | PluginOption[])[] = [
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
];
export default plugins;
