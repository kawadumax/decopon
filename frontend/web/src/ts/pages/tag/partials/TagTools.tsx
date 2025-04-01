import AddItemInput from "@/components/AddItemInput";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { checkableTagsAtom, currentTagAtom, tagsAtom } from "@/lib/atoms";
import { Trash } from "@mynaui/icons-react";
import { t } from "i18next";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";

export const TagTools = () => {
  const [, setTags] = useAtom(tagsAtom);
  const [checkableTags, setCheckableTags] = useAtom(checkableTagsAtom);
  const setCurrentTag = useSetAtom(currentTagAtom);
  const api = useApi();

  const handleAddNewTag = useCallback(
    (newTagName: string) => {
      const tagTemplate = {
        name: newTagName,
      };

      api.post(route("api.tags.store"), tagTemplate, (data) => {
        setTags((prev) => [...prev, data.tag]);
      });
    },
    [api.post, setTags],
  );

  const handleDeleteTag = useCallback(() => {
    const deleteTagIds = checkableTags
      .filter((tag) => tag.checked)
      .map((tag) => tag.id);
    api.delete(route("api.tags.destroy"), { tag_ids: deleteTagIds }, (data) => {
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
      setCurrentTag(null);
    });
  }, [checkableTags, api, setCheckableTags, setTags, setCurrentTag]);

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
