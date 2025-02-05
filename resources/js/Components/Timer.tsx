import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAtom } from "jotai";
import {
    isTimerRunningAtom,
    isWorkTimeAtom,
    currentTimeEntryIdAtom,
    currentTimeEntryAtom,
    workTimeAtom,
    breakTimeAtom,
} from "@/Lib/atoms";
import { useApi } from "@/Hooks/useApi";
import { TimeEntry } from "@/types";
import { usePage } from "@inertiajs/react";

// const WORK_TIME = 1 * 10 * 1000; // 25分
// const BREAK_TIME = 1 * 10 * 1000; // 5分

export const Timer = () => {
    const preference = usePage().props.auth.user.preference;

    const [workTime, setWorkTime] = useAtom(workTimeAtom);
    const [breakTime, setBreakTime] = useAtom(breakTimeAtom);

    setWorkTime(preference.work_time);
    setBreakTime(preference.break_time);

    const [currentTimeEntryId, setTimeEntryId] = useAtom(
        currentTimeEntryIdAtom
    );
    const [currentTimeEntry, setCurrentTimeEntry] =
        useAtom(currentTimeEntryAtom);
    const [isRunning, setIsRunning] = useAtom(isTimerRunningAtom);
    const [isWorkTime, setIsWorkTime] = useAtom(isWorkTimeAtom);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const api = useApi();
    const [cycles, setCycles] = useState(0);

    const progressTimeEntry = useCallback(() => {
        if (!isWorkTime) return;

        const date = new Date();

        if (currentTimeEntry) {
            api.put(
                route("api.time-entries-id.update", currentTimeEntryId),
                {
                    ended_at: date.toISOString(),
                    status: "In_Progress",
                } as Partial<TimeEntry>,
                (response) => {
                    console.log("Time entry progressed:", response);
                    setCurrentTimeEntry(response.data.time_entry);
                }
            );
        } else {
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
                    setCurrentTimeEntry(response.data.time_entry);
                }
            );
        }
    }, [isWorkTime, api, setCurrentTimeEntry]);

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
                console.log("Time entry interrupted:", response);
                setCurrentTimeEntry(response.data.time_entry);
            }
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
                console.log("Time entry completed:", response);
                setCurrentTimeEntry(null);
            }
        );
    }, [currentTimeEntryId, api, setTimeEntryId]);

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
                console.log("Time entry abandoned:", response);
                setCurrentTimeEntry(null);
            }
        );
    }, [currentTimeEntryId, api, setTimeEntryId]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isRunning) {
            intervalId = setInterval(() => {
                const newElapsedTime = Date.now() - (startTime || 0);
                setElapsedTime(newElapsedTime);

                if (isWorkTime && newElapsedTime >= WORK_TIME) {
                    // フォーカスタイムの終了時
                    setIsWorkTime(false);
                    setStartTime(Date.now());
                    setElapsedTime(0);
                    completeTimeEntry();
                    // 時間が来たらタイマーを止める
                    setIsRunning(false);
                } else if (!isWorkTime && newElapsedTime >= BREAK_TIME) {
                    // 休憩時間の終了時
                    setIsWorkTime(true);
                    setStartTime(Date.now());
                    setElapsedTime(0);
                    setCycles(cycles + 1);
                    setIsRunning(false);
                }
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isRunning, startTime, isWorkTime, cycles, completeTimeEntry]);

    const startTimer = () => {
        setIsRunning(true);
        const started_at = Date.now() - elapsedTime;
        progressTimeEntry();
        setStartTime(started_at);
    };

    const stopTimer = () => {
        setIsRunning(false);
        interruptTimeEntry();
    };

    const resetTimer = () => {
        setIsRunning(false);
        setElapsedTime(0);
        setIsWorkTime(true);
        setCycles(0);
        abandoneTimeEntry();
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
