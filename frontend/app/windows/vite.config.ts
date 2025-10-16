import path from "node:path";
import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { alias } from "../../vite.aliases";

const host = process.env.TAURI_DEV_HOST;
const require = createRequire(import.meta.url);
const resolvePackageRoot = (pkg: string, fallback: string) => {
  try {
    return path.dirname(require.resolve(`${pkg}/package.json`));
  } catch {
    return fallback;
  }
};

const sharedRoot = resolvePackageRoot(
  "@decopon/app-shared",
  path.resolve(__dirname, "../shared"),
);
const coreRoot = resolvePackageRoot(
  "@decopon/core",
  path.resolve(__dirname, "../../core"),
);

export default defineConfig(() => ({
  root: sharedRoot,
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
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
  publicDir: path.resolve(coreRoot, "public"),

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    fs: {
      allow: [sharedRoot, coreRoot, path.resolve(__dirname, "../../")],
    },
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: { alias },
  define: {
    "import.meta.env.VITE_APP_SINGLE_USER_MODE": JSON.stringify(
      process.env.VITE_APP_SINGLE_USER_MODE ?? "1",
    ),
  },
}));
