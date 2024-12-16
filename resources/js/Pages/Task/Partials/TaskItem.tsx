import { Task } from "@/types";
import { Button } from "@/Components/ui/button";
import { Trash, PlusSquare, ChevronRight } from "@mynaui/icons-react";
import React, { useState } from "react";
import { PrimitiveAtom, useSetAtom, useAtomValue, atom } from "jotai";
import { taskSelectorAtom } from "@/Lib/atoms";
import { useApi } from "@/Hooks/useApi";
import { TaskEditableTitle } from "./TaskEditableTitle";

export const TaskItem = ({
    taskAtom,
    remove,
    children,
}: {
    taskAtom: PrimitiveAtom<Task>;
    remove: () => void;

    children?: React.ReactNode;
}) => {
    const api = useApi();
    const task = useAtomValue(taskAtom);
    const [isExpanded, setIsExpanded] = useState(true);
    const setCurrentTaskAtom = useSetAtom(taskSelectorAtom);

    const handleDelete = () => {
        api.delete(route("api.tasks.destroy", task.id), (response) => {
            console.log(response.data);
            remove();
            setCurrentTaskAtom(atom(null));
        });
    };

    const handleItemClicked = (event: React.MouseEvent) => {
        event.stopPropagation();
        setCurrentTaskAtom(taskAtom);
    };

    const handleFold = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleAddChild = (event: React.MouseEvent) => {
        event.stopPropagation();
        api.post(
            route("api.tasks.store"),
            {
                parent_task_id: task.id,
            },
            (response) => {
                console.log(response.data);
            }
        );
    };

    const renderIdInLocal = () => {
        if (import.meta.env.VITE_APP_ENV == "local") {
            return (
                <span className="my-1 flex flex-row items-center gap-1">
                    <span>Id: {task.id}</span>
                    <span>ParentId: {task.parent_task_id || "Undefined"}</span>
                </span>
            );
        }
    };

    return (
        <li
            className={"pl-4 list-none hover:bg-stone-400 hover:bg-opacity-5"}
            onClick={handleItemClicked}
        >
            <div className="flex flex-row flex-nowrap justify-between">
                <span className="flex flex-row justify-start items-center">
                    {children && (
                        <ChevronRight
                            onClick={handleFold}
                            className={`-ml-1 mr-1 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                            }`}
                        />
                    )}
                    <TaskEditableTitle taskAtom={taskAtom}></TaskEditableTitle>
                </span>
                {renderIdInLocal()}
                <span className="my-1 flex flex-row gap-1 mr-2">
                    <Button variant={"ghost"} size={"icon"}>
                        <PlusSquare />
                    </Button>
                    <Button
                        variant={"ghost"}
                        size={"icon"}
                        onClick={handleDelete}
                    >
                        <Trash />
                    </Button>
                </span>
            </div>
            {isExpanded && children}
        </li>
    );
};
