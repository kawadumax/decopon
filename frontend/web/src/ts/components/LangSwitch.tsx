import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languageAtom } from "@/lib/atoms";
import { Locale } from "@/types/index.d";
import { t } from "i18next";
import { useAtom } from "jotai";

export const LangSwitchMulti = () => {
  const [lang, setLang] = useAtom(languageAtom);
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
        {Object.entries(Locale).map(([key, value]) => {
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
  const [lang, setLang] = useAtom(languageAtom);

  const Span = ({ locale }: { locale: Locale }) => {
    const underlineClass = "underline decoration-1";
    const isSelected = lang === locale;
    const label = locale === Locale.ENGLISH ? "EN" : "JP";
    const ariaLabel = `Switch to ${label === "EN" ? "English" : "Japanese"}`;

    return (
      <span
        onClick={() => setLang(locale)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setLang(locale);
          }
        }}
        className={`cursor-pointer px-2 ${isSelected && underlineClass}`}
        aria-label={ariaLabel}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="h-10 py-2">
      <Span locale={Locale.ENGLISH} />
      {" / "}
      <Span locale={Locale.JAPANESE} />
    </div>
  );
};
