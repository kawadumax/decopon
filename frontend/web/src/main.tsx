import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./css/app.css";
import "@/bootstrap";

// import { DevTools } from "jotai-devtools";
// import "jotai-devtools/styles.css";

import { LangManager } from "@/components/LangManager";
// import { TimeManager } from "./Components/TimeManager";
import { initializeI18n } from "@/i18n";
import { Locale } from "@/types/index.d";

// 初期化処理
initializeI18n(Locale.ENGLISH);

// ルート要素を探して React を描画
const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

root.render(
	<StrictMode>
		<LangManager />
		{/* <TimeManager /> */}
		{/* <DevTools position="top-left" /> */}
		<RouterProvider router={router} />
	</StrictMode>,
);
