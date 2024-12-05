import { Task } from "@/types";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Trash, Edit } from "@mynaui/icons-react";
export const TaskItem = ({ task }: { task: Task }) => {
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
                    <Button variant={"ghost"} size={"icon"}>
                        <Trash />
                    </Button>
                </span>
            </div>
        </li>
    );
};
