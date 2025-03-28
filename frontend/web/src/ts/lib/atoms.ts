import { Locale, type Tag } from "@/types/index.d";
import { type PrimitiveAtom, atom } from "jotai";
import { atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { atomWithStorage, loadable, splitAtom } from "jotai/utils";
import type {
  Log,
  TagCheckable,
  TagWithCheck,
  Task,
  TimeEntry,
} from "../types";
import { callApi } from "./apiClient";
import { getToday } from "./utils";

export const updateQueryDataAtom = atom(
  null,
  (
    get,
    _set,
    {
      queryKey,
      updater,
    }: {
      queryKey: unknown[];
      updater: (prev: unknown) => unknown;
    },
  ) => {
    const queryClient = get(queryClientAtom);
    const current = queryClient.getQueryData(queryKey);
    const next = updater(current);
    queryClient.setQueryData(queryKey, next);
  },
);

// TaskAtom

// export const tasksAtom = atom<Task[]>([]); // 元々こうだった
export const tasksAtom = atomWithQuery<Task[]>(() => ({
  queryKey: ["tasks"],
  queryFn: async (): Promise<Task[]> => {
    try {
      const res = await callApi("get", route("api.tasks.index"));
      console.log(res);
      return res;
    } catch (error) {
      console.log(error);
      return [];
    }
  },
  placeholderData: [],
}));

export const setTasksAtom = atom(null, (_get, set, newTasks: Task[]) => {
  set(updateQueryDataAtom, {
    queryKey: ["tasks"],
    updater: (_prev) => newTasks,
  });
});

// あるタスクを根とするタスクツリーを取得するためのAtom
// export const taskTreeAtomFamily = atomFamily((rootTaskId: number) =>
//   atom(async (get) => {
//     const tasks = get(waitForAll([tasksAtom]));
//     const rootTask = tasks.find((task) => task.id === rootTaskId);

//     if (!rootTask) return [];

//     const collectLeaves = (root: Task): Task[] => {
//       const children = tasks.filter((task) => task.parent_task_id === root.id);
//       if (children.length > 0) {
//         return [root].concat(children.flatMap((child) => collectLeaves(child)));
//       }
//       return [root];
//     };

//     return collectLeaves(rootTask);
//   }),
// );

// いくつかのTaskをまとめて更新するためのAtom
export const tasksBatchAtom = atom(null, (get, set, newTasks: Task[]) => {
  // 現在のタスクの状態を取得
  const currentTasks = get(tasksAtom).data as Task[];
  // 新しいタスクの配列を作成
  const updatedTasks = currentTasks.map((task) => {
    const newTask = newTasks.find((newTask) => newTask.id === task.id);
    return newTask ? newTask : task;
  });
  // タスクの状態を更新
  set(setTasksAtom, updatedTasks);
});

const loadableTasksAtom = loadable(tasksAtom);

const syncTasksArrayAtom = atom(
  (get) => {
    const result = get(loadableTasksAtom);

    if (result.state === "hasData") {
      const queryResult = result.data;
      const tasks = queryResult.data;
      return tasks ? tasks : [];
    }
    return [];
  },
  (_get, set, newTasks: Task[]) => {
    set(setTasksAtom, newTasks);
  },
);

export const splitedTasksAtom = splitAtom(
  syncTasksArrayAtom,
  (item) => item.id,
);

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
