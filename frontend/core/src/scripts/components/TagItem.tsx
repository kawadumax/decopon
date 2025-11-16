import type { Tag } from "@/scripts/types";

export const TagItem = ({
  tag,
  onClick,
  taskCount,
}: {
  tag: Tag;
  onClick: React.MouseEventHandler<HTMLLIElement>;
  taskCount?: number;
}) => {
  return (
    <li
      className="cursor-pointer px-2 hover:bg-surface-muted"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          // onClick expects a mouse event, but keyboard operation should trigger the same behavior
          onClick(event as unknown as React.MouseEvent<HTMLLIElement>);
        }
      }}
    >
      <span className="mr-2 rounded border-1 border-primary bg-surface-muted px-1 font-thin">
        #
      </span>
      <span>{tag.name}</span>
      {typeof taskCount === "number" && (
        <span className="ml-1 font-normal text-muted-foreground text-sm">
          ({taskCount})
        </span>
      )}
    </li>
  );
};
