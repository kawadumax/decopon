import { TagService } from "@/scripts/api/services/TagService";
import AddItemInput from "@components/AddItemInput";
import { Button } from "@components/ui/button";
import { Trash } from "@mynaui/icons-react";
import { t } from "i18next";
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Tag } from "@/scripts/types";
import { setTags } from "@/scripts/queries";
import { useTagStore } from "@store/tag";

export const TagTools = () => {
  const [checkableTags, resetTagChecks] = [
    useTagStore((s) => s.getCheckableTags()),
    useTagStore((s) => s.resetTagChecks),
  ];
  const setCurrentTag = useTagStore((s) => s.setCurrentTag);

  const addTagMutation = useMutation<Tag, unknown, string>({
    mutationFn: (newTagName: string) => TagService.store({ name: newTagName }),
    onSuccess: (data) => {
      setTags((prev: Tag[] = []) => [...prev, data]);
    },
  });

  const deleteTagMutation = useMutation<void, unknown, number[]>({
    mutationFn: (ids: number[]) => TagService.destroyMany({ tag_ids: ids }),
    onSuccess: (_data, variables) => {
      setTags((prev: Tag[] = []) =>
        prev.filter((tag) => !variables.some((id) => id === tag.id)),
      );
      resetTagChecks();
      setCurrentTag(undefined);
    },
  });

  const handleAddNewTag = useCallback(
    (newTagName: string) => {
      addTagMutation.mutate(newTagName);
    },
    [addTagMutation],
  );

  const handleDeleteTag = useCallback(() => {
    const deleteTagIds = checkableTags
      .filter((tag) => tag.checked)
      .map((tag) => tag.id);
    deleteTagMutation.mutate(deleteTagIds);
  }, [checkableTags, deleteTagMutation]);

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
