import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { alias } from "../vite.aliases";
export default defineConfig(() => {
  return {
    plugins: [
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
    envDir: "../../",
    resolve: { alias },
  };
});
