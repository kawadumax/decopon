import { remainTimeAtom, timerStateAtom } from "@/Lib/atoms";
import { formatTime } from "@/Lib/utils";
import { useAtomValue } from "jotai";

export const TimerStateWidget = () => {
	const timerState = useAtomValue(timerStateAtom);
	const remainTime = useAtomValue(remainTimeAtom);
	return (
		<div className="border-solid border-2 rounded border-gray-500 flex flex-col justify-center items-center px-2">
			<span className="font-bold font-mono text-sm text-gray-700">
				{formatTime(remainTime)}
			</span>
			<span className="text-xs text-gray-500">
				{timerState?.timeEntry?.status || "Not Started"}
			</span>
		</div>
	);
};
