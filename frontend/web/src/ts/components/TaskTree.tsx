import { currentTagAtom, splitedTasksAtom, tasksAtom } from "@/lib/atoms";
import type { Task } from "@/types";
import { t } from "i18next";
import { type PrimitiveAtom, useAtom, useAtomValue } from "jotai";
import type React from "react";
import { useMemo } from "react";
import { TaskItem } from "../pages/task/partials/TaskItem";

export const TaskTree = () => {
  const currentTag = useAtomValue(currentTagAtom);
  const [taskAtoms, dispatch] = useAtom(splitedTasksAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);
  // const api = useApi();

  // useEffect(() => {
  //   // currentTagがある場合、そのTagに合わせてTasksを更新する
  //   if (currentTag) {
  //     api.get(route("api.tasks.tags.index", currentTag.id), (response) => {
  //       setTasks(response.data.tasks || []);
  //     });
  //   }
  // }, [currentTag, api, setTasks]);

  const taskMap = useMemo(
    () => new Map(tasks.map((item, index) => [item.id, taskAtoms[index]])),
    [tasks, taskAtoms],
  );

  const createTaskItem = (
    taskAtom: PrimitiveAtom<Task>,
    children?: React.ReactNode,
  ) => {
    return (
      <TaskItem
        taskAtom={taskAtom}
        remove={() => dispatch({ type: "remove", atom: taskAtom })}
        insert={(newTask: Task) =>
          dispatch({
            type: "insert",
            value: newTask,
          })
        }
        key={taskAtom.toString()}
      >
        {children}
      </TaskItem>
    );
  };

  const createTaskList = () => {
    // ルート要素を取得し、HTML文字列を生成する関数
    const createRecursiveTask = (task_id: number) => {
      const taskAtom = taskMap.get(task_id);
      if (!taskAtom) return;

      const children = tasks.filter(
        (child) => child.parent_task_id === task_id,
      );

      if (children.length > 0) {
        // サブタスクを持つタスクの生成
        const items = children
          .map((child) => createRecursiveTask(child.id))
          .reverse(); // idの数値の大きいもの（より直近に作られたものを上に配置する）
        return createTaskItem(
          taskAtom,
          <ul className="ml-[6px] flex border-collapse list-inside flex-col border-stone-400 border-l-2 border-dashed dark:text-gray-200">
            {items}
          </ul>,
        );
      }

      //サブタスクを持たないタスクの生成
      return createTaskItem(taskAtom);
    };

    const rootTasks = tasks.filter((item) => item.parent_task_id === null);
    const taskItems = rootTasks.map((root) => createRecursiveTask(root.id));
    return <>{taskItems}</>;
  };

  return (
    <ul className="flex list-inside flex-col dark:text-gray-200">
      {tasks.length ? (
        createTaskList()
      ) : (
        <li className="list-none pl-4">{t("task.noTasks")}</li>
      )}
    </ul>
  );
};
