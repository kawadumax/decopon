import { Task } from "@/types";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Trash, Edit } from "@mynaui/icons-react";
import axios from "axios";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { tasksAtom } from "@/Lib/atoms";
export const TaskItem = ({ task }: { task: Task }) => {
    const [, setTasks] = useAtom(tasksAtom);

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

    const handleEdit = () => {
        //TODO
    };

    useEffect(() => {}, []);

    return (
        <li className="px-4 list-none hover:bg-stone-100">
            <div className="flex flex-row flex-nowrap justify-between">
                <span className="my-1 flex flex-row items-center gap-2">
                    <Checkbox></Checkbox>
                    {task.title}
                </span>

                <span className="my-1 flex flex-row gap-1">
                    <Button variant={"ghost"} size={"icon"}>
                        <Edit />
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
