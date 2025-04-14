import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import alias from "../vite/alias";
const config: StorybookConfig = {
  stories: ["../stories/*.mdx", "../stories/*.stories.@(js|jsx|mjs|ts|tsx)"],
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
      server: {
        port: 6006,
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
    });
  },
};
export default config;
