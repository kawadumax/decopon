import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default ({ mode }) => {
	// process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		plugins: [
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
			})
		],
		server: {
			host: "localhost",
			port: 5173,
			watch: {
				usePolling: true,
			},
			open: true,		
		},
	});
};
