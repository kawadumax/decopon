import { callApi } from "@/scripts/queries/apiClient";
import AddItemInput from "@components/AddItemInput";
import { Button } from "@components/ui/button";
import { checkableTagsAtom, currentTagAtom, tagsAtom } from "@lib/atoms";
import { Trash } from "@mynaui/icons-react";
import { t } from "i18next";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { route } from "ziggy-js";

export const TagTools = () => {
  const [, setTags] = useAtom(tagsAtom);
  const [checkableTags, setCheckableTags] = useAtom(checkableTagsAtom);
  const setCurrentTag = useSetAtom(currentTagAtom);

  const handleAddNewTag = useCallback(
    (newTagName: string) => {
      const tagTemplate = {
        name: newTagName,
      };
      callApi("post", route("api.tags.store"), tagTemplate).then((data) => {
        setTags((prev) => [...prev, data.tag]);
      });
    },
    [setTags],
  );

  const handleDeleteTag = useCallback(() => {
    const deleteTagIds = checkableTags
      .filter((tag) => tag.checked)
      .map((tag) => tag.id);
    callApi("delete", route("api.tags.destroy"), {
      tag_ids: deleteTagIds,
    }).then((data) => {
      if (!data.success) return;
      // tagからcheckedTagに含まれるtagを消す
      setTags((prev) => {
        const filtered = prev.filter(
          (tag) => !deleteTagIds.some((id) => id === tag.id),
        );
        return [...filtered];
      });
      // checkedTagをリセットする
      setCheckableTags({ action: "reset", tags: [] });
      setCurrentTag(undefined);
    });
  }, [checkableTags, setCheckableTags, setTags, setCurrentTag]);

  return (
    <div className="my-4 flex justify-start gap-4">
      <Button
        variant={"destructive"}
        className="bg-red-600"
        onClick={handleDeleteTag}
      >
        <Trash />
        {t("common.delete")}
      </Button>
      <AddItemInput
        placeholder={t("tag.placeholderInput")}
        onAddItem={handleAddNewTag}
        buttonText={t("common.add")}
      />
    </div>
  );
};
