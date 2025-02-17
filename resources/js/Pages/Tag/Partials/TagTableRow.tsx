import { currentTagAtom } from "@/Lib/atoms";
import { formatDate } from "@/Lib/utils";
import { cn } from "@/Lib/utils";
import type { Tag, TagCheckable } from "@/types";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Checkbox } from "../../../Components/ui/checkbox";
import { TableCell, TableRow } from "../../../Components/ui/table";
export const TagTableRow = ({
	tag,
	// onClick,
	onCheckedChange,
}: {
	tag: TagCheckable;
	// onClick: React.MouseEventHandler<HTMLTableRowElement>;
	onCheckedChange: (checked: CheckedState) => void;
}) => {
	const [currentTag, setCurrentTag] = useAtom(currentTagAtom);
	const onClicked = useCallback(() => {
		// tagをcurrentTagにsetする
		setCurrentTag(tag);
	}, [tag, setCurrentTag]);

	const currentBgColor = useMemo(() => {
		if (currentTag === tag) {
			return " bg-stone-200";
		}
		return "";
	}, [currentTag, tag]);
	return (
		<TableRow
			className={`px-2 cursor-pointer hover:bg-stone-100${currentBgColor}`}
			onClick={onClicked}
		>
			<TableCell>
				<Checkbox onCheckedChange={onCheckedChange} checked={tag.checked} />
			</TableCell>
			<TableCell className="text-primary font-bold">
				<span className="px-1 font-thin rounded border-1 border-primary bg-stone-100 mr-2">
					#
				</span>
				{tag.name}
				{` (${tag.tasks?.length || 0})`}
			</TableCell>
			<TableCell className="font-mono">{formatDate(tag.created_at)}</TableCell>
			<TableCell className="font-mono">{formatDate(tag.updated_at)}</TableCell>
		</TableRow>
	);
};
