import { useQuery } from "@tanstack/react-query";
import { fetchTagsQueryOptions } from "@/scripts/queries";
import { useCallback } from "react";
import { useTagStore } from "@store/tag";
import { useTranslation } from "react-i18next";
import { TagItem } from "./TagItem";
import type { Tag } from "@/scripts/types";

export const TagList = () => {
  const { t } = useTranslation();
  const { data: tags = [] } = useQuery(fetchTagsQueryOptions);
  const [currentTag, setCurrentTag] = [
    useTagStore((s) => s.currentTag),
    useTagStore((s) => s.setCurrentTag),
  ];

  const handleTagClicked = useCallback(
    (tag: Tag) => {
      setCurrentTag(tag);
    },
    [setCurrentTag],
  );
  return (
    <>
      <h3 className="sticky top-0 p-2 font-bold text-base">
        {t("tag.latestTags")}
      </h3>
      <ul
        className="flex-1 font-bold text-primary"
        onClick={() => {
          setCurrentTag(undefined);
        }}
        onKeyDown={() => {
          // setCurrentTag(null)
        }}
      >
        {tags.length ? (
          tags.map((tag) => {
            return (
              <TagItem
                tag={tag}
                key={tag.id}
                onClick={(event) => {
                  event.stopPropagation();
                  handleTagClicked(tag);
                }}
              />
            );
          })
        ) : (
          <span className="p-2 font-normal text-foreground">
            {t("tag.noTags")}
          </span>
        )}
      </ul>
    </>
  );
};
