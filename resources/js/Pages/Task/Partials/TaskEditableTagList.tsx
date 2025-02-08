import { useApi } from "@/Hooks/useApi";
import { taskSelectorAtom } from "@/Lib/atoms";
import { Task } from "@/types";
import { Tag as EmblorTag, TagInput } from "emblor";
import { Tag } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";

export const TaskEditableTagList = ({ currentTask }: { currentTask: Task }) => {
    const [tags, setTags] = useState<EmblorTag[]>([]);
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
    const api = useApi();

    useEffect(() => {
        console.log("setTag called", tags);
        if (!tags.length) return;
        api.post(
            route("api.tags.multiple"),
            {
                task_id: currentTask.id,
                tags: tags.map((tag) => {
                    return { name: tag.text } as Partial<Tag>;
                }),
            },
            (response) => {
                console.log(response);
            }
        );
    }, [tags]);

    return (
        <TagInput
            placeholder="Add a tag"
            tags={tags}
            styleClasses={{
                input: "w-full shadow-none",
                tag: {
                    body: "h-6 p-2",
                    closeButton: "p-1 pr-0 hover:text-primary-foreground",
                },
                inlineTagsContainer: "border-0 px-0",
            }}
            setTags={setTags}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
            size={"sm"}
            shape={"pill"}
            variant={"primary"}
        />
    );
};
