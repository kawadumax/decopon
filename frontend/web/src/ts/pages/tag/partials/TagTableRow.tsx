import { currentTagAtom } from "@/lib/atoms";
import { formatISODate } from "@/lib/utils";
import type { TagCheckable } from "@/types";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { Checkbox } from "../../../components/ui/checkbox";
import { TableCell, TableRow } from "../../../components/ui/table";
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
      return "bg-stone-200";
    }
    return "";
  }, [currentTag, tag]);
  return (
    <TableRow
      className={`cursor-pointer px-2 hover:bg-stone-100 ${currentBgColor}`}
      onClick={onClicked}
    >
      <TableCell>
        <Checkbox onCheckedChange={onCheckedChange} checked={tag.checked} />
      </TableCell>
      <TableCell className="font-bold text-primary">
        <span className="mr-2 rounded border-1 border-primary bg-stone-100 px-1 font-thin">
          #
        </span>
        {tag.name}
        {` (${tag.tasks?.length || 0})`}
      </TableCell>
      <TableCell className="font-mono">
        {formatISODate(tag.created_at)}
      </TableCell>
      <TableCell className="font-mono">
        {formatISODate(tag.updated_at)}
      </TableCell>
    </TableRow>
  );
};
