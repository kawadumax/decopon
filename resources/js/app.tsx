import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";
import { TimeManager } from "./Components/TimeManager";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
	title: (title) => `${title} | ${appName}`,
	resolve: (name) =>
		resolvePageComponent(
			`./Pages/${name}.tsx`,
			import.meta.glob("./Pages/**/*.tsx"),
		),
	setup({ el, App, props }) {
		const root = createRoot(el);
		root.render(
			<>
				<TimeManager />
				<DevTools position="top-left" />
				<App {...props} />
			</>,
		);
	},
	progress: {
		color: "#4B5563",
	},
});
