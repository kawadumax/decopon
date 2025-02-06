import { Input } from "@/Components/ui/input";
import { useApi } from "@/Hooks/useApi";
import { logger } from "@/Lib/logger";
import { Task, Log } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import { PrimitiveAtom } from "jotai";
import React, { useEffect, useRef, useState } from "react";

const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
        .format(date)
        .replace(/\//g, "/");
};

const LogItem = ({ log }: { log: Log }) => {
    return (
        <li className="rounded flex flex-row justify-between hover:ring-1 hover:ring-amber-400 m-1 p-1">
            <p className="text-base">{log.content}</p>
            <p className="font-mono text-xs text-black text-opacity-50">
                {formatDate(log.created_at)}
            </p>
        </li>
    );
};

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
    const api = useApi();
    const task = useAtomValue(taskAtom);
    const [logs, setLogs] = useState<Log[]>([]);
    const [content, setContent] = useState("");
    const [tempIdCounter, setTempIdCounter] = useState(0);

    const logContainerRef = useRef<HTMLUListElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;
        const tempId = -1 - tempIdCounter; // 負の値を使用して一時的なIDを生成
        setTempIdCounter((prev) => prev + 1);
        const newLog = {
            id: tempId,
            content,
            created_at: new Date().toISOString(),
            user_id: null,
            task_id: task.id,
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
                logger("success log storing", response);
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
                    logger("Error fetching logs:", error);
                }
            );
        }
    }, [task]);

    return (
        <div className="flex flex-col flex-1">
            <ul ref={logContainerRef} className="flex-1 overflow-y-auto">
                {logs &&
                    logs.map((log, index) => <LogItem key={index} log={log} />)}
            </ul>
            <div className="pt-4">
                <Input
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    defaultValue={content}
                />
            </div>
        </div>
    );
};
