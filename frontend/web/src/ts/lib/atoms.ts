import { Locale, type Tag } from "@/types/index.d";
import { type PrimitiveAtom, atom } from "jotai";
import { atomWithStorage, splitAtom } from "jotai/utils";
import type {
  Log,
  TagCheckable,
  TagWithCheck,
  Task,
  TimeEntry,
} from "../types";
import { createResourceListAtom } from "./atomHelpers";
import { getToday } from "./utils";

// TaskAtom

export const tasksAtom = createResourceListAtom<Task>("tasks");
export const splitedTasksAtom = splitAtom(tasksAtom, (item) => item.id);

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

const currentTaskAtom: PrimitiveAtom<Task> | PrimitiveAtom<undefined> =
  atom(undefined);
const currentTaskBaseAtom = atom<
  PrimitiveAtom<Task> | PrimitiveAtom<undefined>
>(currentTaskAtom);
export const taskSelectorAtom = atom(
  (get) => get(currentTaskBaseAtom),
  (
    _get,
    set,
    newCurrentTaskAtom: PrimitiveAtom<Task> | PrimitiveAtom<undefined>,
  ) => {
    set(currentTaskBaseAtom, newCurrentTaskAtom);
  },
);

// TimerAtom

interface TimerState {
  elapsedTime: number;
  startedTime: number | null;
  isWorkTime: boolean;
  isRunning: boolean;
  cycles: {
    date: string;
    count: number;
  };
  timeEntry?: TimeEntry;
}

export const timerStateAtom = atomWithStorage<TimerState>(
  "timerState",
  {
    elapsedTime: 0,
    startedTime: null,
    timeEntry: undefined,
    isWorkTime: true,
    isRunning: false,
    cycles: {
      date: getToday(),
      count: 0,
    },
  },
  undefined,
  { getOnInit: true },
);

export const isRunningAtom = atom(
  (get) => {
    return get(timerStateAtom).isRunning;
  },
  (get, set, isRunning: boolean) => {
    set(timerStateAtom, { ...get(timerStateAtom), isRunning });
  },
);

export const isWorkTimeAtom = atom(
  (get) => {
    return get(timerStateAtom).isWorkTime;
  },
  (get, set, isWorkTime: boolean) => {
    set(timerStateAtom, { ...get(timerStateAtom), isWorkTime });
  },
);

export const cyclesAtom = atom(
  (get) => {
    return get(timerStateAtom).cycles;
  },
  (get, set, cycles: { date: string; count: number }) => {
    set(timerStateAtom, { ...get(timerStateAtom), cycles });
  },
);

export const getSpanAtom = atom((get) => {
  const isWorkTime = get(isWorkTimeAtom);
  return isWorkTime ? get(workTimeAtom) : get(breakTimeAtom);
});

export const remainTimeAtom = atom(
  (get) => {
    return get(getSpanAtom) - get(timerStateAtom).elapsedTime;
  },
  (get, set, newTime: number) => {
    const timerState = get(timerStateAtom);
    set(timerStateAtom, {
      ...timerState,
      elapsedTime: get(getSpanAtom) - newTime,
    });
  },
);

export const resetRemainTimeAtom = atom(null, (get, set, command: string) => {
  // if (command !== "RESET") return;
  switch (command) {
    case "RESET":
      set(timerStateAtom, {
        ...get(timerStateAtom),
        elapsedTime: 0,
      });
      break;
    case "ZERO":
      set(timerStateAtom, {
        ...get(timerStateAtom),
        elapsedTime: get(getSpanAtom),
      });
      break;
    default:
      break;
  }
});

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

export const tagsAtom = createResourceListAtom<Tag>("tags");
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
    _get,
    set,
    update: { action: "add" | "remove" | "reset"; tags: TagWithCheck[] },
  ) => {
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

export const languageAtom = atom<Locale>(Locale.ENGLISH);
