export const logger = (...args: any[]) => {
    const viteAppEnv = import.meta.env.VITE_APP_ENV;
    if (viteAppEnv === "local") {
        console.log(...args);
    }
};
