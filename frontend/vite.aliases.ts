import path from "node:path";
const coreSourceRoot = path.resolve(__dirname, "core/src");

type AliasEntry = {
  find: string | RegExp;
  replacement: string;
};

export const alias: AliasEntry[] = [
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
