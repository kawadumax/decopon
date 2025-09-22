import { formatTime } from "@lib/utils";
import { useTimerStore } from "@store/timer";
import { DecoponSessionStatus } from "@/scripts/types";
import { useTranslation } from "react-i18next";

const decoponSessionStatusTranslationKey: Record<
  DecoponSessionStatus,
  string
> = {
  [DecoponSessionStatus.InProgress]: "decoponSession.status.inProgress",
  [DecoponSessionStatus.Completed]: "decoponSession.status.completed",
  [DecoponSessionStatus.Interrupted]: "decoponSession.status.interrupted",
  [DecoponSessionStatus.Abandoned]: "decoponSession.status.abandoned",
  [DecoponSessionStatus.Extended]: "decoponSession.status.extended",
};

export const TimerStateWidget = () => {
  const { t } = useTranslation();
  const timerState = useTimerStore((s) => s.timerState);
  const remainTime = useTimerStore((s) => s.remainTime());
  const status = timerState.decoponSession?.status;
  const statusText = timerState.isWorkTime
    ? status
      ? t(decoponSessionStatusTranslationKey[status])
      : t("decoponSession.status.notStarted")
    : t("timer.break");
  return (
    <div className="flex flex-col items-center justify-center rounded border-2 border-gray-500 border-solid px-2">
      <span className="font-bold font-mono text-gray-700 text-sm">
        {formatTime(remainTime)}
      </span>
      <span className="text-gray-500 text-xs">
        {statusText}
      </span>
    </div>
  );
};
