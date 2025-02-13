import { Tag } from "@/types";
import { TableCell, TableRow } from "../../../Components/ui/table";
import { Checkbox } from "../../../Components/ui/checkbox";
import { formatDate } from "@/Lib/formatDate";
import { CheckedState } from "@radix-ui/react-checkbox";
export const TagTableRow = ({
    tag,
    onClick,
    onCheckedChange,
}: {
    tag: Tag;
    onClick: React.MouseEventHandler<HTMLTableRowElement>;
    onCheckedChange: (checked: CheckedState) => void;
}) => {
    return (
        <TableRow
            className="px-2 cursor-pointer hover:bg-stone-100"
            onClick={onClick}
        >
            <TableCell>
                <Checkbox onCheckedChange={onCheckedChange}></Checkbox>
            </TableCell>
            <TableCell className="text-primary">
                <span className="px-1 font-thin rounded border-1 border-primary bg-stone-100 mr-2">
                    #
                </span>
                {tag.name}
            </TableCell>
            <TableCell>{formatDate(tag.created_at)}</TableCell>
            <TableCell>{formatDate(tag.updated_at)}</TableCell>
        </TableRow>
    );
};
