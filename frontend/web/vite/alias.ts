import path from "node:path";

const root = path.resolve(__dirname, "..");

const alias = {
  "@": path.resolve(root, "./src"),
  "@components": path.resolve(root, "../core/src/scripts/components"),
  "@pages": path.resolve(root, "../core/src/scripts/pages"),
  "@public": path.resolve(root, "../core/public"),
  "@core": path.resolve(root, "../core/src"),
};

export default alias;
