import { Button } from "@/Components/ui/button";
import { useApi } from "@/Hooks/useApi";
import { checkableTagsAtom, tagsAtom } from "@/Lib/atoms";
import { Plus, Trash } from "@mynaui/icons-react";
import { useAtom } from "jotai";
import { useCallback } from "react";

export const TagTools = () => {
	const [, setTags] = useAtom(tagsAtom);
	const [checkableTags, setCheckableTags] = useAtom(checkableTagsAtom);
	const api = useApi();

	// const handleAddNewTag = () => {
	// 	const tagTemplate = {
	// 		name: "",
	// 	};

	// 	api.post(route("api.tags.store"), tagTemplate, (response) => {
	// 		// setTags((prev) => [...prev, response.data.tagk]);
	// 		// 今は何もしない
	// 		console.log("tags.store called");
	// 	});
	// };

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
			},
		);
	}, [checkableTags, api, setCheckableTags, setTags]);

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
			{/* <Button onClick={handleAddNewTag}>
                <Plus />
            </Button> */}
		</div>
	);
};
