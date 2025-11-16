import { useTranslation } from "react-i18next";

export const RouteSuspenseFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center py-10">
      <span className="sr-only">{t("common.loading")}</span>
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-amber-400 border-t-transparent border-b-transparent" />
    </div>
  );
};
