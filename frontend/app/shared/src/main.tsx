import "@decopon/core/styles/app.css";
import { bootstrap, renderSplash, singleUserBootstrap } from "@decopon/core";

const BACKEND_READY_EVENT = "decopon://backend-ready";

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
  const root = document.getElementById("root");
  const showInitialSplash = () => {
    if (root) {
      renderSplash(root, { variant: "initial" });
    }
  };
  const showBackendLoading = () => {
    if (root) {
      renderSplash(root, {
        variant: "loading",
        message: "バックエンドの初期化を実行しています。しばらくお待ちください…",
      });
    }
  };
  const clearStartupMessage = () => {
    if (root) {
      root.innerHTML = "";
    }
  };

  showInitialSplash();

  const tauriReady = await waitForTauriAvailability();
  let emit: typeof import("@tauri-apps/api/event").emit | undefined;
  let listen: typeof import("@tauri-apps/api/event").listen | undefined;

  if (!tauriReady) {
    console.error(
      "Tauri APIs are unavailable. Skipping mobile bootstrap sequence.",
    );
    clearStartupMessage();
    bootstrap();
    return;
  }

  try {
    ({ emit, listen } = await import("@tauri-apps/api/event"));
  } catch (error) {
    console.error("Failed to load Tauri event APIs", error);
    clearStartupMessage();
    bootstrap();
    return;
  }

  showBackendLoading();

  const unlisten = await listen(BACKEND_READY_EVENT, async () => {
    await unlisten();

    try {
      await singleUserBootstrap();
    } catch (error) {
      console.error("Failed to run single user bootstrap", error);
    }

    clearStartupMessage();
    bootstrap();
  });

  try {
    await emit("decopon://frontend-ready");
  } catch (error) {
    console.error("Failed to notify backend about frontend readiness", error);
    clearStartupMessage();
  }
})();
