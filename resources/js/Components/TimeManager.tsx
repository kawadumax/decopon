import { useTimeEntryApi } from "@/Hooks/useTimeEntryApi";
import { getSpanAtom, timerStateAtom } from "@/Lib/atoms";
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
			console.log("receive message from workder");
			if (e.data.type === "TICK") {
				setTimerState((prev) => {
					return { ...prev, elapsedTime: prev.elapsedTime + 1000 };
				});
			}
		};

		return () => {
			timerWorker.terminate();
		};
	}, [setTimerState]);

	useEffect(() => {
		if (timerState.isRunning) {
			// タイマーが動き始めたとき
			timerWorker?.postMessage({ type: "START" });
		} else {
			timerWorker?.postMessage({ type: "STOP" });
		}
	}, [timerState.isRunning, timerWorker]);

	// const [cycles, setCycles] = useState(0);

	/**
	 * elapsedTimeを監視して、終わった時、リセットされたとき、中断されたときを把握する?
	 *
	 */
	useEffect(() => {
		if (timerState.elapsedTime > timeSpan && timerState.isWorkTime) {
			// タイマーが終わった時
			completeTimeEntry();
			setTimerState((prev) => {
				return {
					...prev,
					isRunning: false,
					isWorkTime: !prev.isWorkTime,
					elapsedTime: 0,
					startedTime: null,
				};
			});
		}
	}, [
		setTimerState,
		timerState.elapsedTime,
		timerState.isWorkTime,
		timeSpan,
		completeTimeEntry,
	]);

	/**
	 * タイマー状態: In-Progress時にページが閉じられた場合、タイマー状態をInterruptedにして、サーバーにリクエストを送る
	 *  */
	const handleBeforeUnload = useCallback(
		(event: BeforeUnloadEvent) => {
			if (timerState?.timeEntry?.status === "In_Progress") {
				event.preventDefault(); // 離脱時に進行中のタイマーがある場合、アラートが表示される
				interruptTimeEntry();
				setTimerState((prev) => {
					return {
						...prev,
						timeEntry: {
							...timerState.timeEntry,
							status: "Interrupted",
						},
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
