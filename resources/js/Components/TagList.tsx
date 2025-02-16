import { useApi } from "@/Hooks/useApi";
import { currentTagAtom, tagsAtom } from "@/Lib/atoms";
import type { Tag } from "@/types";

import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { TagItem } from "./TagItem";

export const TagList = ({ _tags }: { _tags?: Tag[] }) => {
	const [tags, setTags] = useAtom(tagsAtom);
	const setCurrentTag = useSetAtom(currentTagAtom);
	const api = useApi();

	useEffect(() => {
		if (_tags) {
			setTags(_tags);
			return;
		}

		api.get(route("api.tags.index"), (response) => {
			setTags(response.data.tags);
		});
	}, [_tags, setTags, api]);

	const handleTagClicked = useCallback(
		(index: number) => {
			setCurrentTag(tags[index]);
		},
		[tags, setCurrentTag],
	);
	return (
		<>
			<h3 className="font-bold text-base sticky border-primary border-b-2 p-2 top-0">
				Latest Tags
			</h3>
			<ul className="text-primary font-bold">
				{tags
					? tags.map((tag, index) => {
							return (
								<TagItem
									tag={tag}
									key={tag.id}
									onClick={() => handleTagClicked(index)}
								/>
							);
						})
					: "No Tags There"}
			</ul>
		</>
	);
};
