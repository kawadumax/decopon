import {
	breakTimeAtom,
	currentTimeEntryAtom,
	elapsedTimeAtom,
	isWorkTimeAtom,
	startedTimeAtom,
	workTimeAtom,
} from "@/Lib/atoms";
import { formatTime } from "@/Lib/utils";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

export const TimerStateWidget = () => {
	const elapsedTime = useAtomValue(elapsedTimeAtom);
	const startedTime = useAtomValue(startedTimeAtom);
	const currentTimeEntry = useAtomValue(currentTimeEntryAtom);
	const isWorkTime = useAtomValue(isWorkTimeAtom);
	const workTime = useAtomValue(workTimeAtom);
	const breakTime = useAtomValue(breakTimeAtom);

	const remainingTime = useMemo(() => {
		const time = isWorkTime ? workTime - elapsedTime : breakTime - elapsedTime;
		return formatTime(time);
	}, [isWorkTime, workTime, breakTime, elapsedTime]);

	return (
		<div className="border-solid border-2 rounded border-gray-500 flex flex-col justify-center items-center px-2">
			<span className="font-bold font-mono text-sm text-gray-700">
				{remainingTime}
			</span>
			<span className="text-xs text-gray-500">
				{currentTimeEntry?.status || "Not Started"}
			</span>
		</div>
	);
};
