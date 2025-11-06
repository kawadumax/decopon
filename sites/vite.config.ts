import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

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
    publicDir: path.resolve(__dirname, "public"),
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
  };
});
