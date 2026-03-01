export const appThemes = ["light", "dark", "system"] as const;
export type AppTheme = (typeof appThemes)[number];

export const defaultAppTheme: AppTheme = "light";
