import "@decopon/core/styles/app.css";
import { bootstrap, singleUserBootstrap } from "@decopon/core";
import { BACKEND_READY_EVENT, FRONTEND_READY_EVENT } from "./events";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const hasTauriApis = () =>
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window ||
    "__TAURI_IPC__" in window ||
    "__TAURI__" in window);

const waitForTauriAvailability = async (timeoutMs = 8000) => {
  const start = Date.now();
  while (!hasTauriApis()) {
    if (Date.now() - start > timeoutMs) {
      return false;
    }
    await sleep(50);
  }
  return true;
};

void (async () => {
  const tauriReady = await waitForTauriAvailability();
  let emit: typeof import("@tauri-apps/api/event").emit | undefined;
  let listen: typeof import("@tauri-apps/api/event").listen | undefined;

  if (!tauriReady) {
    console.error(
      "Tauri APIs are unavailable. Skipping mobile bootstrap sequence.",
    );
    bootstrap();
    return;
  }

  try {
    ({ emit, listen } = await import("@tauri-apps/api/event"));
  } catch (error) {
    console.error("Failed to load Tauri event APIs", error);
    bootstrap();
    return;
  }

  await listen(BACKEND_READY_EVENT, async () => {
    try {
      await singleUserBootstrap();
    } catch (error) {
      console.error("Failed to run single user bootstrap", error);
    }

    bootstrap();
  });

  try {
    await emit(FRONTEND_READY_EVENT);
  } catch (error) {
    console.error("Failed to notify backend about frontend readiness", error);
  }
})();
