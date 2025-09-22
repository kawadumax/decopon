import type { Locale } from "@/scripts/types";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const resources = {
  en: { translation: en },
  ja: { translation: ja },
};

export const initializeI18n = (lang: Locale) => {
  i18n.use(initReactI18next).init({
    resources,
    lng: lang || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
};

export default i18n;
