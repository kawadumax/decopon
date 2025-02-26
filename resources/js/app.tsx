import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";

import { LangManager } from "./Components/LangManager";
import { TimeManager } from "./Components/TimeManager";
import { initializeI18n } from "./i18n";
import { Locale } from "./types/index.d";

const appName = import.meta.env.VITE_APP_NAME || "Decopon";

createInertiaApp({
	title: (title) => `${title} | ${appName}`,
	resolve: (name) =>
		resolvePageComponent(
			`./Pages/${name}.tsx`,
			import.meta.glob("./Pages/**/*.tsx"),
		),
	setup({ el, App, props }) {
		const root = createRoot(el);

		//TODO: LocalStorageに保存し、読みにいくようにする
		// LocalStorage > リクエストのロケール？ > 英語
		initializeI18n(Locale.ENGLISH);
		root.render(
			<>
				<LangManager />
				<TimeManager />
				<DevTools position="top-left" />
				<App {...props} />,
			</>,
		);
	},
	progress: {
		color: "#4B5563",
	},
});
