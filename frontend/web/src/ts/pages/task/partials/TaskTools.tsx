import AddItemInput from "@/components/AddItemInput";
import { useApi } from "@/hooks/useApi";
import { tasksAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export const TaskTools = () => {
  const { t } = useTranslation();
  const [, setTasks] = useAtom(tasksAtom);
  const api = useApi();

  const handleAddNewTask = useCallback(
    (title: string) => {
      const taskTemplate = {
        title,
        description: "New Task Description",
        completed: false,
        parent_task_id: null,
      };

      api.post(route("api.tasks.store"), taskTemplate, (response) => {
        console.log(response);
        setTasks((prev) => [...prev, response.task]);
      });
    },
    [api, setTasks],
  );

  return (
    <div className="m-4 mb-0 flex justify-start">
      <AddItemInput
        placeholder={t("task.add")}
        buttonText={t("common.add")}
        onAddItem={handleAddNewTask}
      />
    </div>
  );
};
