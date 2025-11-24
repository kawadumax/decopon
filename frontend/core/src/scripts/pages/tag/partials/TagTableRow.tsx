import type { TagCheckable } from "@/scripts/types";
import { Direction, StackCmdType, useStackView } from "@components/StackView";
import { formatISODate } from "@lib/utils";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useCallback, useMemo } from "react";
import { useTagStore } from "@store/tag";
import { Checkbox } from "../../../components/ui/checkbox";
import { TableCell, TableRow } from "../../../components/ui/table";
import { cn } from "@/scripts/lib/utils";
export const TagTableRow = ({
  tag,
  // onClick,
  taskCount,
  onCheckedChange,
}: {
  tag: TagCheckable;
  // onClick: React.MouseEventHandler<HTMLTableRowElement>;
  taskCount: number;
  onCheckedChange: (checked: CheckedState) => void;
}) => {
  const [currentTag, setCurrentTag] = [
    useTagStore((s) => s.currentTag),
    useTagStore((s) => s.setCurrentTag),
  ];
  const [_state, dispatch] = useStackView();

  const onClicked = useCallback(() => {
    // tagをcurrentTagにsetする
    setCurrentTag(tag);
  }, [tag, setCurrentTag]);

  const currentBgColor = useMemo(() => {
    if (currentTag?.id === tag.id) {
      return "bg-surface-elevated";
    }
    return "";
  }, [currentTag?.id, tag.id]);
  return (
    <TableRow
      className={cn(
        "cursor-pointer px-2 hover:bg-surface-muted dark:hover:bg-surface-muted",
        currentBgColor,
      )}
      onClick={onClicked}
    >
      <TableCell>
        <Checkbox onCheckedChange={onCheckedChange} checked={tag.checked} />
      </TableCell>
      <TableCell className="font-bold text-primary">
        <span className="mr-2 rounded border-1 border-primary bg-surface-muted dark:bg-surface-muted px-1 font-thin">
          #
        </span>
        <button
          type="button"
          onClick={() => {
            dispatch({
              type: "push",
              payload: {
                type: StackCmdType.Push,
                to: "detail",
                direction: Direction.Left,
              },
            });
          }}
        >
          {tag.name}
        </button>
      </TableCell>
      <TableCell>{taskCount}</TableCell>
      <TableCell className="font-mono">
        {formatISODate(tag.created_at)}
      </TableCell>
      <TableCell className="font-mono">
        {formatISODate(tag.updated_at)}
      </TableCell>
    </TableRow>
  );
};
