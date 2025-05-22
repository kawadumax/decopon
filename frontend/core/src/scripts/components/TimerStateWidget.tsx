import { remainTimeAtom, timerStateAtom } from "@lib/atoms";
import { formatTime } from "@lib/utils";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

export const TimerStateWidget = () => {
  const { t } = useTranslation();
  const timerState = useAtomValue(timerStateAtom);
  const remainTime = useAtomValue(remainTimeAtom);
  return (
    <div className="flex flex-col items-center justify-center rounded border-2 border-gray-500 border-solid px-2">
      <span className="font-bold font-mono text-gray-700 text-sm">
        {formatTime(remainTime)}
      </span>
      <span className="text-gray-500 text-xs">
        {timerState?.timeEntry?.status || t("timeEntry.status.notStarted")}
      </span>
    </div>
  );
};
