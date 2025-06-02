import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
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

const coreRoot = path.resolve(__dirname, "../core");
const alias = {
  "@": path.resolve(coreRoot, "src"),
  "@lib": path.resolve(coreRoot, "src/scripts/lib"),
  "@components": path.resolve(coreRoot, "src/scripts/components"),
  "@pages": path.resolve(coreRoot, "src/scripts/pages"),
  "@public": path.resolve(coreRoot, "public"),
  "@hooks": path.resolve(coreRoot, "src/scripts/hooks"),
};

export default defineConfig(() => {
  return {
    plugins,
    server: {
      host: "localhost",
      port: 5173,
      watch: {
        usePolling: true,
      },
      open: false,
      fs: {
        // ここにプロジェクトのルートディレクトリや、
        // frontendディレクトリなど、アクセスを許可したいパスを指定します。
        // 例: frontend ディレクトリ自体を許可する場合
        allow: [path.resolve(__dirname, "../")],
      },
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
  };
});
