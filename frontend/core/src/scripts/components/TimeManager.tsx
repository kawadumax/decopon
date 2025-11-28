import {
  completeDecoponSessionMutationOptions,
  interruptDecoponSessionMutationOptions,
} from "@/scripts/queries/decoponSession";
import { DecoponSessionStatus } from "@/scripts/types";
import {
  hasNativeNotificationAdapter,
  sendNativeNotification,
} from "@/scripts/lib/nativeNotification";
import { formatTime } from "@/scripts/lib/utils";
import { useTimerStore } from "@store/timer";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TimerWorker from "../workers/TimerWorker?worker&inline";

/**
 * 時間を進めるWebWorkerの処理を発行及び購読を行う
 * @returns Fragment
 */
export const TimeManager = () => {
  const { t } = useTranslation();
  const [timerWorker, setTimeWorker] = useState<Worker | null>(null);
  const timerState = useTimerStore((s) => s.timerState);
  const setTimerState = useTimerStore((s) => s.setTimerState);
  const timeSpan = useTimerStore((s) => s.getSpan());
  const previousTimerState = useRef({
    isRunning: timerState.isRunning,
    isWorkTime: timerState.isWorkTime,
  });
  const { mutate: interruptDecoponSession } = useMutation(
    interruptDecoponSessionMutationOptions,
  );
  const { mutate: completeDecoponSession } = useMutation(
    completeDecoponSessionMutationOptions,
  );

  const permissionPrompt = useCallback(() => {
    if (!hasNativeNotificationAdapter()) {
      return false;
    }

    if (typeof window === "undefined") {
      return false;
    }

    return window.confirm(t("notification.permissionPrompt"));
  }, [t]);

  const notifyTimerStarted = useCallback(async () => {
    if (!hasNativeNotificationAdapter()) {
      return;
    }

    const remaining = Math.max(timeSpan - timerState.elapsedTime, 0);

    await sendNativeNotification(
      {
        title: t("notification.timerStarted.title", {
          mode: timerState.isWorkTime
            ? t("timer.workTime")
            : t("timer.breakTime"),
        }),
        body: t("notification.timerStarted.body", {
          remaining: formatTime(remaining),
        }),
      },
      { prompt: permissionPrompt },
    );
  }, [
    permissionPrompt,
    timeSpan,
    timerState.elapsedTime,
    timerState.isWorkTime,
    t,
  ]);

  const notifyTimerFinished = useCallback(
    async (wasWorkTime: boolean) => {
      if (!hasNativeNotificationAdapter()) {
        return;
      }

      const bodyKey = wasWorkTime
        ? "notification.timerFinished.bodyWork"
        : "notification.timerFinished.bodyBreak";

      await sendNativeNotification(
        {
          title: t("notification.timerFinished.title"),
          body: t(bodyKey),
        },
        { prompt: permissionPrompt },
      );
    },
    [permissionPrompt, t],
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

  useEffect(() => {
    const previous = previousTimerState.current;
    if (!previous.isRunning && timerState.isRunning) {
      void notifyTimerStarted();
    }
    previousTimerState.current = {
      isRunning: timerState.isRunning,
      isWorkTime: timerState.isWorkTime,
    };
  }, [notifyTimerStarted, timerState.isRunning, timerState.isWorkTime]);

  /**
   * elapsedTimeを監視して、フォーカスタイムの完了を監視する。
   */
  useEffect(() => {
    if (timerState.elapsedTime < timeSpan) return;
    // タイマーが終わった時

    void notifyTimerFinished(timerState.isWorkTime);

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
    notifyTimerFinished,
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
