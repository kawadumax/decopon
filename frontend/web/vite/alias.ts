import path from "node:path";

const root = path.resolve(__dirname, "..");

const alias = {
  "@": path.resolve(root, "./src/ts"),
  "@components": path.resolve(root, "./src/ts/components"),
  "@pages": path.resolve(root, "./src/ts/pages"),
  "@public": path.resolve(root, "../core/public"),
  "@core": path.resolve(root, "../core/src/js"),
};

export default alias;
