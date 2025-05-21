import path from "node:path";

const root = path.resolve(__dirname, "..");

const alias = {
  "@": path.resolve(root, "src"),
  "@components": path.resolve(root, "src/scripts/components"),
  "@pages": path.resolve(root, "src/scripts/pages"),
  "@public": path.resolve(root, "public"),
  // "@core": path.resolve(root, "src"),
};

console.log("alias", alias);

export default alias;
