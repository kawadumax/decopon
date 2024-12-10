import { Task } from "@/types";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Toggle } from "@/Components/ui/toggle";
import { Input } from "@/Components/ui/input";
import { Trash, Edit, PlusSquare } from "@mynaui/icons-react";
import React, { useEffect, useState, useRef } from "react";
import { useAtom, PrimitiveAtom } from "jotai";
import { selectedTaskIdAtom } from "@/Lib/atoms";
import { useApi } from "@/Hooks/useApi";

export const TaskItem = ({
    taskAtom,
    remove,
}: {
    taskAtom: PrimitiveAtom<Task>;
    remove: () => void;
}) => {
    const api = useApi();
    const [task, setTask] = useAtom(taskAtom);
    const [editable, setEditable] = useState<boolean>(false);
    const [, setSelectedId] = useAtom(selectedTaskIdAtom);
    const [inputChanged, setInputChanged] = useState<boolean>(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const handleCheckboxChange = (checked: boolean) => {
        api.put(
            route("api.tasks.update", task.id),
            { completed: checked },
            (response) => {
                setTask(response.data.task);
            }
        );
    };

    const handleDelete = () => {
        api.delete(route("api.tasks.destroy", task.id), (response) => {
            console.log(response.data);
            remove();
        });
    };

    const handleEditToggle = () => {
        setEditable((prev) => !prev);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputChanged(true);
        setTask((prev) => ({ ...prev, title: event.target.value }));
    };

    const handleItemClicked = (event: React.MouseEvent) => {
        setSelectedId(task.id);
    };

    useEffect(() => {
        if (editable) {
            inputRef.current?.focus();
        }

        if (inputChanged && !editable) {
            // フィールドが変化している時
            // editableがfalseになったときにupdateを呼び出す
            api.put(
                route("api.tasks.update", task.id),
                { title: task.title },
                (response) => {
                    setTask(response.data.task);
                },
                undefined,
                () => {
                    setInputChanged(false);
                }
            );
        }
    }, [editable]);

    useEffect(() => {}, [task]);

    return (
        <li
            className="px-4 list-none hover:bg-stone-50"
            onClick={handleItemClicked}
        >
            <div className="flex flex-row flex-nowrap justify-between">
                <span className="my-1 flex flex-row items-center gap-2">
                    <Checkbox
                        onCheckedChange={handleCheckboxChange}
                        checked={task.completed}
                    ></Checkbox>
                    {editable ? (
                        <Input
                            ref={inputRef}
                            defaultValue={task.title}
                            onInput={handleInputChange}
                        />
                    ) : (
                        task.title
                    )}
                    <Toggle
                        variant={"default"}
                        size={"sm"}
                        onClick={handleEditToggle}
                    >
                        <Edit />
                    </Toggle>
                </span>

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
