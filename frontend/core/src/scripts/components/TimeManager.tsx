import {
  completeDecoponSessionMutationOptions,
  interruptDecoponSessionMutationOptions,
} from "@/scripts/queries/decoponSession";
import { DecoponSessionStatus } from "@/scripts/types";
import { useTimerStore } from "@store/timer";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import TimerWorker from "../workers/TimerWorker?worker&inline";

/**
 * 時間を進めるWebWorkerの処理を発行及び購読を行う
 * @returns Fragment
 */
export const TimeManager = () => {
  const [timerWorker, setTimeWorker] = useState<Worker | null>(null);
  const timerState = useTimerStore((s) => s.timerState);
  const setTimerState = useTimerStore((s) => s.setTimerState);
  const timeSpan = useTimerStore((s) => s.getSpan());
  const { mutate: interruptDecoponSession } = useMutation(
    interruptDecoponSessionMutationOptions,
  );
  const { mutate: completeDecoponSession } = useMutation(
    completeDecoponSessionMutationOptions,
  );

  useEffect(() => {
    // Workerのインスタンスを作成
    const worker = new TimerWorker();
    setTimeWorker(worker);

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "TICK") {
        setTimerState((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1000,
        }));
      }
    };

    return () => {
      worker.terminate();
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
    // タイマーが終わった時

    if (timerState.isWorkTime) {
      // Worktimeの時: completeミューテーション -> onSuccessで状態更新
      completeDecoponSession();
    } else {
      // BreakTimeの時: ローカルで状態更新
      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
        isWorkTime: true,
        elapsedTime: 0,
        startedTime: null,
      }));
    }
  }, [
    timerState.elapsedTime,
    timerState.isWorkTime,
    timeSpan,
    setTimerState,
    completeDecoponSession,
  ]);

  /**
   * タイマー状態: In-Progress時にページが閉じられた場合、
   * タイマー状態をInterruptedにして、サーバーにリクエストを送る
   *  */
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (
        timerState.decoponSession?.status === DecoponSessionStatus.InProgress
      ) {
        event.preventDefault(); // 離脱時に進行中のタイマーがある場合、アラートが表示される
        // interruptミューテーション -> onSuccessで停止状態へ
        interruptDecoponSession();
      }
    },
    [timerState, interruptDecoponSession],
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleBeforeUnload]);

  return <></>;
};
