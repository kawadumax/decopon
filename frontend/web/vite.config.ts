import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import TanStackRouterVite from "@tanstack/router-plugin/vite";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { alias } from "../vite.aliases";
const RESERVED_MODES = new Set(["development", "production", "test"]);
const coreRoot = path.resolve(__dirname, "../core");

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
  const normalizedMode = (env.APP_MODE ?? "web").trim().toLowerCase();
  const fallbackSingleUser = normalizedMode === "web" ? "0" : "1";
  const singleUserModeFlag = env.VITE_APP_SINGLE_USER_MODE ?? fallbackSingleUser;

  return {
    plugins: [
      TanStackRouterVite({
        autoCodeSplitting: false,
        routesDirectory: path.resolve(coreRoot, "src/routes"),
        generatedRouteTree: path.resolve(coreRoot, "src/routeTree.gen.ts"),
      }),
      tailwindcss(),
      react(),
      svgr({
        svgrOptions: {
          exportType: "named",
          ref: true,
        },
      }),
    ],
    publicDir: path.resolve(__dirname, "../core/public"),
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
    envDir,
    resolve: { alias },
    define: {
      "import.meta.env.VITE_APP_SINGLE_USER_MODE": JSON.stringify(
        singleUserModeFlag,
      ),
    },
  };
});
