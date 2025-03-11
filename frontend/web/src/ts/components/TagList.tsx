import { useApi } from "@/hooks/useApi";
import { currentTagAtom, tagsAtom } from "@/lib/atoms";
import type { Tag } from "@/types";

import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TagItem } from "./TagItem";

export const TagList = ({ _tags }: { _tags?: Tag[] }) => {
	const { t } = useTranslation();
	const [tags, setTags] = useAtom(tagsAtom);
	const [currentTag, setCurrentTag] = useAtom(currentTagAtom);
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
			<h3 className="font-bold text-base sticky p-2 top-0">
				{t("tag.latestTags")}
			</h3>
			<ul
				className="text-primary font-bold flex-1"
				onClick={() => {
					setCurrentTag(null);
				}}
				onKeyDown={() => {
					// setCurrentTag(null)
				}}
			>
				{tags.length ? (
					tags.map((tag, index) => {
						return (
							<TagItem
								tag={tag}
								key={tag.id}
								onClick={(event) => {
									event.stopPropagation();
									handleTagClicked(index);
								}}
							/>
						);
					})
				) : (
					<span className="text-foreground p-2 font-normal">
						{t("tag.noTags")}
					</span>
				)}
			</ul>
		</>
	);
};
