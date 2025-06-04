import type { Preview } from "@storybook/react";
import { initialize as initializeMsw, mswLoader } from "msw-storybook-addon";
import { route } from "ziggy-js";
import { initializeI18n } from "../src/scripts/i18n";
import { Ziggy } from "../src/scripts/lib/ziggy";
import { Locale } from "../src/scripts/types/index.d";
import "../src/styles/app.css";

initializeMsw({
  onUnhandledRequest: "bypass",
});
initializeI18n(Locale.ENGLISH);

// @ts-ignore
globalThis.Ziggy = Ziggy;
// @ts-ignore
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
