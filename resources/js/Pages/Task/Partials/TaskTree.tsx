import { TaskItem } from "./TaskItem";
import { useAtom, useAtomValue } from "jotai";
import { taskAtomsAtom, tasksAtom } from "@/Lib/atoms";
import { useEffect } from "react";

export const TaskTree = () => {
    const [taskAtoms, dispatch] = useAtom(taskAtomsAtom);
    const [tasks] = useAtom(tasksAtom);

    // const aaa = () => {
    //     const dataMap = new Map(
    //         tasks.map((item, index) => [
    //             item.id,
    //             [useAtomValue(taskAtoms[index]), item],
    //         ])
    //     );
    //     console.log(dataMap);
    // };

    // const createHTMLList = () => {
    //     // IDをキーとしたオブジェクトを作成し、データを格納
    //     const dataMap = new Map(tasks.map((item) => [item.id, item]));

    //     // ルート要素を取得し、HTML文字列を生成する関数
    //     function createElement(id: number) {
    //         const item = dataMap.get(id);
    //         const children = tasks.filter(
    //             (child) => child.parent_task_id === id
    //         );

    //         const li = (
    //             <TaskItem
    //                 taskAtom={taskAtom}
    //                 remove={() => dispatch({ type: "remove", atom: taskAtom })}
    //                 key={`${taskAtom}`}
    //             ></TaskItem>
    //         );

    //         if (children.length > 0) {
    //             const ul = document.createElement("ul");
    //             children.forEach((child) => {
    //                 ul.appendChild(createElement(child.id));
    //             });
    //             li.appendChild(ul);
    //         }

    //         return li;
    //     }

    //     // ルート要素から開始
    //     const rootElements = data.filter((item) => item.parent_id === null);
    //     const ul = document.createElement("ul");
    //     rootElements.forEach((root) => {
    //         ul.appendChild(createElement(root.id));
    //     });

    //     return ul;
    // };

    return (
        <ul className="flex flex-col list-inside list-disc dark:text-gray-200">
            aaaaaa
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
