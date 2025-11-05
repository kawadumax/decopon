import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(command, args = []) {
  try {
    await execFileAsync(command, args, { stdio: "pipe" });
    return true;
  } catch (error) {
    // Swallow errors so a missing binary or already-terminated process
    // does not fail the whole script.
    return false;
  }
}

async function killEmulators() {
  const devicesOutput = await execFileAsync("adb", ["devices"], {
    stdio: "pipe",
  }).catch(() => ({ stdout: "" }));

  const ids = devicesOutput.stdout
    ?.split("\n")
    .map((line) => line.trim().split(/\s+/)[0])
    .filter((id) => id?.startsWith("emulator-")) ?? [];

  if (ids.length === 0) {
    return;
  }

  await Promise.all(ids.map((id) => run("adb", ["-s", id, "emu", "kill"])));
}

async function killAdb() {
  await run("adb", ["kill-server"]);
}

async function killQemuProcesses() {
  if (process.platform !== "win32") {
    return;
  }

  const exeNames = [
    "qemu-system-x86_64.exe",
    "qemu-system-i386.exe",
    "qemu-system-arm64.exe",
  ];

  await Promise.all(
    exeNames.map((name) =>
      run("taskkill", ["/IM", name, "/F", "/T"]),
    ),
  );
}

async function main() {
  console.log("Stopping Android emulators and adb...");
  await killEmulators();
  await killAdb();
  await killQemuProcesses();
  console.log("Android emulator processes terminated.");
}

main().catch((error) => {
  console.error("[android-halt] Failed to stop Android tooling processes.", error);
  process.exitCode = 1;
});
