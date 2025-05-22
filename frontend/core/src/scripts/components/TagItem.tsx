import type { Tag } from "@/scripts/types";

export const TagItem = ({
  tag,
  onClick,
}: {
  tag: Tag;
  onClick: React.MouseEventHandler<HTMLLIElement>;
}) => {
  return (
    <li
      className="cursor-pointer px-2 hover:bg-stone-100"
      onClick={onClick}
      onKeyDown={(event) => {}}
    >
      <span className="mr-2 rounded border-1 border-primary bg-stone-100 px-1 font-thin">
        #
      </span>
      {tag.name}
    </li>
  );
};
