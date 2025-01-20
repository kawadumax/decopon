import { Input } from "@/Components/ui/input";
import { useApi } from "@/Hooks/useApi";
import { Task, Log } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import { PrimitiveAtom } from "jotai";
import React, { useEffect, useRef, useState } from "react";

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
    const api = useApi();
    const task = useAtomValue(taskAtom);
    const [logs, setLogs] = useState<string[]>([]);
    const [content, setContent] = useState("");

    const logContainerRef = useRef<HTMLUListElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;
        setLogs((prev) => [...prev, content]);
        api.post(
            route("api.logs.store"),
            {
                content: content,
                task_id: task.id,
            } as Partial<Log>,
            (response) => {
                console.log("success log storing", response);
            }
        );
        event.currentTarget.value = "";
        setContent("");
    };

    const handleInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
        setContent(event.currentTarget.value);
    };

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop =
                logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        if (task) {
            api.get(
                route("api.logs.task", task.id),
                (response) => {
                    const logs = response.data.map((log: Log) => log.content);
                    setLogs(logs);
                },
                (error) => {
                    console.error("Error fetching logs:", error);
                }
            );
        }
    }, [task]);

    return (
        <>
            <ul ref={logContainerRef} className="max-h-80 overflow-y-auto">
                {logs && logs.map((log, index) => <li key={index}>{log}</li>)}
            </ul>
            <div className="border-t-2 pt-4">
                <Input
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    defaultValue={content}
                />
            </div>
        </>
    );
};
