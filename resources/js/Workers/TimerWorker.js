// timerWorkerts
let startTime = Date.now();
let intervalId = setInterval(() => {
	const elapsed = Date.now() - startTime;
	// メインスレッドに経過時間を送る
	postMessage({ type: "TICK", elapsed });
}, 1000);

addEventListener("message", (e) => {
	if (e.data.type === "RESET") {
		clearInterval(intervalId);
		startTime = Date.now();
		intervalId = setInterval(() => {
			const elapsed = Date.now() - startTime;
			postMessage({ type: "TICK", elapsed });
		}, 1000);
	}
	// 他にも必要な処理（STOP, STARTなど）をここで実装する
});
