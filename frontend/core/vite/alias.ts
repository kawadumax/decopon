import path from "node:path";

const root = path.resolve(__dirname, "..");

const alias = {
  "@": path.resolve(root, "src"),
  "@lib": path.resolve(root, "src/scripts/lib"),
  "@components": path.resolve(root, "src/scripts/components"),
  "@pages": path.resolve(root, "src/scripts/pages"),
  "@public": path.resolve(root, "public"),
  "@hooks": path.resolve(root, "src/scripts/hooks"),
};

export default alias;
