import { Locale } from "@/types/index.d";
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
		lng: lang || Locale.ENGLISH,
		fallbackLng: Locale.ENGLISH,
		interpolation: {
			escapeValue: false,
		},
	});
};

export default i18n;
