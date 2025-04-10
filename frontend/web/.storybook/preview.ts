import { initializeI18n } from "@/i18n";
import { Locale } from "@/types/index.d";
import { Ziggy } from "@core/ziggy.js";
import type { Preview } from "@storybook/react";
import { initialize as initializeMsw, mswLoader } from "msw-storybook-addon";
import { route } from "ziggy-js";
import "@/../styles/app.css";

initializeMsw();
initializeI18n(Locale.ENGLISH);

globalThis.Ziggy = Ziggy;
globalThis.route = route;

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
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
            height: "650px",
          },
        },
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        pc: {
          name: "PC",
          styles: {
            width: "1024px",
            height: "768px",
          },
        },
      },
      defaultViewport: "mobile",
    },
  },
  loaders: [mswLoader],
};

export default preview;
