import { useApi } from "@/Hooks/useApi";
import {
	breakTimeAtom,
	currentTimeEntryAtom,
	currentTimeEntryIdAtom,
	elapsedTimeAtom,
	isTimerRunningAtom,
	isWorkTimeAtom,
	startedTimeAtom,
	workTimeAtom,
} from "@/Lib/atoms";
import { formatTime, logger } from "@/Lib/utils";
import type { TimeEntry } from "@/types";
import { usePage } from "@inertiajs/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export const Timer = () => {
	const preference = usePage().props.auth.user.preference;
	const [workTime, setWorkTime] = useAtom(workTimeAtom);
	const [breakTime, setBreakTime] = useAtom(breakTimeAtom);

	setWorkTime(preference.work_time);
	setBreakTime(preference.break_time);

	const [currentTimeEntryId, setTimeEntryId] = useAtom(currentTimeEntryIdAtom);
	const [currentTimeEntry, setCurrentTimeEntry] = useAtom(currentTimeEntryAtom);
	const [isRunning, setIsRunning] = useAtom(isTimerRunningAtom);
	const [isWorkTime, setIsWorkTime] = useAtom(isWorkTimeAtom);
	const [startTime, setStartTime] = useAtom(startedTimeAtom);
	const [elapsedTime, setElapsedTime] = useAtom(elapsedTimeAtom);
	const api = useApi();
	const [cycles, setCycles] = useState(0);

	const progressTimeEntry = useCallback(() => {
		if (!isWorkTime) return;

		const date = new Date();

		if (currentTimeEntry) {
			// currentTimeEntryがあるがInterrupted
			api.put(
				route("api.time-entries-id.update", currentTimeEntryId),
				{
					started_at: date.toISOString(),
					ended_at: undefined,
					status: "In_Progress",
				} as Partial<TimeEntry>,
				(response) => {
					logger("Time entry progressed:", response);
					setCurrentTimeEntry(response.data.time_entry);
				},
			);
		} else {
			// TimeEntryレコード作成
			api.post(
				route("api.time-entries.store"),
				{
					started_at: date.toISOString(),
					ended_at: undefined,
					status: "In_Progress",
				},
				(response) => {
					// TimeEntryIdが返ってくるのでatomに保持する
					setCurrentTimeEntry(response.data.time_entry);
				},
			);
		}
	}, [
		isWorkTime,
		api,
		setCurrentTimeEntry,
		currentTimeEntry,
		currentTimeEntryId,
	]);

	const interruptTimeEntry = useCallback(() => {
		if (!currentTimeEntryId) return;
		const date = new Date();
		api.put(
			route("api.time-entries-id.update", currentTimeEntryId),
			{
				ended_at: date.toISOString(),
				status: "Interrupted",
			} as Partial<TimeEntry>,
			(response) => {
				logger("Time entry interrupted:", response);
				setCurrentTimeEntry(response.data.time_entry);
			},
		);
	}, [currentTimeEntryId, api, setCurrentTimeEntry]);

	const completeTimeEntry = useCallback(() => {
		if (!currentTimeEntryId) return;
		const date = new Date();
		api.put(
			route("api.time-entries-id.update", currentTimeEntryId),
			{
				ended_at: date.toISOString(),
				status: "Completed",
			} as Partial<TimeEntry>,
			(response) => {
				logger("Time entry completed:", response);
				setCurrentTimeEntry(undefined);
			},
		);
	}, [currentTimeEntryId, api, setCurrentTimeEntry]);

	const abandoneTimeEntry = useCallback(() => {
		if (!currentTimeEntryId) return;
		const date = new Date();
		api.put(
			route("api.time-entries-id.update", currentTimeEntryId),
			{
				ended_at: date.toISOString(),
				status: "Abandoned",
			} as Partial<TimeEntry>,
			(response) => {
				logger("Time entry abandoned:", response);
				setCurrentTimeEntry(undefined);
			},
		);
	}, [currentTimeEntryId, api, setCurrentTimeEntry]);

	/**
	 * タイマー状態: In-Progress時にページが閉じられた場合、タイマー状態をInterruptedにして、サーバーにリクエストを送る
	 *  */
	const handleBeforeUnload = useCallback(
		(event: BeforeUnloadEvent) => {
			if (currentTimeEntry && currentTimeEntry.status === "In_Progress") {
				event.preventDefault(); // 離脱時に進行中のタイマーがある場合、アラートが表示される
				interruptTimeEntry();
				setCurrentTimeEntry({
					...currentTimeEntry,
					status: "Interrupted",
				});
			}
		},
		[currentTimeEntry, interruptTimeEntry, setCurrentTimeEntry],
	);

	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;

		if (isRunning) {
			intervalId = setInterval(() => {
				const newElapsedTime = Date.now() - (startTime || 0);
				setElapsedTime(newElapsedTime);

				if (isWorkTime && newElapsedTime >= workTime) {
					// フォーカスタイムの終了時
					setIsWorkTime(false);
					setStartTime(null);
					setElapsedTime(0);
					completeTimeEntry();
					// 時間が来たらタイマーを止める
					setIsRunning(false);
				} else if (!isWorkTime && newElapsedTime >= breakTime) {
					// 休憩時間の終了時
					setIsWorkTime(true);
					setStartTime(null);
					setElapsedTime(0);
					setCycles(cycles + 1);
					setIsRunning(false);
				}
			}, 1000);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [
		isRunning,
		startTime,
		isWorkTime,
		cycles,
		breakTime,
		workTime,
		completeTimeEntry,
		setElapsedTime,
		setIsRunning,
		setIsWorkTime,
		setStartTime,
	]);

	useEffect(() => {
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [handleBeforeUnload]);

	const startTimer = useCallback(() => {
		setIsRunning(true);
		const started_at = Date.now() - elapsedTime;
		progressTimeEntry();
		setStartTime(started_at);
	}, [setIsRunning, elapsedTime, setStartTime, progressTimeEntry]);

	const stopTimer = useCallback(() => {
		setIsRunning(false);
		interruptTimeEntry();
	}, [setIsRunning, interruptTimeEntry]);

	const resetTimer = useCallback(() => {
		setIsRunning(false);
		setElapsedTime(0);
		setIsWorkTime(true);
		setCycles(0);
		abandoneTimeEntry();
	}, [setIsRunning, setElapsedTime, setIsWorkTime, abandoneTimeEntry]);

	const remainingTime = isWorkTime
		? workTime - elapsedTime
		: breakTime - elapsedTime;

	return (
		<div className="flex flex-col h-full justify-center gap-2 bg-[url(/images/decopon-icon-300x300.png)] bg-blend-lighten bg-white/50 bg-center bg-no-repeat">
			<div className="font-mono self-center p-2 bg-white text-4xl text-center border-solid border border-amber-400 rounded">
				{formatTime(remainingTime)}
			</div>
			<div className="flex flex-row justify-center gap-2">
				<Badge className="text-center bg-white text-black">
					{isWorkTime ? "Work Time" : "Break Time"}
				</Badge>
				<Badge className="text-center bg-white text-black">
					Cycles: {cycles}
				</Badge>
			</div>

			<Button
				className="w-fit self-center"
				onClick={startTimer}
				disabled={isRunning}
			>
				Start
			</Button>
			<div className="flex flex-row justify-center gap-2">
				<Button onClick={stopTimer} disabled={!isRunning}>
					Stop
				</Button>
				<Button
					className="bg-lime-400 text-white focus:bg-lime-300 focus:outline-2 focus:outline-offset-2 focus:outline-lime-400"
					onClick={resetTimer}
				>
					Reset
				</Button>
			</div>
		</div>
	);
};
