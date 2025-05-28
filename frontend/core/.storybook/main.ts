import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";
import svgr from "vite-plugin-svgr";
import alias from "../buildSettings/alias.ts";

const config: StorybookConfig = {
  stories: ["../stories/*.stories.@(js|jsx|mjs|ts|tsx)"],
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
        alias: alias,
      },
      plugins: [
        tailwindcss(),
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
