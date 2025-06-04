import { initializeI18n } from "@/scripts/i18n";
import { Locale } from "@/scripts/types/index.d";
import { languageAtom } from "@lib/atoms";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

// 多言語化初期化
initializeI18n(Locale.ENGLISH);

export const LangManager = () => {
  const lang = useAtomValue(languageAtom) || Locale.ENGLISH;

  useEffect(() => {
    initializeI18n(lang);
    document.documentElement.lang = lang;
  }, [lang]);
  return <></>;
};
