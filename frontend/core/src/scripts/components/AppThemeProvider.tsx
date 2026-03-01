import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { defaultAppTheme, type AppTheme } from "@/scripts/lib/theme";
import { isTauriEnvironment } from "@/scripts/lib/isTauriEnvironment";
import { useAppTheme } from "@/scripts/hooks/useAppTheme";
import { syncNativeTheme } from "@/scripts/lib/nativeThemeSync";

const ThemeSyncEffect = () => {
  const { theme, resolvedTheme } = useAppTheme();

  useEffect(() => {
    if (!theme) return;
    if (!isTauriEnvironment()) return;

    void syncNativeTheme(theme as AppTheme, resolvedTheme);
  }, [resolvedTheme, theme]);

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
