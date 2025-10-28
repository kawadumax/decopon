import "@decopon/core/styles/app.css";
import { bootstrap, singleUserBootstrap } from "@decopon/core";

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
  const setStartupMessage = (message: string) => {
    if (!root) {
      return;
    }
    root.innerHTML = `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:12px;
        height:100vh;
        font-family:sans-serif;
        color:#4b5563;
        text-align:center;
      ">
        <div style="
          width:48px;
          height:48px;
          border-radius:9999px;
          border:5px solid #d1d5db;
          border-top-color:#6366f1;
          animation:tauri-loader-spin 1s linear infinite;
        "></div>
        <p style="font-size:16px;">${message}</p>
      </div>
      <style>
        @keyframes tauri-loader-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  };
  const clearStartupMessage = () => {
    if (root) {
      root.innerHTML = "";
    }
  };

  setStartupMessage("バックエンドと接続中です。初期化が完了するまでお待ちください…");

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

