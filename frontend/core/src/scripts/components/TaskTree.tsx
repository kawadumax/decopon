import type { Task } from "@/scripts/types";
import { currentTagAtom } from "@lib/atoms";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useAtomValue } from "jotai";
import type React from "react";
import { useEffect } from "react";
import { route } from "ziggy-js";
import { TaskItem } from "../pages/task/partials/TaskItem";
import { callApi } from "../queries/apiClient";

const createTaskItem = (task: Task, children?: React.ReactNode) => {
  return (
    <TaskItem task={task} key={task.id.toString()}>
      {children}
    </TaskItem>
  );
};

const createTaskList = (tasks: Task[]) => {
  // ルート要素を取得し、HTML文字列を生成する関数
  const createRecursiveTask = (task: Task) => {
    const children = tasks.filter((child) => child.parent_task_id === task.id);

    //サブタスクを持たないタスクの生成
    if (children.length === 0) {
      return createTaskItem(task);
    }

    // サブタスクを持つタスクの生成
    const items = children.map((child) => createRecursiveTask(child)).reverse(); // idの数値の大きいもの（より直近に作られたものを上に配置する）
    return createTaskItem(
      task,
      <ul className="ml-[6px] flex border-collapse list-inside flex-col border-stone-400 border-l-2 border-dashed hover:border-l-primary hover:border-solid dark:text-gray-200">
        {items}
      </ul>,
    );
  };

  const rootTasks = tasks.filter((item) => item.parent_task_id == null); // nullとundefinedの両方を考慮
  const taskItems = rootTasks.map((root) => createRecursiveTask(root));
  return <>{taskItems}</>;
};

export const TaskTree = () => {
  const currentTag = useAtomValue(currentTagAtom);
  const queryKey = currentTag ? ["tasks", currentTag.id] : ["tasks"];
  const queryClient = useQueryClient();

  // CurrentTagが変更されたときに、タスクのキャッシュを無効化
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // 全タスクの取得
  const { data: allTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const data = await callApi("get", route("api.tasks.index"));
      return data.tasks ?? [];
    },
  });

  // タグに基づくタスクの取得
  const { data: filteredTasks } = useQuery({
    queryKey: ["tasks", currentTag?.id],
    queryFn: async () => {
      const data = await callApi(
        "get",
        route("api.tasks.tags.index", currentTag?.id),
      );
      return data.tasks ?? [];
    },
    enabled: !!currentTag,
  });

  const tasks: Task[] = currentTag ? filteredTasks : allTasks;

  console.log("TaskTree tasks:", tasks);

  if (!tasks) {
    return <li className="list-none pl-4">Loading...</li>;
  }

  if (tasks.length === 0) {
    return <li className="list-none pl-4">{t("task.noTasks")}</li>;
  }

  return (
    <ul className="flex list-inside flex-col dark:text-gray-200">
      {createTaskList(tasks)}
    </ul>
  );
};
