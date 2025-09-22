import { initializeI18n } from "@/scripts/i18n";
import type { Locale } from "@/scripts/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchAuthQueryOptions } from "../queries";
import { useLangStore } from "@store/lang";

// 多言語化初期化
initializeI18n("en" as Locale);

export const LangManager = () => {
  const langStoreValue = useLangStore((s) => s.language);
  const { data: auth } = useQuery(fetchAuthQueryOptions);

  useEffect(() => {
    const lang = (auth?.user?.locale ?? langStoreValue ?? "en") as Locale;
    initializeI18n(lang);
    document.documentElement.lang = lang;
  }, [auth, langStoreValue]);

  return <></>;
};
