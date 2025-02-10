import { LogItem } from "@/Components/LogItem";
import { useApi } from "@/Hooks/useApi";
import { logger } from "@/Lib/logger";
import { Task, Log } from "@/types";
import { useAtomValue } from "jotai";
import { PrimitiveAtom } from "jotai";
import React, { useEffect, useRef, useState } from "react";
import {
    AutosizeTextarea,
    AutosizeTextAreaRef,
} from "@/Components/ui/autosize-textarea";

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
    const api = useApi();
    const task = useAtomValue(taskAtom);
    const [logs, setLogs] = useState<Log[]>([]);
    const [content, setContent] = useState("");
    const [tempIdCounter, setTempIdCounter] = useState(0);

    const logContainerRef = useRef<HTMLUListElement>(null);
    const textareaRef = useRef<AutosizeTextAreaRef>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!content.trim()) return;
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
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
            setContent("");
            event.currentTarget.value = "";

            // トリガーリサイズを呼び出す
            if (textareaRef.current) {
                textareaRef.current.triggerResize();
            }
        }
    };

    const handleInput = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
                <AutosizeTextarea
                    ref={textareaRef}
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    defaultValue={content}
                    maxHeight={200}
                    minHeight={0}
                ></AutosizeTextarea>
            </div>
        </div>
    );
};
