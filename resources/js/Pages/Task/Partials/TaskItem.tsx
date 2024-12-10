import { Task } from "@/types";
import { Button } from "@/Components/ui/button";

import { Trash, PlusSquare } from "@mynaui/icons-react";
import React, { useEffect, useState, useRef } from "react";
import { useAtom, PrimitiveAtom } from "jotai";
import { selectedTaskAtomAtom } from "@/Lib/atoms";
import { useApi } from "@/Hooks/useApi";
import { TaskEditableTitle } from "./TaskEditableTitle";

export const TaskItem = ({
    taskAtom,
    remove,
}: {
    taskAtom: PrimitiveAtom<Task>;
    remove: () => void;
}) => {
    const api = useApi();
    const [task, setTask] = useAtom(taskAtom);
    const [, setSelectedTaskAtom] = useAtom(selectedTaskAtomAtom);

    const handleDelete = () => {
        api.delete(route("api.tasks.destroy", task.id), (response) => {
            console.log(response.data);
            remove();
        });
    };

    const handleItemClicked = (event: React.MouseEvent) => {
        setSelectedTaskAtom(taskAtom);
    };

    useEffect(() => {}, [task]);

    return (
        <li
            className="px-4 list-none hover:bg-stone-50"
            onClick={handleItemClicked}
        >
            <div className="flex flex-row flex-nowrap justify-between">
                <TaskEditableTitle taskAtom={taskAtom}></TaskEditableTitle>
                <span className="my-1 flex flex-row gap-1">
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
        </li>
    );
};
