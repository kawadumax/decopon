#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(__dirname);

const versionFilePath = join(repoRoot, "VERSION");

function normalizeVersion(input) {
  const version = input.trim();
  if (!version) {
    throw new Error("VERSION file is empty.");
  }
  return version;
}

async function readJson(filePath) {
  const source = await readFile(filePath, "utf8");
  return { source, data: JSON.parse(source) };
}

async function writeJsonIfChanged(filePath, originalSource, data) {
  const nextSource = `${JSON.stringify(data, null, 2)}\n`;
  if (nextSource !== originalSource) {
    await writeFile(filePath, nextSource, "utf8");
    return true;
  }
  return false;
}

async function updateVersion(version) {
  const targets = [
    "frontend/app/windows/src-tauri/tauri.conf.json",
    "frontend/app/android/src-tauri/tauri.conf.json",
    "frontend/app/windows/package.json",
    "frontend/app/android/package.json",
  ];

  let updatedCount = 0;

  for (const relativePath of targets) {
    const filePath = join(repoRoot, relativePath);
    const { source, data } = await readJson(filePath);
    if (data.version === version) {
      continue;
    }
    data.version = version;
    const changed = await writeJsonIfChanged(filePath, source, data);
    if (changed) {
      updatedCount += 1;
      console.log(`[version:sync] Updated ${relativePath} -> ${version}`);
    }
  }

  if (updatedCount === 0) {
    console.log("[version:sync] All targets already up to date.");
  }
}

async function main() {
  const versionRaw = await readFile(versionFilePath, "utf8");
  const version = normalizeVersion(versionRaw);
  await updateVersion(version);
}

main().catch((error) => {
  console.error("[version:sync] Failed to sync version.", error);
  process.exitCode = 1;
});
