import { TaskItem } from "./TaskItem";
import { useAtom, useAtomValue } from "jotai";
import { taskAtomsAtom, tasksAtom } from "@/Lib/atoms";
import { useEffect, useMemo } from "react";

export const TaskTree = () => {
    const [taskAtoms, dispatch] = useAtom(taskAtomsAtom);
    const [tasks] = useAtom(tasksAtom);

    const taskMap = useMemo(() => (
        new Map(tasks.map((item, index) => [item.id, taskAtoms[index]])))
    ,[tasks])

    const createTaskList = () => {

        // // ルート要素を取得し、HTML文字列を生成する関数
        const createElement = (id: number) => {
            const taskAtom = taskMap.get(id)!;
            const children = tasks.filter(
                (child) => child.parent_task_id === id
            );

            const taskItem = (
                <TaskItem
                    taskAtom={taskAtom}
                    remove={() => dispatch({ type: "remove", atom: taskAtom })}
                    key={`${taskAtom}`}
                ></TaskItem>
            );

            if (children.length > 0) {

                const items = children.map((child) => (
                    createElement(child.id)
                ));
                return (<>
                    {taskItem}
                    <ul className="flex flex-col list-inside list-disc dark:text-gray-200">
                        {items}
                    </ul>
                </>)

            }

            return taskItem;
        }

        // ルート要素から開始
        // const rootElements = data.filter((item) => item.parent_id === null);
        // const ul = document.createElement("ul");
        // rootElements.forEach((root) => {
        //     ul.appendChild(createElement(root.id));
        // });

        return <></>;
    };

    return (
        <ul className="flex flex-col list-inside list-disc dark:text-gray-200">
            {createTaskList()}
            {/* {taskAtoms.map((taskAtom) => (
                <TaskItem
                    taskAtom={taskAtom}
                    remove={() => dispatch({ type: "remove", atom: taskAtom })}
                    key={`${taskAtom}`}
                ></TaskItem>
            ))} */}
        </ul>
    );
};
