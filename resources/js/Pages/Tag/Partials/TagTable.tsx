import { Checkbox } from "@/Components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/Components/ui/table";
import { checkableTagsAtom } from "@/Lib/atoms";
import { TagTableRow } from "@/Pages/Tag/Partials/TagTableRow";
import type { Tag, TagWithCheck } from "@/types";
import { useAtom } from "jotai";
import { useCallback } from "react";

export const TagTable = ({ tags }: { tags: Tag[] }) => {
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
			<TableCaption>A list of your tags</TableCaption>
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
					<TableHead>Tag Name</TableHead>
					<TableHead>Created At</TableHead>
					<TableHead>Updated At</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{checkableTags.map((tag) => {
					return (
						<TagTableRow
							key={tag.id}
							tag={tag}
							onClick={() => {}}
							onCheckedChange={(checked) => {
								handleBodyChecked({ id: tag.id, checked } as TagWithCheck);
							}}
						/>
					);
				})}
			</TableBody>
		</Table>
	);
};
