import { Locale } from "@/types/index.d";
import { Select } from "@headlessui/react";
import {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@radix-ui/react-select";
import { t } from "i18next";

export const LangSwitch = () => {
    //TODO: langのAtomを用意して、onValueChangeで切り替える。
	return (
		<Select
			defaultValue={}
			onValueChange={(e) => {
				setData("locale", e as Locale);
			}}
		>
			<SelectTrigger id="locale">
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
