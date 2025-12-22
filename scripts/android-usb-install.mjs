import { execFile, spawn } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(__dirname);
const apkRoot = join(
  repoRoot,
  "frontend",
  "app",
  "android",
  "src-tauri",
  "gen",
  "android",
  "app",
  "build",
  "outputs",
  "apk",
);

async function runStreaming(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function buildDebugApk(target) {
  console.log(`[android-usb-install] Start debug build (target=${target}).`);
  await runStreaming(
    "pnpm",
    [
      "-F",
      "@decopon/app-android",
      "tauri",
      "android",
      "build",
      "--debug",
      "--target",
      target,
    ],
    { cwd: repoRoot },
  );
  console.log("[android-usb-install] Debug build finished.");
}

async function collectDebugApks(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const apks = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      apks.push(...(await collectDebugApks(fullPath)));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".apk")) {
      continue;
    }

    if (!fullPath.toLowerCase().includes("debug")) {
      continue;
    }

    const { mtimeMs } = await stat(fullPath);
    apks.push({ path: fullPath, mtimeMs });
  }

  return apks;
}

async function findLatestDebugApk() {
  const candidates = await collectDebugApks(apkRoot);

  if (candidates.length === 0) {
    throw new Error(`No debug APK found. Inspect path: ${apkRoot}`);
  }

  const latest = candidates.reduce((acc, current) =>
    current.mtimeMs > acc.mtimeMs ? current : acc,
  );

  console.log(`[android-usb-install] Selected APK: ${latest.path}`);
  return latest.path;
}

function parseDevices(stdout) {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("List of devices"))
    .map((line) => {
      const [id, status] = line.split(/\s+/);
      return { id, status };
    })
    .filter((device) => device.id);
}

async function findConnectedUsbDevice() {
  const { stdout } = await execFileAsync("adb", ["devices"], {
    encoding: "utf8",
  });
  const devices = parseDevices(stdout).filter(
    (device) =>
      device.status === "device" &&
      !device.id.includes(":") &&
      !device.id.startsWith("emulator-"),
  );
  const requestedId = (process.env.ANDROID_DEVICE_ID ?? "").trim();

  if (requestedId) {
    const target = devices.find((device) => device.id === requestedId);
    if (!target) {
      throw new Error(
        `Device ${requestedId} not found. Check adb devices output.`,
      );
    }
    return target.id;
  }

  if (devices.length === 0) {
    throw new Error(
      "No USB-connected adb device found. Check USB debugging and adb devices.",
    );
  }

  if (devices.length > 1) {
    console.warn(
      `[android-usb-install] Multiple devices detected. Using ${devices[0].id}.`,
    );
  }

  return devices[0].id;
}

async function installApk(deviceId, apkPath) {
  console.log(`[android-usb-install] Installing to ${deviceId}.`);
  const timeoutMs =
    Number.parseInt(process.env.INSTALL_TIMEOUT_MS ?? "", 10) || 120_000;

  await new Promise((resolve, reject) => {
    const child = spawn("adb", ["-s", deviceId, "install", "-r", apkPath], {
      stdio: "inherit",
      shell: false,
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(
        new Error(
          `adb install timed out after ${timeoutMs} ms. Set INSTALL_TIMEOUT_MS to adjust.`,
        ),
      );
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`adb install exited with code ${code}`));
      }
    });
  });

  console.log("[android-usb-install] Installation complete.");
}

async function main() {
  const target = process.env.ANDROID_TARGET ?? "aarch64";
  await buildDebugApk(target);
  const apkPath = await findLatestDebugApk();
  const deviceId = await findConnectedUsbDevice();
  await installApk(deviceId, apkPath);
}

main().catch((error) => {
  console.error("[android-usb-install] Failed:", error.message);
  process.exitCode = 1;
});
