import { TaskItem } from "./TaskItem";
import { PrimitiveAtom, useAtom, useAtomValue } from "jotai";
import { splitedTasksAtom, tasksAtom } from "@/Lib/atoms";
import React, { useMemo } from "react";
import { Task } from "@/types";

export const TaskTree = () => {
    const [taskAtoms, dispatch] = useAtom(splitedTasksAtom);
    const tasks = useAtomValue(tasksAtom);

    const taskMap = useMemo(
        () => new Map(tasks.map((item, index) => [item.id, taskAtoms[index]])),
        [tasks, taskAtoms]
    );

    const createTaskItem = (
        taskAtom: PrimitiveAtom<Task>,
        children?: React.ReactNode
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
            const taskAtom = taskMap.get(task_id)!;
            const children = tasks.filter(
                (child) => child.parent_task_id === task_id
            );

            if (children.length > 0) {
                // サブタスクを持つタスクの生成
                const items = children
                    .map((child) => createRecursiveTask(child.id))
                    .reverse(); // idの数値の大きいもの（より直近に作られたものを上に配置する）
                return createTaskItem(
                    taskAtom,
                    <ul className="ml-[6px] flex flex-col list-inside dark:text-gray-200 border-l-2 border-stone-400 border-collapse border-dashed">
                        {items}
                    </ul>
                );
            } else {
                //サブタスクを持たないタスクの生成
                return createTaskItem(taskAtom);
            }
        };

        // ルート要素から開始
        const rootTasks = tasks.filter((item) => item.parent_task_id === null);
        const taskItems = rootTasks.map((root) => createRecursiveTask(root.id));
        return <>{taskItems}</>;
    };

    return (
        <ul className="flex flex-col list-inside dark:text-gray-200">
            {createTaskList()}
        </ul>
    );
};
