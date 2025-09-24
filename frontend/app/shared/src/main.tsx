import "@decopon/core/styles/app.css";
import { bootstrap, singleUserBootstrap } from "@decopon/core";
import { listen } from "@tauri-apps/api/event";

const BACKEND_READY_EVENT = "decopon://backend-ready";

void (async () => {
  const unlisten = await listen(BACKEND_READY_EVENT, async () => {
    unlisten();

    try {
      await singleUserBootstrap();
    } catch (error) {
      console.error("Failed to run single user bootstrap", error);
    }

    bootstrap();
  });
})();
