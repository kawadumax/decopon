import { Task } from "@/types";
import { Button } from "@/Components/ui/button";
import { Trash, PlusSquare } from "@mynaui/icons-react";
import React from "react";
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

    const subtaskStyle = () =>
        children ? "hover:bg-stone-50" : "hover:bg-stone-100";

    return (
        <li
            className={"pl-4 list-none hover:bg-stone-400 hover:bg-opacity-5"}
            onClick={handleItemClicked}
            onMouseOver={(e) => e.stopPropagation()}
        >
            <div className="flex flex-row flex-nowrap justify-between">
                <TaskEditableTitle taskAtom={taskAtom}></TaskEditableTitle>
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
            {children}
        </li>
    );
};
