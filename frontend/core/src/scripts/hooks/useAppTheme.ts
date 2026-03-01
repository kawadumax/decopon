import { useTheme } from "next-themes";
import { defaultAppTheme, type AppTheme } from "@/scripts/lib/theme";

export const useAppTheme = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return {
    theme: (theme ?? defaultAppTheme) as AppTheme,
    setTheme,
    resolvedTheme: resolvedTheme as Exclude<AppTheme, "system"> | undefined,
  };
};
