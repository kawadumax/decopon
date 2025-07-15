import { callApi } from "@/scripts/lib/apiClient";
import { logger } from "@/scripts/lib/utils";
import type { Task } from "@/scripts/types";
import AddItemInput from "@components/AddItemInput";
import { currentTagAtom } from "@lib/atoms";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { route } from "ziggy-js";

export const TaskTools = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentTag = useAtomValue(currentTagAtom);
  const queryKey = currentTag ? ["tasks", currentTag.id] : ["tasks"];

  const handleAddNewTask = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const newTaskWithTag = {
        ...newTask,
        tags: currentTag ? [currentTag.id] : [], // 現在のタグを設定
      };
      return await callApi("post", route("api.tasks.store"), newTaskWithTag);
    },
    onMutate: (newTask) => {
      logger("Mutating new task:", newTask);
      // オプティミスティック更新のためにキャッシュを更新
      queryClient.cancelQueries({ queryKey }); // 同時リフェッチをキャンセル
      const previousTasks = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: Task[]) => [
        ...old,
        { ...newTask, id: -1 },
      ]); // 仮IDで追加
      return { previousTasks }; // ロールバック用に保存
    },
    onSuccess: (response) => {
      logger(response);
      // 成功時、サーバーから返されたデータをキャッシュに置き換え（仮IDを本物に）
      queryClient.setQueryData(queryKey, (old: Task[]) =>
        old.map((task) => (task.id === -1 ? response.task : task)),
      );
    },
    onError: (error, _newTask, context) => {
      logger("Error adding task:", error);
      // 失敗時ロールバック
      queryClient.setQueryData(queryKey, context?.previousTasks);
    },
  });

  return (
    <div className="m-4 mb-0 flex justify-start">
      <AddItemInput
        placeholder={t("task.add")}
        buttonText={t("common.add")}
        onAddItem={(title: string) => {
          const newTask = {
            title,
            description: "New Task Description",
            completed: false,
            parent_task_id: undefined,
            tags: currentTag ? [currentTag] : [], // 現在のタグを設定
          };
          handleAddNewTask.mutate(newTask);
        }}
      />
    </div>
  );
};
