import path from "node:path";
import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import type { ServerOptions, UserConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { alias } from "../../vite.aliases";

type HostConfig = {
  host: NonNullable<ServerOptions["host"]>;
  hmr?: ServerOptions["hmr"];
};

type CreateTauriViteConfigOptions = {
  /**
   * Absolute path to the platform specific directory (typically `__dirname`).
   */
  platformDir: string;
  /**
   * Custom resolver for the development server host / HMR configuration.
   */
  resolveHost?: (envHost: string | undefined) => HostConfig;
  /**
   * Additional directories allowed for Vite file-system access.
   * The platform directory and its parent (../../) are always included.
   */
  extraAllowedDirs?: string[];
  /**
   * Custom server overrides (merged shallowly).
   */
  serverOverrides?: Partial<ServerOptions>;
};

const require = createRequire(import.meta.url);

const resolvePackageRoot = (pkg: string, fallback: string) => {
  try {
    return path.dirname(require.resolve(`${pkg}/package.json`));
  } catch {
    return fallback;
  }
};

export function createTauriViteConfig({
  platformDir,
  resolveHost,
  extraAllowedDirs = [],
  serverOverrides = {},
}: CreateTauriViteConfigOptions): UserConfig {
  const sharedFallback = path.resolve(platformDir, "../shared");
  const coreFallback = path.resolve(platformDir, "../../core");

  const sharedRoot = resolvePackageRoot("@decopon/app-shared", sharedFallback);
  const coreRoot = resolvePackageRoot("@decopon/core", coreFallback);

  const envHost = process.env.TAURI_DEV_HOST;
  const hostConfig: HostConfig = resolveHost
    ? resolveHost(envHost)
    : envHost
      ? {
          host: envHost,
          hmr: {
            protocol: "ws",
            host: envHost,
            port: 1421,
          },
        }
      : { host: false };

  const allowList = [
    sharedRoot,
    coreRoot,
    path.resolve(platformDir, "../../"),
    ...extraAllowedDirs,
  ];

  return {
    root: sharedRoot,
    build: {
      outDir: path.resolve(platformDir, "dist"),
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
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      host: hostConfig.host,
      hmr: hostConfig.hmr,
      fs: {
        allow: allowList,
      },
      watch: {
        ignored: ["**/src-tauri/**"],
      },
      ...serverOverrides,
    },
    resolve: { alias },
    define: {
      "import.meta.env.VITE_APP_SINGLE_USER_MODE": JSON.stringify(
        process.env.VITE_APP_SINGLE_USER_MODE ?? "1",
      ),
    },
  };
}
