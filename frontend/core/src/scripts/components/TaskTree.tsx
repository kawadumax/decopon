import type { Task } from "@/scripts/types";
import { useTaskList, useTasks } from "@/scripts/queries";
import { useTagStore } from "@store/tag";
import { t } from "i18next";
import type React from "react";
import { useMemo } from "react";
import { TaskItem } from "../pages/task/partials/TaskItem";

const createTaskItem = (task: Task, children?: React.ReactNode) => {
  return (
    <TaskItem task={task} key={task.id.toString()}>
      {children}
    </TaskItem>
  );
};

const createTaskList = (
  rootTasks: Task[],
  taskChildrenMap: Map<number | null, Task[]>,
) => {
  // ルート要素を取得し、HTML文字列を生成する関数
  const createRecursiveTask = (task: Task) => {
    const children = taskChildrenMap.get(task.id) ?? [];

    //サブタスクを持たないタスクの生成
    if (children.length === 0) {
      return createTaskItem(task);
    }

    // サブタスクを持つタスクの生成
    const items = children
      .map((child) => createRecursiveTask(child))
      .reverse(); // idの数値の大きいもの（より直近に作られたものを上に配置する）
    return createTaskItem(
      task,
      <ul className="ml-[6px] flex border-collapse list-inside flex-col border-stone-400 border-l-2 border-dashed hover:border-l-primary hover:border-solid dark:text-gray-200">
        {items}
      </ul>,
    );
  };

  const taskItems = rootTasks.map((root) => createRecursiveTask(root));
  return <>{taskItems}</>;
};

export const TaskTree = () => {
  const currentTag = useTagStore((s) => s.currentTag);
  const tagId = currentTag?.id;
  const { isLoading } = useTasks(tagId);
  const tasks = useTaskList(tagId);

  const { taskChildrenMap, rootTasks } = useMemo(() => {
    const taskChildren = new Map<number | null, Task[]>();
    const taskMap = new Map<number, Task>();

    for (const task of tasks) {
      taskMap.set(task.id, task);
      const parentId = task.parent_task_id ?? null;
      const siblings = taskChildren.get(parentId);
      if (siblings) {
        siblings.push(task);
      } else {
        taskChildren.set(parentId, [task]);
      }
    }

    const roots = tasks.filter((task) => {
      const parentId = task.parent_task_id;
      return parentId == null || !taskMap.has(parentId);
    });

    return { taskChildrenMap: taskChildren, rootTasks: roots };
  }, [tasks]);

  if (tasks.length === 0 && !isLoading) {
    return <li className="list-none pl-4">{t("task.noTasks")}</li>;
  }

  return (
    <ul className="flex list-inside flex-col dark:text-gray-200">
      {createTaskList(rootTasks, taskChildrenMap)}
    </ul>
  );
};
