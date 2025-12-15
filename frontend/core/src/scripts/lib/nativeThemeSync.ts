import { isTauriEnvironment } from "./isTauriEnvironment";
import type { AppTheme } from "./theme";

type ResolvedTheme = Exclude<AppTheme, "system">;

type AndroidBridge = {
  applyTheme: (mode: AppTheme | ResolvedTheme) => void;
};

declare global {
  interface Window {
    DecoponNative?: AndroidBridge;
  }
}

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent || "");
};

const ensureThemeColorMeta = (color: string) => {
  let meta = document.querySelector('meta[name="theme-color"]') as
    | HTMLMetaElement
    | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
};

const syncAndroidSystemUi = (resolvedTheme?: ResolvedTheme) => {
  const theme = resolvedTheme ?? "light";
  const themeColor = theme === "dark" ? "#0f172a" : "#f8fafc";
  ensureThemeColorMeta(themeColor);
  window.DecoponNative?.applyTheme(theme);
};

export const syncNativeTheme = async (
  theme: AppTheme,
  resolvedTheme?: ResolvedTheme,
) => {
  if (!isTauriEnvironment()) return;

  if (isAndroid()) {
    syncAndroidSystemUi(
      resolvedTheme ?? (theme === "system" ? undefined : theme),
    );
    return;
  }

  try {
    const { setTheme } = await import("@tauri-apps/api/app");
    const targetTheme = theme === "system" ? null : theme;
    await setTheme(targetTheme);
  } catch (error) {
    console.warn("Failed to sync theme with OS", error);
  }
};
