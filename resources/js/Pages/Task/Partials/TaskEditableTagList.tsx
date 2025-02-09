import { useApi } from "@/Hooks/useApi";
import { taskSelectorAtom } from "@/Lib/atoms";
import { Task } from "@/types";
import { Tag as EmblorTag, TagInput } from "emblor";
import { Tag } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { PrimitiveAtom } from "jotai";
import { log } from "console";

export const TaskEditableTagList = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {

    const toEmblorTags = (tags: Tag[]) => {
        if (tags?.length) return tags.map((tag) => { return { id: `${tag.id}`, text: tag.name } })
        return []
    };
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
    const [currentTask, setCurrentTask] = useAtom(taskAtom);
    console.log("currentTask is", currentTask);
    const [tags, setTags] = useState<EmblorTag[]>(toEmblorTags(currentTask.tags));
    const api = useApi();

    const handleTagAdded = useCallback((tagText: string) => {
        console.log("tag added", tagText);
        api.post(
            route("api.tags.relation.post"),
            {
                task_id: currentTask.id,
                name: tagText
            },
            (response) => {
                console.log(response);
                setCurrentTask((prev) => {
                    return {
                        ...prev,
                        tags: [...prev.tags, response.data.tag],
                    }
                })
            }
        );
    }, [api, currentTask]);

    const handleTagRemoved = useCallback((tagText: string) => {
        console.log("tag removed", tagText, currentTask);
        api.delete(
            route("api.tags.relation.destroy"),
            {
                task_id: currentTask.id,
                name: tagText
            },
            (response) => {
                console.log(response);
                setCurrentTask((prev) => {
                    const newTags = prev.tags.filter(
                        (tag) => tag.name == response.data.tag.name
                    );
                    return {
                        ...prev,
                        tags: [...newTags],
                    }
                })
            }
        );
    }, [currentTask, api])

    return (
        <TagInput
            placeholder="Add a tag"
            styleClasses={{
                input: "w-full shadow-none",
                tag: {
                    body: "h-6 p-2",
                    closeButton: "p-1 pr-0 hover:text-primary-foreground",
                },
                inlineTagsContainer: "border-0 px-0",
            }}
            tags={tags}
            setTags={setTags}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
            onTagAdd={handleTagAdded}
            onTagRemove={handleTagRemoved}
            size={"sm"}
            shape={"pill"}
            variant={"primary"}
        />
    );
};
