import { useApi } from "@/Hooks/useApi";
import { toEmblorTags } from "@/Lib/utils";
import type { Task } from "@/types";
import type { Tag } from "@/types";
import { type Tag as EmblorTag, TagInput } from "emblor";
import { useAtom, useAtomValue } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

export const TaskEditableTagList = ({
	taskAtom,
}: {
	taskAtom: PrimitiveAtom<Task>;
}) => {
	const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
	const [currentTask, setCurrentTask] = useAtom(taskAtom);
	const [tags, setTags] = useState<EmblorTag[]>(toEmblorTags(currentTask.tags));
	const api = useApi();

	const handleTagAdded = useCallback(
		(tagText: string) => {
			console.log("tag added", tagText);
			api.post(
				route("api.tags.relation.post"),
				{
					task_id: currentTask.id,
					name: tagText,
				},
				(response) => {
					console.log(response);
					setCurrentTask((prev) => {
						return {
							...prev,
							tags: [...prev.tags, response.data.tag],
						};
					});
				},
			);
		},
		[api, currentTask, setCurrentTask],
	);

	const handleTagRemoved = useCallback(
		(tagText: string) => {
			console.log("tag removed", tagText, currentTask);
			api.delete(
				route("api.tags.relation.destroy"),
				{
					task_id: currentTask.id,
					name: tagText,
				},
				(response) => {
					console.log(response);
					setCurrentTask((prev) => {
						const newTags = prev.tags
							? prev.tags.filter((tag) => tag.name === response.data.tag.name)
							: [];
						return {
							...prev,
							tags: [...newTags],
						};
					});
				},
			);
		},
		[currentTask, api, setCurrentTask],
	);

	useEffect(() => {
		setTags(toEmblorTags(currentTask.tags));
	}, [currentTask]);

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
