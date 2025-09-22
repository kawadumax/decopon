import type { Locale } from "@/scripts/types";
import { cn } from "@/scripts/lib/utils";

const locales = { ENGLISH: "en", JAPANESE: "ja" } as const;
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { t } from "i18next";
import { useLangStore } from "@store/lang";

export const LangSwitchMulti = () => {
  const [lang, setLang] = [
    useLangStore((s) => s.language),
    useLangStore((s) => s.setLanguage),
  ];
  return (
    <Select
      defaultValue={lang}
      onValueChange={(event: string) => {
        setLang(event as Locale);
      }}
    >
      <SelectTrigger id="locale" className="h-10 w-fit font-bold">
        <SelectValue placeholder={t("profile.updatePreference.locale")} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(locales).map(([key, value]) => {
          return (
            <SelectItem key={key} value={value}>
              {key}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export const LangSwitch = () => {
  const [lang, setLang] = [
    useLangStore((s) => s.language),
    useLangStore((s) => s.setLanguage),
  ];

  const Span = ({ locale }: { locale: Locale }) => {
    const underlineClass = "underline decoration-1";
    const isSelected = lang === locale;
    const label = locale === locales.ENGLISH ? "EN" : "JP";
    const ariaLabel = `Switch to ${label === "EN" ? "English" : "Japanese"}`;

    return (
      <span
        onClick={() => setLang(locale)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setLang(locale);
          }
        }}
        className={cn("cursor-pointer px-2", isSelected && underlineClass)}
        aria-label={ariaLabel}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="h-10 py-2">
      <Span locale={locales.ENGLISH as Locale} />
      {" / "}
      <Span locale={locales.JAPANESE as Locale} />
    </div>
  );
};
