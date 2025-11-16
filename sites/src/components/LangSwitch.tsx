import { useTranslation } from "react-i18next";

const locales = [
  { value: "en", label: "EN" },
  { value: "ja", label: "JP" },
];

export function LangSwitch() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <span className="sr-only sm:not-sr-only">{t("welcome.lang")}</span>
      <select
        className="rounded-md border border-line-subtle bg-transparent py-1 text-sm text-fg shadow-sm transition hover:border-line-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted dark:border-line-subtle dark:text-fg-inverse dark:focus-visible:ring-offset-surface-inverse"
        value={locales.some((locale) => locale.value === currentLanguage) ? currentLanguage : "en"}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
      >
        {locales.map((locale) => (
          <option key={locale.value} value={locale.value}>
            {locale.label}
          </option>
        ))}
      </select>
    </label>
  );
}
