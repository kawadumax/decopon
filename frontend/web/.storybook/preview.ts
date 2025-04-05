import { initializeI18n } from "@/i18n"; // パスはプロジェクトに応じて修正
import { Locale } from "@/types/index.d";
import { Ziggy } from "@core/ziggy.js";
import type { Preview } from "@storybook/react";
import { initialize as initializeMsw, mswLoader } from "msw-storybook-addon";
import { route } from "ziggy-js";
import "@/../css/app.css";

initializeMsw();
initializeI18n(Locale.ENGLISH);

globalThis.Ziggy = Ziggy;
globalThis.route = route;

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: {
            width: "375px",
            height: "667px",
          },
        },
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
      },
      defaultViewport: "mobile",
    },
  },
  loaders: [mswLoader],
};

export default preview;
