import { Input } from "@/Components/ui/input";
import { useApi } from "@/Hooks/useApi";
import { Task, Log } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import { PrimitiveAtom } from "jotai";
import React, { useEffect, useRef, useState } from "react";

const LogItem = ({ key, log }: { key: React.Key; log: Log }) => {
    return (
        <li key={key} className="flex flex-row">
            <p>{log.content}</p>
            <p>{log.created_at}</p>
        </li>
    );
};

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
    const api = useApi();
    const task = useAtomValue(taskAtom);
    const [logs, setLogs] = useState<Log[]>([]);
    const [content, setContent] = useState("");

    const logContainerRef = useRef<HTMLUListElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;
        const tempId = Date.now().toString();
        const newLog = {
            id: tempId,
            content,
            created_at: new Date().toISOString(),
            user_id: null,
            task_id: null,
            updated_at: null,
        } as unknown as Log;
        setLogs((prev) => [...prev, newLog]);
        api.post(
            route("api.logs.store"),
            {
                content: content,
                task_id: task.id,
            } as Partial<Log>,
            (response) => {
                const storedLog = response.data;
                setLogs((prev) =>
                    prev.map((log) =>
                        log.id === tempId ? { ...log, ...storedLog } : log
                    )
                );
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
                    const logs = response.data;
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
                {logs &&
                    logs.map((log, index) => <LogItem key={index} log={log} />)}
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
