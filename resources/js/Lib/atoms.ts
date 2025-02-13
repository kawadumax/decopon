import { atom, PrimitiveAtom } from "jotai";
import { Log, Task, TimeEntry } from "../types";
import { atomFamily, atomWithStorage, splitAtom } from "jotai/utils";
import { Tag } from "@/types";

// TaskAtom

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

export const splitedTasksAtom = splitAtom(tasksAtom);

const currentTaskAtom: PrimitiveAtom<Task> | PrimitiveAtom<null> = atom(null);
const currentTaskBaseAtom = atom<PrimitiveAtom<Task> | PrimitiveAtom<null>>(
    currentTaskAtom
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

interface TimerState {
    elapsedTime: number;
    currentTimeEntry?: Partial<TimeEntry>;
}

const timeStateAtom = atomWithStorage<TimerState>(
    "timerState",
    { elapsedTime: 0, currentTimeEntry: undefined },
    undefined,
    { getOnInit: true }
);
export const currentTimeEntryAtom = atom(
    (get) => get(timeStateAtom)?.currentTimeEntry,
    (get, set, newValue: Partial<TimeEntry> | undefined) => {
        set(timeStateAtom, {
            ...get(timeStateAtom),
            currentTimeEntry: newValue,
        });
    }
);
export const currentTimeEntryIdAtom = atom(
    (get) => get(currentTimeEntryAtom)?.id,
    (get, set, newValue: number) =>
        set(currentTimeEntryAtom, {
            ...get(currentTimeEntryAtom),
            id: newValue,
        })
);
export const elapsedTimeAtom = atom(
    (get) => get(timeStateAtom)?.elapsedTime,
    (get, set, newValue: number) => {
        set(timeStateAtom, {
            ...get(timeStateAtom),
            elapsedTime: newValue,
        });
    }
);

export const isTimerRunningAtom = atom<boolean>(false);
export const isWorkTimeAtom = atom<boolean>(true);

const _workTimeAtom = atom<number>(25 * 60 * 1000);
const _breakTimeAtom = atom<number>(10 * 60 * 1000);
export const workTimeAtom = atom(
    (get) => get(_workTimeAtom),
    (_get, set, newValue: number) => set(_workTimeAtom, newValue * 60 * 1000)
);
export const breakTimeAtom = atom(
    (get) => get(_breakTimeAtom),
    (_get, set, newValue: number) => set(_breakTimeAtom, newValue * 60 * 1000)
);

// Logs atom

export const logsAtom = atom<Log[]>([]);

// tags atom

export const tagsAtom = atom<Tag[]>([]);
export const splitedTagsAtom = splitAtom(tagsAtom);
export const currentTagAtom = atom<Tag | null>(null);

// TODO: tagsAtomからderiveして、直近いくつかを取得するもの。
// TagListに使う予定
export const latestTagAtom = atom<Tag[]>([]);
