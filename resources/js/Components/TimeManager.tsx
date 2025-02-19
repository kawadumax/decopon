import { useEffect } from "react";
import TimerWorker from "../Workers/TimerWorker.js?worker";

/**
 * 時間を進めるWebWorkerの処理を発行及び購読を行う
 * @returns Fragment
 */
export const TimeManager = () => {
	useEffect(() => {
		// Workerのインスタンスを作成
		console.log("load worker");
		const timerWorker = new TimerWorker();

		timerWorker.onmessage = (e) => {
			console.log("receive message from workder");
			if (e.data.type === "TICK") {
				const newElapsedTime = e.data.elapsed;
				// setElapsedTime(newElapsedTime) など、Reactの状態を更新する
			}
		};

		return () => {
			timerWorker.terminate();
		};
	}, []);

	return <></>;
};
