const path = require("node:path");
const depcheck = require("depcheck");

/** @type {import("depcheck").Options} */
module.exports = {
  specials: [
    depcheck.special.bin,
    depcheck.special.storybook,
    depcheck.special.typescript,
    depcheck.special.vite,
  ],
  alias: {
    "@": path.resolve(__dirname, "src"),
    "@lib": path.resolve(__dirname, "src/scripts/lib"),
    "@components": path.resolve(__dirname, "src/scripts/components"),
    "@pages": path.resolve(__dirname, "src/scripts/pages"),
    "@public": path.resolve(__dirname, "public"),
    "@hooks": path.resolve(__dirname, "src/scripts/hooks"),
    "@store": path.resolve(__dirname, "src/scripts/store"),
  },
  ignores: [
    "@chromatic-com/storybook",
    "@storybook/*",
    "@tailwindcss/forms",
    "@tailwindcss/postcss",
    "tailwindcss",
    "tw-animate-css",
    "@components/*",
    "@pages/*",
    "@lib/*",
    "@hooks/*",
    "@store/*",
    "@public/*",
    "@tanstack/router-cli",
  ],
  ignorePatterns: [
    "dist",
    "stories",
    "public",
    "*.d.ts",
    "src/routeTree.gen.ts",
    "src/scripts/i18n/locales/*.json",
  ],
};
