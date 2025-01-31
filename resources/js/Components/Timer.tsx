import { useState, useEffect } from "react";
import { Button } from "./ui/button";
export const Timer = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isRunning) {
            intervalId = setInterval(() => {
                setElapsedTime(Date.now() - (startTime || 0));
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isRunning, startTime]);

    const startTimer = () => {
        setIsRunning(true);
        setStartTime(Date.now() - elapsedTime);
    };

    const stopTimer = () => {
        setIsRunning(false);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setElapsedTime(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);

        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col h-full justify-center gap-2 bg-[url(/images/decopon-icon-300x300.png)] bg-blend-lighten bg-white/50 bg-center bg-no-repeat">
            <div className="font-mono self-center p-2 bg-white text-4xl text-center border-solid border border-amber-400 rounded">
                {formatTime(elapsedTime)}
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
                <Button className="bg-lime-400 text-white" onClick={resetTimer}>
                    Reset
                </Button>
            </div>
        </div>
    );
};
