let intervalId: ReturnType<typeof setInterval>;

addEventListener("message", (e) => {
  switch (e.data.type) {
    case "START":
      intervalId = setInterval(() => {
        postMessage({ type: "TICK" });
      }, 1000);
      break;
    case "STOP":
      clearInterval(intervalId);
      break;
    default:
      console.log(`NO SUCH COMMAND: ${e.data.type}`);
      break;
  }
});
