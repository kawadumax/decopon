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

export const TaskItem = ({ task }: { task: Task }) => {
    const [, setTasks] = useAtom(tasksAtom);
    const [editable, setEditable] = useState<boolean>(false);
    const [title, setTitle] = useState<string>(task.title);

    const handleCheckboxChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        //TODO
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

    useEffect(() => {
        if (!editable) {
            // editableがfalseになったときにupdateを呼び出す
            axios
                .put(route("api.tasks.update", task.id), { title })
                .then((response) => {
                    // 必要に応じて処理を追加
                    setTitle(response.data.title);
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }, [editable, title, task.id]);

    return (
        <li className="px-4 list-none hover:bg-stone-50">
            <div className="flex flex-row flex-nowrap justify-between">
                <span className="my-1 flex flex-row items-center gap-2">
                    <Checkbox></Checkbox>
                    {editable ? (
                        <Input defaultValue={task.title} />
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
