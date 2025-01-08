import { Input } from "@/Components/ui/input";
import { Task } from "@/types";
import { PrimitiveAtom } from "jotai";
import React, { useEffect, useRef, useState } from "react";

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
    const [logs, setLogs] = useState(["aaa", "bbb", "ccc", "ddd"]);
    const logContainerRef = useRef<HTMLUListElement>(null);
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;
        setLogs((prev) => [...prev, "uho"]);
    };

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop =
                logContainerRef.current.scrollHeight;
        }
    }, [logs]);
    return (
        <>
            <ul ref={logContainerRef} className="max-h-80 overflow-y-auto">
                {logs.map((log, index) => (
                    <li key={index}>{log}</li>
                ))}
            </ul>
            <div className="border-t-2 pt-4">
                <Input onKeyDown={handleKeyDown} />
            </div>
        </>
    );
};
