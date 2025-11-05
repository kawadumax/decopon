#!/usr/bin/env node
const { existsSync, lstatSync, rmSync } = require("node:fs");
const { resolve } = require("node:path");

const targets = process.argv.slice(2);

if (!targets.length) {
  console.error(
    "No targets provided. Usage: node scripts/clean.js <path> [<path> ...]",
  );
  process.exit(1);
}

const cwd = process.cwd();

for (const target of targets) {
  const absolutePath = resolve(cwd, target);
  try {
    if (!existsSync(absolutePath)) {
      continue;
    }

    const stat = lstatSync(absolutePath);
    const recursive = stat.isDirectory();

    rmSync(absolutePath, { recursive, force: true });
    console.log(`Removed ${target}`);
  } catch (error) {
    console.error(`Failed to remove ${target}:`, error);
    process.exitCode = 1;
  }
}

