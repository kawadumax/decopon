import type { Theme } from "@tauri-apps/api/window";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { defaultAppTheme, type AppTheme } from "@/scripts/lib/theme";
import { isTauriEnvironment } from "@/scripts/lib/isTauriEnvironment";
import { useAppTheme } from "@/scripts/hooks/useAppTheme";

const ThemeSyncEffect = () => {
  const { theme } = useAppTheme();

  useEffect(() => {
    if (!theme) return;
    if (!isTauriEnvironment()) return;

    const syncTheme = async (nextTheme: AppTheme) => {
      try {
        const { setTheme } = await import("@tauri-apps/api/app");
        const targetTheme: Theme | null = nextTheme === "system" ? null : nextTheme;
        await setTheme(targetTheme);
      } catch (error) {
        console.warn("Failed to sync theme with OS", error);
      }
    };

    void syncTheme(theme);
  }, [theme]);

  return null;
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultAppTheme}
      enableSystem
      storageKey="decopon-theme"
    >
      <ThemeSyncEffect />
      {children}
    </ThemeProvider>
  );
};
