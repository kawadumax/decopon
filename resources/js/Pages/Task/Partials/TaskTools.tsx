import { Button } from "@/Components/ui/button";
import { tasksAtom } from "@/Lib/atoms";
import { useAtom } from "jotai";
import { Plus } from "@mynaui/icons-react";
import { useApi } from "@/Hooks/useApi";

export const TaskTools = () => {
    const [, setTasks] = useAtom(tasksAtom);
    const api = useApi();

    const handleAddNewTask = () => {
        const taskTemplate = {
            title: "New Task",
            description: "New Task Description",
            completed: false,
        };

        api.post(route("api.tasks.store"), taskTemplate, (response) => {
            console.log(response.data.task);
            setTasks((prev) => [...prev, response.data.task]);
        });
    };

    return (
        <div className="flex justify-start m-4 mb-0">
            <Button onClick={handleAddNewTask}>
                <Plus /> Add New Task
            </Button>
        </div>
    );
};
