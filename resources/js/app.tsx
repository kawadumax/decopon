import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";

import { useAtomValue } from "jotai";
import { type ReactNode, useEffect } from "react";
import { TimeManager } from "./Components/TimeManager";
import { languageAtom } from "./Lib/atoms";
import { initializeI18n } from "./i18n";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

function App({ children }: { children: ReactNode }) {
	const lang = useAtomValue(languageAtom);

	useEffect(() => {
		initializeI18n(lang);
		document.documentElement.lang = lang;
	}, [lang]);

	return (
		<>
			<TimeManager />
			<DevTools position="top-left" />
			{children}
		</>
	);
}

createInertiaApp({
	title: (title) => `${title} | ${appName}`,
	resolve: (name) =>
		resolvePageComponent(
			`./Pages/${name}.tsx`,
			import.meta.glob("./Pages/**/*.tsx"),
		),
	setup({ el, App: InertiaApp, props }) {
		const root = createRoot(el);
		root.render(
			<App>
				<InertiaApp {...props} />
			</App>,
		);
	},
	progress: {
		color: "#4B5563",
	},
});
