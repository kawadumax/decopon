import {
  abandonDecoponSessionMutationOptions,
  interruptDecoponSessionMutationOptions,
  progressDecoponSessionMutationOptions,
} from "@/scripts/queries/decoponSession";
import { formatTime } from "@lib/utils";
import { useTimerStore } from "@store/timer";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "@/scripts/lib/utils";

export const Timer = () => {
  const { t } = useTranslation();
  const isRunning = useTimerStore((s) => s.timerState.isRunning);
  const setIsRunning = useTimerStore((s) => s.setIsRunning);
  const remainTime = useTimerStore((s) => s.remainTime());
  const timeState = useTimerStore((s) => s.timerState);
  const isWorkTime = useTimerStore((s) => s.timerState.isWorkTime);
  const setIsWorkTime = useTimerStore((s) => s.setIsWorkTime);

  const { mutate: progressDecoponSession } = useMutation(
    progressDecoponSessionMutationOptions,
  );
  const { mutate: interruptDecoponSession } = useMutation(
    interruptDecoponSessionMutationOptions,
  );
  const { mutate: abandonDecoponSession } = useMutation(
    abandonDecoponSessionMutationOptions,
  );

  const startTimer = useCallback(() => {
    if (isWorkTime) {
      // progressミューテーション -> onSuccessで setIsRunning(true)
      progressDecoponSession();
    } else {
      // BreakTime開始: ミューテーション無しで即時開始
      setIsRunning(true);
    }
  }, [isWorkTime, progressDecoponSession, setIsRunning]);

  const stopTimer = useCallback(() => {
    // interruptミューテーション -> onSuccessで setIsRunning(false)
    interruptDecoponSession();
  }, [interruptDecoponSession]);

  const resetTimer = useCallback(() => {
    // abandonミューテーション -> onSuccessで停止・時間リセット
    abandonDecoponSession();
  }, [abandonDecoponSession]);

  const toggleWorkOrBreak = useCallback(() => {
    if (isRunning) return;
    setIsWorkTime(!isWorkTime);
    // isWorkTime切り替え -> abandonミューテーション
    resetTimer();
  }, [isRunning, isWorkTime, setIsWorkTime, resetTimer]);

  const completeTimer = useCallback(() => {
    // 開発用: 完了状態にするため経過時間を強制設定
    useTimerStore.getState().resetRemainTime("ZERO");
  }, []);

  return (
    <div className="flex h-full flex-col justify-center gap-2 bg-[url(/images/decopon-icon-300x300.png)] bg-center bg-white/50 bg-no-repeat bg-blend-lighten">
      <div className="self-center rounded border border-amber-400 border-solid bg-white p-2 text-center font-mono text-4xl">
        {formatTime(remainTime)}
      </div>
      <div className="flex flex-row justify-center gap-2">
        <Badge
          className={cn(
            "bg-white text-center text-black",
            isRunning ? "cursor-not-allowed" : "cursor-pointer",
          )}
          onClick={toggleWorkOrBreak}
        >
          {isWorkTime ? t("timer.workTime") : t("timer.breakTime")}
        </Badge>
        <Badge className="cursor-default bg-white text-center text-black">
          {t("timer.cycles")}: {timeState.cycles.count}
        </Badge>
      </div>

      <Button
        className="w-fit self-center"
        onClick={startTimer}
        disabled={isRunning}
      >
        {t("timer.start")}
      </Button>
      <div className="flex flex-row justify-center gap-2">
        <Button onClick={stopTimer} disabled={!isRunning}>
          {t("timer.stop")}
        </Button>
        <Button
          className="bg-lime-400 text-white focus:bg-lime-300 focus:outline-2 focus:outline-lime-400 focus:outline-offset-2"
          onClick={resetTimer}
        >
          {t("timer.reset")}
        </Button>
      </div>
      {import.meta.env.VITE_APP_ENV === "local" && (
        <Button
          className="w-fit self-center bg-red-400 text-white focus:bg-red-300 focus:outline-2 focus:outline-red-400 focus:outline-offset-2"
          onClick={completeTimer}
        >
          {t("timer.complete")}
        </Button>
      )}
    </div>
  );
};
