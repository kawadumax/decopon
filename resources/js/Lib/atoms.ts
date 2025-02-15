import type { Tag } from "@/types";
import { type PrimitiveAtom, atom } from "jotai";
import { atomFamily, atomWithStorage, splitAtom } from "jotai/utils";
import type {
	Log,
	TagCheckable,
	TagWithCheck,
	Task,
	TimeEntry,
} from "../types";

// TaskAtom

export const tasksAtom = atom<Task[]>([]);

// あるタスクを根とするタスクツリーを取得するためのAtom
export const taskTreeAtomFamily = atomFamily((rootTaskId: number) =>
	atom((get) => {
		const tasks = get(tasksAtom);
		const rootTask = tasks.find((task) => task.id === rootTaskId);

		if (!rootTask) return [];

		const collectLeaves = (root: Task): Task[] => {
			const children = tasks.filter((task) => task.parent_task_id === root.id);
			if (children.length > 0) {
				return [root].concat(children.flatMap((child) => collectLeaves(child)));
			}
			return [root];
		};

		return collectLeaves(rootTask);
	}),
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
	currentTaskAtom,
);
export const taskSelectorAtom = atom(
	(get) => get(currentTaskBaseAtom),
	(
		_get,
		set,
		newCurrentTaskAtom: PrimitiveAtom<Task> | PrimitiveAtom<null>,
	) => {
		set(currentTaskBaseAtom, newCurrentTaskAtom);
	},
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
	{ getOnInit: true },
);
export const currentTimeEntryAtom = atom(
	(get) => get(timeStateAtom)?.currentTimeEntry,
	(get, set, newValue: Partial<TimeEntry> | undefined) => {
		set(timeStateAtom, {
			...get(timeStateAtom),
			currentTimeEntry: newValue,
		});
	},
);
export const currentTimeEntryIdAtom = atom(
	(get) => get(currentTimeEntryAtom)?.id,
	(get, set, newValue: number) =>
		set(currentTimeEntryAtom, {
			...get(currentTimeEntryAtom),
			id: newValue,
		}),
);
export const elapsedTimeAtom = atom(
	(get) => get(timeStateAtom)?.elapsedTime,
	(get, set, newValue: number) => {
		set(timeStateAtom, {
			...get(timeStateAtom),
			elapsedTime: newValue,
		});
	},
);

export const isTimerRunningAtom = atom<boolean>(false);
export const isWorkTimeAtom = atom<boolean>(true);

const _workTimeAtom = atom<number>(25 * 60 * 1000);
const _breakTimeAtom = atom<number>(10 * 60 * 1000);
export const workTimeAtom = atom(
	(get) => get(_workTimeAtom),
	(_get, set, newValue: number) => set(_workTimeAtom, newValue * 60 * 1000),
);
export const breakTimeAtom = atom(
	(get) => get(_breakTimeAtom),
	(_get, set, newValue: number) => set(_breakTimeAtom, newValue * 60 * 1000),
);

// Logs atom

export const logsAtom = atom<Log[]>([]);

// tags atom

export const tagsAtom = atom<Tag[]>([]);
export const splitedTagsAtom = splitAtom(tagsAtom);
export const currentTagAtom = atom<Tag | null>(null);
const tagChecksAtom = atom<TagWithCheck[]>([]);
export const checkableTagsAtom = atom(
	(get): TagCheckable[] => {
		const tagChecks = get(tagChecksAtom);
		const tags = get(tagsAtom);
		return tags.map((tag) => {
			// Find the corresponding TagCheck entry for the current Tag
			const tagCheck = tagChecks.find((check) => check.id === tag.id);

			return {
				...tag,
				checked: tagCheck ? tagCheck.checked : false,
			};
		});
	},

	(
		get,
		set,
		update: { action: "add" | "remove" | "reset"; tags: TagWithCheck[] },
	) => {
		const tagChecks = get(tagChecksAtom);
		set(tagChecksAtom, (prev): TagWithCheck[] => {
			switch (update.action) {
				case "add": {
					// 重複を避けて新しいタグを追加
					const filteredAdd = prev.filter(
						(v) => !update.tags.some((nv) => nv.id === v.id),
					);
					return [...filteredAdd, ...update.tags];
				}

				case "remove":
					// 指定されたタグを削除
					return prev.filter((v) => !update.tags.some((nv) => nv.id === v.id));

				case "reset":
					// 全てのタグをリセット
					return [];

				default:
					// 'default' を使わないようにするので、このケースは不要
					return prev; // すでにすべてのケースを網羅しているので、これは実行されない
			}
		});
	},
);

// TODO: tagsAtomからderiveして、直近いくつかを取得するもの。
// TagListに使う予定
export const latestTagAtom = atom<Tag[]>([]);
