import { atom, PrimitiveAtom } from "jotai";
import { Task, TimeEntry } from "../types";
import { atomFamily, splitAtom } from "jotai/utils";

// TaskAtom

export const tasksAtom = atom<Task[]>([]);
tasksAtom.debugLabel = "tasksAtom";
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

export const splitedTasksAtom = splitAtom(tasksAtom);
splitedTasksAtom.debugLabel = "splitedTasks";

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

// TimerAtom
export const currentTimeEntryAtom = atom<Partial<TimeEntry> | null>(null);
export const currentTimeEntryIdAtom = atom(
    (get) => get(currentTimeEntryAtom)?.id,
    (get, set, newValue: number) =>
        set(currentTimeEntryAtom, {
            ...get(currentTimeEntryAtom),
            id: newValue,
        })
);
currentTimeEntryAtom.debugLabel = "currentTimeEntry";
export const isTimerRunningAtom = atom<boolean>(false);
export const isWorkTimeAtom = atom<boolean>(true);
