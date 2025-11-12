#!/usr/bin/env node
import { existsSync, lstatSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error(
    'No targets provided. Usage: node scripts/remove-build-artifacts.mjs <path> [<path> ...]',
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
