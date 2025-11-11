import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const inferredBase =
    process.env.SITE_BASE_PATH ??
    (process.env.GITHUB_ACTIONS ? `/${repoName ?? ""}/` : "/");
  const base = inferredBase === "//" ? "/" : inferredBase;

  return {
    base,
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
    publicDir: path.resolve(__dirname, "public"),
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
  };
});
