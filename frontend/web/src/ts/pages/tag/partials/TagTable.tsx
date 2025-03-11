import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCaption,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { checkableTagsAtom } from "@/lib/atoms";
import { TagTableRow } from "@/pages/tag/partials/TagTableRow";
import type { Tag, TagWithCheck } from "@/types";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export const TagTable = ({ tags }: { tags: Tag[] }) => {
	const { t } = useTranslation();
	const [checkableTags, setCheckableTags] = useAtom(checkableTagsAtom);
	const handleHeadChecked = useCallback(
		(checked: boolean) => {
			// ヘッダーのチェックボタンが押されたら、表示されているすべてのタグをcheckableTags入れる
			setCheckableTags({
				action: "add",
				tags: tags.map((tag) => {
					return { id: tag.id, checked };
				}),
			});
		},
		[tags, setCheckableTags],
	);

	const handleBodyChecked = useCallback(
		(checkedTag: TagWithCheck) => {
			setCheckableTags({ action: "add", tags: [checkedTag] });
		},
		[setCheckableTags],
	);
	return (
		<Table>
			<TableCaption>{t("tag.table.caption")}</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>
						{
							<Checkbox
								onCheckedChange={(checked) =>
									handleHeadChecked(checked as boolean)
								}
							/>
						}
					</TableHead>
					<TableHead>{t("tag.table.header.name")}</TableHead>
					<TableHead>{t("tag.table.header.createdAt")}</TableHead>
					<TableHead>{t("tag.table.header.updatedAt")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{checkableTags.map((tag) => {
					return (
						<TagTableRow
							key={tag.id}
							tag={tag}
							onCheckedChange={(checked) => {
								handleBodyChecked({
									id: tag.id,
									checked,
								} as TagWithCheck);
							}}
						/>
					);
				})}
			</TableBody>
		</Table>
	);
};
