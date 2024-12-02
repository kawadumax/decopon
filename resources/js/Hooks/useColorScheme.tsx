import { useState, useEffect } from "react";

export const useColorScheme = () => {
    const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        // 初期値を設定
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setColorScheme(mediaQuery.matches ? "dark" : "light");

        // リスナーを設定
        const listener = (event: MediaQueryListEvent) => {
            setColorScheme(event.matches ? "dark" : "light");
        };
        mediaQuery.addEventListener("change", listener);

        // クリーンアップ関数
        return () => mediaQuery.removeEventListener("change", listener);
    }, []);

    return colorScheme;
};
