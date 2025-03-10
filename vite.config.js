import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";

export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		plugins: [
			laravel({
				input: "resources/js/app.tsx",
				refresh: true,
			}),
			react({
				babel: {
					presets: ["jotai/babel/preset"],
				},
			}),
			svgr({
				svgrOptions: {
					exportType: "named",
					ref: true,
				},
			}),
			(() => {
				return {
					name: "rewrite-worker",
					// webworkerをdevelop環境でうまく読み込むために、viteサーバから転送する
					transform(code, id) {
						if (process.env.VITE_APP_ENV !== "local") {
							return;
						}

						if (id.includes("worker")) {
							const newCode = code.replace(
								"__laravel_vite_placeholder__.test",
								"localhost:8000",
							);
							return newCode;
						}
					},
				};
			})(),
		],
		server: {
			host: "localhost",
			port: 5173,
			watch: {
				usePolling: true,
			},
			open: false, // Laravelサーバから配信するためオフ
		},
	});
};
