import { TaskItem } from "./TaskItem";
import { useAtom, useAtomValue } from "jotai";
import { taskAtomsAtom, tasksAtom } from "@/Lib/atoms";
import { useEffect, useMemo } from "react";
import { Task } from "@/types";

export const TaskTree = () => {
    const [taskAtoms, dispatch] = useAtom(taskAtomsAtom);
    const [tasks] = useAtom(tasksAtom);

    const taskMap = useMemo(
        () => new Map(tasks.map((item, index) => [item.id, taskAtoms[index]])),
        [tasks]
    );

    // あるタスクとそのタスクを祖先に持つタスクを全て取得する
    const collectLeaves = (root: Task): Task[] => {
        const children = tasks.filter(
            (task) => task.parent_task_id === root.id
        );
        if (children.length > 0) {
            return [root].concat(
                children.flatMap((child) => collectLeaves(child))
            );
        } else {
            return [root];
        }
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
                const items = children.map((child) =>
                    createRecursiveTask(child.id)
                );
                return (
                    <TaskItem
                        taskAtom={taskAtom}
                        remove={() =>
                            dispatch({ type: "remove", atom: taskAtom })
                        }
                        key={`${taskAtom}`}
                    >
                        <ul className="ml-[6px] flex flex-col list-inside dark:text-gray-200 border-l-2 border-stone-400 border-collapse border-dashed">
                            {items}
                        </ul>
                    </TaskItem>
                );
            } else {
                //サブタスクを持たないタスクの生成
                return (
                    <TaskItem
                        taskAtom={taskAtom}
                        remove={() =>
                            dispatch({ type: "remove", atom: taskAtom })
                        }
                        key={`${taskAtom}`}
                    ></TaskItem>
                );
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
