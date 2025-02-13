import { Tag } from "@/types";

export const TagItem = ({
    tag,
    onClick,
}: {
    tag: Tag;
    onClick: React.MouseEventHandler<HTMLLIElement>;
}) => {
    return (
        <li
            className="px-2 cursor-pointer hover:bg-stone-100"
            onClick={onClick}
        >
            <span className="px-1 font-thin rounded border-1 border-primary bg-stone-100 mr-2">
                #
            </span>
            {tag.name}
        </li>
    );
};
