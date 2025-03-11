import { useTimeEntryApi } from "@/hooks/useTimeEntryApi";
import {
    isRunningAtom,
    isWorkTimeAtom,
    remainTimeAtom,
    resetRemainTimeAtom,
    timerStateAtom,
} from "@/lib/atoms";
import { formatTime } from "@/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export const Timer = () => {
	const { t } = useTranslation();
	const [isRunning, setIsRunning] = useAtom(isRunningAtom);
	const remainTime = useAtomValue(remainTimeAtom);
	const resetRemainTime = useSetAtom(resetRemainTimeAtom);
	const timeState = useAtomValue(timerStateAtom);
	const [isWorkTime, setIsWorkTime] = useAtom(isWorkTimeAtom);

	const {
		abandoneTimeEntry,
		progressTimeEntry,
		interruptTimeEntry,
		completeTimeEntry,
	} = useTimeEntryApi();

	const startTimer = useCallback(() => {
		setIsRunning(true);
		progressTimeEntry();
	}, [setIsRunning, progressTimeEntry]);

	const stopTimer = useCallback(() => {
		setIsRunning(false);
		interruptTimeEntry();
	}, [setIsRunning, interruptTimeEntry]);

	const resetTimer = useCallback(() => {
		setIsRunning(false);
		resetRemainTime("RESET");
		abandoneTimeEntry();
	}, [setIsRunning, resetRemainTime, abandoneTimeEntry]);

	const toggleWorkOrBreak = useCallback(() => {
		if (isRunning) return;
		setIsWorkTime(!isWorkTime);
		resetTimer();
	}, [isRunning, isWorkTime, setIsWorkTime, resetTimer]);

	const completeTimer = useCallback(() => {
		resetRemainTime("ZERO");
	}, [resetRemainTime]);

	return (
		<div className="flex flex-col h-full justify-center gap-2 bg-[url(/images/decopon-icon-300x300.png)] bg-blend-lighten bg-white/50 bg-center bg-no-repeat">
			<div className="font-mono self-center p-2 bg-white text-4xl text-center border-solid border border-amber-400 rounded">
				{formatTime(remainTime)}
			</div>
			<div className="flex flex-row justify-center gap-2">
				<Badge
					className={`text-center bg-white text-black ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
					onClick={toggleWorkOrBreak}
				>
					{isWorkTime ? t("timer.workTime") : t("timer.breakTime")}
				</Badge>
				<Badge className="text-center bg-white text-black cursor-default">
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
					className="bg-lime-400 text-white focus:bg-lime-300 focus:outline-2 focus:outline-offset-2 focus:outline-lime-400"
					onClick={resetTimer}
				>
					{t("timer.reset")}
				</Button>
			</div>
			{import.meta.env.VITE_APP_ENV === "local" && (
				<Button
					className="w-fit self-center bg-red-400 text-white focus:bg-red-300 focus:outline-2 focus:outline-offset-2 focus:outline-red-400"
					onClick={completeTimer}
				>
					{t("timer.complete")}
				</Button>
			)}
		</div>
	);
};
