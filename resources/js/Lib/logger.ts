export const logger = (...args: any[]) => {
    if (process.env.VITE_APP_ENV === "local") {
        console.log(...args);
    }
};
