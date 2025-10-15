import path from "node:path";
import type { AliasOptions } from "vite";

const coreSourceRoot = path.resolve(__dirname, "core/src");

export const alias: AliasOptions = [
  {
    find: /^@\//,
    replacement: `${coreSourceRoot}/`,
  },
  {
    find: "@decopon/core",
    replacement: coreSourceRoot,
  },
  {
    find: "@lib",
    replacement: path.resolve(coreSourceRoot, "scripts/lib"),
  },
  {
    find: "@components",
    replacement: path.resolve(coreSourceRoot, "scripts/components"),
  },
  {
    find: "@pages",
    replacement: path.resolve(coreSourceRoot, "scripts/pages"),
  },
  {
    find: "@public",
    replacement: path.resolve(__dirname, "core/public"),
  },
  {
    find: "@hooks",
    replacement: path.resolve(coreSourceRoot, "scripts/hooks"),
  },
  {
    find: "@store",
    replacement: path.resolve(coreSourceRoot, "scripts/store"),
  },
];

export default alias;
