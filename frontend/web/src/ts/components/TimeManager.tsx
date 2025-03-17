import { useTimeEntryApi } from "@/hooks/useTimeEntryApi";
import { getSpanAtom, timerStateAtom } from "@/lib/atoms";
import { type TimeEntry, TimeEntryStatus } from "@/types/index.d";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import TimerWorker from "../Workers/TimerWorker.ts?worker";

/**
 * 時間を進めるWebWorkerの処理を発行及び購読を行う
 * @returns Fragment
 */
export const TimeManager = () => {
  const [timerWorker, setTimeWorker] = useState<Worker | null>(null);
  const [timerState, setTimerState] = useAtom(timerStateAtom);
  const timeSpan = useAtomValue(getSpanAtom);
  const { interruptTimeEntry, completeTimeEntry } = useTimeEntryApi();

  useEffect(() => {
    // Workerのインスタンスを作成
    const timerWorker = new TimerWorker();
    setTimeWorker(timerWorker);

    timerWorker.onmessage = (e) => {
      if (e.data.type === "TICK") {
        setTimerState((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1000,
        }));
      }
    };

    return () => {
      timerWorker.terminate();
    };
  }, [setTimerState]);

  /**
   * タイマーの作動状態を監視する
   */
  useEffect(() => {
    if (timerState.isRunning) {
      timerWorker?.postMessage({ type: "START" });
    } else {
      timerWorker?.postMessage({ type: "STOP" });
    }
  }, [timerState.isRunning, timerWorker]);

  /**
   * elapsedTimeを監視して、フォーカスタイムの完了を監視する。
   */
  useEffect(() => {
    if (timerState.elapsedTime < timeSpan) return;
    let currentCycles = timerState.cycles.count || 0;

    // タイマーが終わった時

    if (timerState.isWorkTime) {
      // Worktimeの時
      completeTimeEntry();
      currentCycles++;
    }

    // WorkTimeとBreakTimeを切り替える
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      isWorkTime: !prev.isWorkTime,
      elapsedTime: 0,
      startedTime: null,
      cycles: { date: prev.cycles.date, count: currentCycles },
    }));
  }, [
    timerState.elapsedTime,
    timerState.isWorkTime,
    timerState.cycles,
    timeSpan,
    setTimerState,
    completeTimeEntry,
  ]);

  /**
   * タイマー状態: In-Progress時にページが閉じられた場合、
   * タイマー状態をInterruptedにして、サーバーにリクエストを送る
   *  */
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (timerState.timeEntry?.status === TimeEntryStatus.InProgress) {
        event.preventDefault(); // 離脱時に進行中のタイマーがある場合、アラートが表示される
        interruptTimeEntry();
        setTimerState((prev) => {
          return {
            ...prev,
            timeEntry: {
              ...(timerState.timeEntry as TimeEntry),
              status: TimeEntryStatus.Interrupted,
            },
            isRunning: false,
          };
        });
      }
    },
    [timerState, setTimerState, interruptTimeEntry],
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleBeforeUnload]);

  return <></>;
};
