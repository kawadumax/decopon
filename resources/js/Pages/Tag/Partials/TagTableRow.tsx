import { formatDate } from "@/Lib/formatDate";
import type { Tag, TagCheckable } from "@/types";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect } from "react";
import { Checkbox } from "../../../Components/ui/checkbox";
import { TableCell, TableRow } from "../../../Components/ui/table";
export const TagTableRow = ({
	tag,
	onClick,
	onCheckedChange,
}: {
	tag: TagCheckable;
	onClick: React.MouseEventHandler<HTMLTableRowElement>;
	onCheckedChange: (checked: CheckedState) => void;
}) => {
	return (
		<TableRow
			className="px-2 cursor-pointer hover:bg-stone-100"
			onClick={onClick}
		>
			<TableCell>
				<Checkbox onCheckedChange={onCheckedChange} checked={tag.checked} />
			</TableCell>
			<TableCell className="text-primary">
				<span className="px-1 font-thin rounded border-1 border-primary bg-stone-100 mr-2">
					#
				</span>
				{tag.name}
				{` (${tag.tasks?.length || 0})`}
			</TableCell>
			<TableCell>{formatDate(tag.created_at)}</TableCell>
			<TableCell>{formatDate(tag.updated_at)}</TableCell>
		</TableRow>
	);
};
