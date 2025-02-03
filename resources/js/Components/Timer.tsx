import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAtom } from "jotai";
import {
    isTimerRunningAtom,
    isWorkTimeAtom,
    currentTimeEntryIdAtom,
} from "@/Lib/atoms";
import { useApi } from "@/Hooks/useApi";
import { TimeEntry } from "@/types";

const WORK_TIME = 25 * 60 * 1000; // 25分
const BREAK_TIME = 5 * 60 * 1000; // 5分

export const Timer = () => {
    const [currentTimeEntryId, setTimeEntryId] = useAtom(
        currentTimeEntryIdAtom
    );
    const [isRunning, setIsRunning] = useAtom(isTimerRunningAtom);
    const [isWorkTime, setIsWorkTime] = useAtom(isWorkTimeAtom);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const api = useApi();
    const [cycles, setCycles] = useState(0);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isRunning) {
            intervalId = setInterval(() => {
                const newElapsedTime = Date.now() - (startTime || 0);
                setElapsedTime(newElapsedTime);

                if (isWorkTime && newElapsedTime >= WORK_TIME) {
                    setIsWorkTime(false);
                    setStartTime(Date.now());
                    setElapsedTime(0);
                } else if (!isWorkTime && newElapsedTime >= BREAK_TIME) {
                    setIsWorkTime(true);
                    setStartTime(Date.now());
                    setElapsedTime(0);
                    setCycles(cycles + 1);
                }
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isRunning, startTime, isWorkTime, cycles]);

    const startTimer = () => {
        setIsRunning(true);
        const date = new Date();
        const started_at = Date.now() - elapsedTime;
        // TimeEntryレコード作成
        api.post(
            route("api.time-entries.store"),
            {
                started_at: date.toISOString(),
                ended_at: null,
                status: "In_Progress",
            },
            (response) => {
                // TimeEntryIdが返ってくるのでatomに保持する
                console.log(response);
                setTimeEntryId(response.data.id);
            }
        );
        setStartTime(started_at);
    };

    const stopTimer = () => {
        setIsRunning(false);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setElapsedTime(0);
        setIsWorkTime(true);
        setCycles(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);

        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    const remainingTime = isWorkTime
        ? WORK_TIME - elapsedTime
        : BREAK_TIME - elapsedTime;

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
                <Button className="bg-lime-400 text-white" onClick={resetTimer}>
                    Reset
                </Button>
            </div>
        </div>
    );
};
