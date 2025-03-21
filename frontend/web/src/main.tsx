import { App } from "@/App";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

// ziggy.js から生成されたルート名をグローバルに登録
import { Ziggy } from "@core/ziggy.js";
globalThis.Ziggy = Ziggy;

import { route } from "ziggy-js";
globalThis.route = route;

// ルート要素を探して React を描画
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
