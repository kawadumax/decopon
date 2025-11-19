import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { mergeConfig } from "vite";
import type { Plugin, PluginOption } from "vite";
import svgr from "vite-plugin-svgr";

const plugins: (Plugin<unknown> | PluginOption[])[] = [
  tailwindcss(),
  react(),
  svgr({
    svgrOptions: {
      exportType: "named",
      ref: true,
    },
  }),
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coreRoot = path.resolve(__dirname, "../");

const alias = {
  "@": path.resolve(coreRoot, "src"),
  "@lib": path.resolve(coreRoot, "src/scripts/lib"),
  "@components": path.resolve(coreRoot, "src/scripts/components"),
  "@pages": path.resolve(coreRoot, "src/scripts/pages"),
  "@public": path.resolve(coreRoot, "public"),
  "@hooks": path.resolve(coreRoot, "src/scripts/hooks"),
};

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias,
      },
      plugins,
      server: {
        port: 6006,
        host: "localhost",
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
    });
  },
};
export default config;
