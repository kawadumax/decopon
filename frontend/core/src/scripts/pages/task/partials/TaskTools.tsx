import AddItemInput from "@components/AddItemInput";
import { useTagStore } from "@store/tag";
import { useTranslation } from "react-i18next";
import { useTaskMutations } from "@/scripts/queries";
import type { CreateTaskVariables } from "@/scripts/queries";

export const TaskTools = () => {
  const { t } = useTranslation();
  const currentTag = useTagStore((s) => s.currentTag);
  const { createTask } = useTaskMutations(currentTag?.id);

  return (
    <div className="m-4 mb-0 flex justify-start">
      <AddItemInput
        placeholder={t("task.add")}
        buttonText={t("common.add")}
        onAddItem={(title: string) => {
          const newTask: CreateTaskVariables = {
            title,
            description: "New Task Description",
            completed: false,
            parent_task_id: undefined,
            tags: currentTag ? [currentTag] : [], // 現在のタグを設定
          };
          createTask.mutate(newTask);
        }}
      />
    </div>
  );
};
