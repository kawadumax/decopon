import { Tag, TagInput } from "emblor";
import { useState } from "react";

export const TaskEditableTagList = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

    return (
        <TagInput
            placeholder="Add a tag"
            tags={tags}
            styleClasses={{
                input: "w-full border-solid border-b-1 shadow-none focus-visible:ring-0",
                tag: {
                    body: "h-6 p-2",
                    closeButton: "p-1 pr-0 hover:text-primary-foreground",
                },
                inlineTagsContainer: "border-0 px-0",
            }}
            setTags={(newTags) => {
                setTags(newTags);
            }}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
            size={"sm"}
            shape={"pill"}
            variant={"primary"}
        />
    );
};
