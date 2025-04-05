import { initializeI18n } from "@/i18n";
import { languageAtom } from "@/lib/atoms";
import { Locale } from "@/types/index.d";
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
