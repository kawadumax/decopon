import { Task } from "@/types";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Toggle } from "@/Components/ui/toggle";
import { Input } from "@/Components/ui/input";
import { Trash, Edit, PlusSquare } from "@mynaui/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { tasksAtom } from "@/Lib/atoms";

export const TaskItem = (props: { task: Task }) => {
    const [, setTasks] = useAtom(tasksAtom);
    const [editable, setEditable] = useState<boolean>(false);
    const [inputChanged, setInputChanged] = useState<boolean>(false);
    const [task, setTask] = useState<Task>(props.task);

    const handleCheckboxChange = (checked: boolean) => {
        axios
            .put(route("api.tasks.update", task.id), { completed: checked })
            .then((response) => {
                console.log(response.data);
                setTask(response.data.task);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {});
    };

    const handleDelete = () => {
        axios
            .delete(route("api.tasks.destroy", task.id))
            .then((response) => {
                setTasks((prev) => prev.filter((t) => t.id !== task.id));
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {});
    };

    const handleEditToggle = () => {
        setEditable((prev) => !prev);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputChanged(true);
        setTask((prev) => ({ ...prev, title: event.target.value }));
    };

    useEffect(() => {
        if (inputChanged && !editable) {
            // フィールドが変化している時
            // editableがfalseになったときにupdateを呼び出す
            axios
                .put(route("api.tasks.update", task.id), { title: task.title })
                .then((response) => {
                    console.log(response.data);
                    setTask(response.data.task);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setInputChanged(false);
                });
        }
    }, [editable]);

    useEffect(() => {}, [task]);

    return (
        <li className="px-4 list-none hover:bg-stone-50">
            <div className="flex flex-row flex-nowrap justify-between">
                <span className="my-1 flex flex-row items-center gap-2">
                    <Checkbox
                        onCheckedChange={handleCheckboxChange}
                        checked={task.completed}
                    ></Checkbox>
                    {editable ? (
                        <Input
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
