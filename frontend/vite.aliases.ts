import path from "node:path";

export const alias = {
  "@decopon/core": path.resolve(__dirname, "core/src"),
  "@": path.resolve(__dirname, "core/src"),
  "@lib": path.resolve(__dirname, "core/src/scripts/lib"),
  "@components": path.resolve(__dirname, "core/src/scripts/components"),
  "@pages": path.resolve(__dirname, "core/src/scripts/pages"),
  "@public": path.resolve(__dirname, "core/public"),
  "@hooks": path.resolve(__dirname, "core/src/scripts/hooks"),
  "@store": path.resolve(__dirname, "core/src/scripts/store"),
};

export default alias;
