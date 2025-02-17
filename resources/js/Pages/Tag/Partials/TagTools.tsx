import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { useApi } from "@/Hooks/useApi";
import { checkableTagsAtom, currentTagAtom, tagsAtom } from "@/Lib/atoms";
import { Plus, Trash } from "@mynaui/icons-react";
import { useAtom, useSetAtom } from "jotai";
import type React from "react";
import { useCallback, useState } from "react";

export const TagTools = () => {
	const [, setTags] = useAtom(tagsAtom);
	const [checkableTags, setCheckableTags] = useAtom(checkableTagsAtom);
	const setCurrentTag = useSetAtom(currentTagAtom);
	const [newTagName, setNewTagName] = useState("");
	const api = useApi();

	const handleInputName = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setNewTagName(event.target.value);
		},
		[],
	);

	const handleAddNewTag = useCallback(() => {
		const tagTemplate = {
			name: newTagName,
		};

		api.post(route("api.tags.store"), tagTemplate, (response) => {
			setTags((prev) => [...prev, response.data.tag]);
			setNewTagName("");
		});
	}, [newTagName, api.post, setTags]);

	const handleDeleteTag = useCallback(() => {
		const deleteTagIds = checkableTags
			.filter((tag) => tag.checked)
			.map((tag) => tag.id);
		api.delete(
			route("api.tags.destroy"),
			{ tag_ids: deleteTagIds },
			(response) => {
				if (!response.data.success) return;
				// tagからcheckedTagに含まれるtagを消す
				setTags((prev) => {
					const filtered = prev.filter(
						(tag) => !deleteTagIds.some((id) => id === tag.id),
					);
					return [...filtered];
				});
				// checkedTagをリセットする
				setCheckableTags({ action: "reset", tags: [] });
				setCurrentTag(null);
			},
		);
	}, [checkableTags, api, setCheckableTags, setTags, setCurrentTag]);

	return (
		<div className="flex justify-start gap-4 my-4">
			<Button
				variant={"destructive"}
				className="bg-red-600"
				onClick={handleDeleteTag}
			>
				<Trash />
				Delete
			</Button>
			<div className="flex justify-start gap-0">
				<Input placeholder="New Tag Name" onChange={handleInputName} />
				<Button onClick={handleAddNewTag}>
					<Plus />
				</Button>
			</div>
		</div>
	);
};
