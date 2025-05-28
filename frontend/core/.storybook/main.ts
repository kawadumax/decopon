import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

import alias from "../buildSettings/alias.ts";
import plugins from "../buildSettings/plugins.ts";

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
