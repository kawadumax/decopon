import { initializeI18n } from "@/scripts/i18n";
import { Locale } from "@/scripts/types/index.d";
import { languageAtom } from "@lib/atoms";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { fetchAuth } from "../lib/auth";

// 多言語化初期化
initializeI18n(Locale.ENGLISH);

export const LangManager = () => {
  const langAtomValue = useAtomValue(languageAtom);
  const { data: auth } = useQuery({
    queryKey: ["auth"],
    queryFn: fetchAuth,
  });

  useEffect(() => {
    const lang =
      auth?.user?.preference?.locale ?? langAtomValue ?? String(Locale.ENGLISH);
    initializeI18n(lang);
    document.documentElement.lang = lang;
  }, [auth, langAtomValue]);

  return <></>;
};
