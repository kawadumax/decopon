import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import svgr from 'vite-plugin-svgr'


export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.tsx",
            refresh: true,
        }),
        react(),
        svgr({
            svgrOptions: {
                exportType: 'named',
                ref: true,
            },
        }),
    ],
    server: {
        host: "localhost",
        port: 5173,
        watch: {
            usePolling: true,
        },
    },
});
