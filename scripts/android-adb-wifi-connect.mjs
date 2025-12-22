import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(command, args) {
  return execFileAsync(command, args, { encoding: "utf8" });
}

function parseMdnsServices(stdout) {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const regex = /_adb-tls-connect\._tcp\s+([0-9.]+)\s+(\d+)/;
  const endpoints = new Set();

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      endpoints.add(`${match[1]}:${match[2]}`);
    }
  }

  return Array.from(endpoints);
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

async function getConnectedDeviceIds() {
  const { stdout } = await run("adb", ["devices"]);
  return parseDevices(stdout)
    .filter((device) => device.status === "device")
    .map((device) => device.id);
}

async function discoverEndpoints() {
  const { stdout } = await run("adb", ["mdns", "services"]);
  const endpoints = parseMdnsServices(stdout);

  if (endpoints.length === 0) {
    throw new Error(
      "同一ネットワーク上で adb-tls-connect を配信しているデバイスが見つかりません。",
    );
  }

  return endpoints;
}

async function connectToEndpoints(endpoints, alreadyConnected) {
  const seen = new Set(alreadyConnected);
  const targets = endpoints.filter((endpoint) => !seen.has(endpoint));

  if (targets.length === 0) {
    console.log("新たに接続するデバイスはありません。");
    return;
  }

  for (const endpoint of targets) {
    console.log(`adb connect ${endpoint}`);
    await run("adb", ["connect", endpoint]);
  }
}

async function main() {
  console.log("[android-adb-wifi-connect] ペアリング済みデバイスを探索します。");
  const endpoints = await discoverEndpoints();
  const connectedIds = await getConnectedDeviceIds();
  await connectToEndpoints(endpoints, connectedIds);
  console.log("[android-adb-wifi-connect] 処理が完了しました。");
}

main().catch((error) => {
  console.error("[android-adb-wifi-connect] 失敗しました:", error.message);
  process.exitCode = 1;
});
