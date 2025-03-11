// 例: src/ts/main.tsx （または app.tsx）など

import React from "react";
import ReactDOM from "react-dom/client";

// Inertia.js 関連の import は削除
// import { createInertiaApp } from "@inertiajs/react";
// import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";

import "./css/app.css";
import "./ts/bootstrap";

// import { DevTools } from "jotai-devtools";
// import "jotai-devtools/styles.css";

// import { LangManager } from "./Components/LangManager";
// import { TimeManager } from "./Components/TimeManager";
// import { initializeI18n } from "./i18n";
// import { Locale } from "./types";

// アプリのトップレベルコンポーネント（App）を別途用意
import { App } from "./ts/App"; // 自作のApp.tsxなど

// 初期化処理
// initializeI18n(Locale.ENGLISH);

// ルート要素を探して React を描画
const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <>
    {/* <LangManager /> */}
    {/* <TimeManager /> */}
    {/* <DevTools position="top-left" /> */}
    <App />
  </>
);
