import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/Components/ui/select";
import { languageAtom } from "@/Lib/atoms";
import { Locale } from "@/types/index.d";
import { t } from "i18next";
import { useAtom } from "jotai";

export const LangSwitch = () => {
	//TODO: langのAtomを用意して、onValueChangeで切り替える。
	const [lang, setLang] = useAtom(languageAtom);
	return (
		<Select
			defaultValue={lang}
			onValueChange={(event: string) => {
				setLang(event as Locale);
			}}
		>
			<SelectTrigger id="locale" className="w-fit font-bold h-10">
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
