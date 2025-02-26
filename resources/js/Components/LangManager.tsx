import { initializeI18n } from "@/i18n";
import { languageAtom } from "@/Lib/atoms";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

export const LangManager = () => {
	const lang = useAtomValue(languageAtom);

	useEffect(() => {
		initializeI18n(lang);
		document.documentElement.lang = lang;
	}, [lang]);
	return <></>;
};
