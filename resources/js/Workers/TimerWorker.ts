let startTime: number;
let intervalId: NodeJS.Timeout;

addEventListener("message", (e) => {
	switch (e.data.type) {
		case "START":
			console.log("Worker Start");
			intervalId = setInterval(() => {
				postMessage({ type: "TICK" });
			}, 1000);
			break;
		case "STOP":
			console.log("Worker Stop");
			clearInterval(intervalId);
			break;
		default:
			console.log(`NO SUCH COMMAND: ${e.data.type}`);
			break;
	}
});
