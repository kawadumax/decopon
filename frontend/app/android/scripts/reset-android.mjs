#!/usr/bin/env node

import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');
const genAndroidDir = resolve(packageRoot, 'src-tauri', 'gen', 'android');
const mobileAndroidDir = resolve(packageRoot, 'src-tauri', 'mobile', 'android');
const rootCapabilityFile = resolve(packageRoot, 'src-tauri', 'capabilities', 'default.json');
const mobileCapabilityFile = resolve(mobileAndroidDir, 'capabilities', 'default.json');
const genCapabilityFile = resolve(
  genAndroidDir,
  'app/src/main/assets/capabilities/default.json',
);

async function removeGenAndroid() {
  try {
    await rm(genAndroidDir, { recursive: true, force: true });
    console.log(`[android:reset] Removed ${genAndroidDir}`);
  } catch (error) {
    console.error(`[android:reset] Failed to remove ${genAndroidDir}`, error);
    throw error;
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyWithHandling(source, target, { recursive = false } = {}) {
  if (!(await exists(source))) {
    return;
  }

  if (recursive) {
    await mkdir(target, { recursive: true });
  } else {
    await mkdir(dirname(target), { recursive: true });
  }

  try {
    await cp(source, target, { recursive, force: true });
  } catch (error) {
    if (['EPERM', 'EBUSY', 'EACCES'].includes(error?.code ?? '')) {
      console.warn(
        `[android:reset] Skipped copying ${source} -> ${target} due to ${error.code}.`,
      );
      return;
    }
    throw error;
  }
}

async function copyRootCapabilities() {
  if (!(await exists(rootCapabilityFile))) {
    return;
  }
  await copyWithHandling(rootCapabilityFile, mobileCapabilityFile);
  await copyWithHandling(rootCapabilityFile, genCapabilityFile);
}

async function copyMobileTemplatesToGen() {
  if (!(await exists(mobileAndroidDir))) {
    return;
  }

  await mkdir(genAndroidDir, { recursive: true });
  const entries = await readdir(mobileAndroidDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(mobileAndroidDir, entry.name);
    const targetPath = join(genAndroidDir, entry.name);
    await copyWithHandling(sourcePath, targetPath, { recursive: entry.isDirectory() });
  }
}

async function syncMobileTemplates() {
  await copyRootCapabilities();
  await copyMobileTemplatesToGen();
  console.log('[android:reset] Synced mobile template overrides into gen/android.');
}

function runTauriAndroidInit() {
  return new Promise((resolvePromise, reject) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'cmd.exe' : 'pnpm';
    const args = isWindows
      ? ['/c', 'pnpm', 'tauri', 'android', 'init', '--ci']
      : ['tauri', 'android', 'init', '--ci'];

    const child = spawn(command, args, {
      cwd: packageRoot,
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise();
      } else {
        const reason = code ?? signal ?? 'unknown';
        reject(new Error(`tauri android init exited with ${reason}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

(async () => {
  try {
    await removeGenAndroid();
    await runTauriAndroidInit();
    // await syncMobileTemplates();
    console.log('[android:reset] Completed successfully.');
  } catch (error) {
    console.error('[android:reset] Failed.', error);
    process.exitCode = 1;
  }
})();

