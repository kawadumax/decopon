var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
var plugins = [
    tailwindcss(),
    TanStackRouterVite({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "../core/src/routes",
        generatedRouteTree: "../core/src/routeTree.gen.ts",
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
];
var coreRoot = path.resolve(__dirname, "../core");
var alias = {
    "@": path.resolve(coreRoot, "src"),
    "@lib": path.resolve(coreRoot, "src/scripts/lib"),
    "@components": path.resolve(coreRoot, "src/scripts/components"),
    "@pages": path.resolve(coreRoot, "src/scripts/pages"),
    "@public": path.resolve(coreRoot, "public"),
    "@hooks": path.resolve(coreRoot, "src/scripts/hooks"),
};
var host = process.env.TAURI_DEV_HOST;
export default defineConfig(function () { return ({
    plugins: plugins,
    optimizeDeps: {
        exclude: ["@decopon/core"],
    },
    publicDir: "../core/public",
    resolve: {
        alias: __assign(__assign({}, alias), { "@decopon/core": path.resolve(__dirname, "../core/src") }),
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: "ws",
                host: host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },
}); });
