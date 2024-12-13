import { atom, PrimitiveAtom } from "jotai";
import { Task } from "../types";
import { atomFamily, splitAtom } from "jotai/utils";
// const countAtom = atom(0);

// const countryAtom = atom("Japan");

// const citiesAtom = atom(["Tokyo", "Kyoto", "Osaka"]);

// const animeAtom = atom([
//     {
//         title: "Ghost in the Shell",
//         year: 1995,
//         watched: true,
//     },
//     {
//         title: "Serial Experiments Lain",
//         year: 1998,
//         watched: false,
//     },
// ]);

export const tasksAtom = atom<Task[]>([]);

// あるタスクを根とするタスクツリーを取得するためのAtom
export const taskTreeAtomFamily = atomFamily((rootTaskId: number) =>
    atom((get) => {
        const tasks = get(tasksAtom);
        const rootTask = tasks.find((task) => task.id === rootTaskId);

        if (!rootTask) return [];

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

        return collectLeaves(rootTask);
    })
);

// いくつかのTaskをまとめて更新するためのAtom
export const tasksBatchAtom = atom(null, (get, set, newTasks: Task[]) => {
    // 現在のタスクの状態を取得
    const currentTasks = get(tasksAtom);
    // 新しいタスクの配列を作成
    const updatedTasks = currentTasks.map((task) => {
        const newTask = newTasks.find((newTask) => newTask.id === task.id);
        return newTask ? newTask : task;
    });
    // タスクの状態を更新
    set(tasksAtom, updatedTasks);
});

export const taskAtomsAtom = splitAtom(tasksAtom);

const currentTaskBaseAtom = atom<PrimitiveAtom<Task> | PrimitiveAtom<null>>(
    atom(null)
);
export const taskSelectorAtom = atom(
    (get) => get(currentTaskBaseAtom),
    (
        _get,
        set,
        newCurrentTaskAtom: PrimitiveAtom<Task> | PrimitiveAtom<null>
    ) => {
        set(currentTaskBaseAtom, newCurrentTaskAtom);
    }
);
