import { Button } from "@/Components/ui/button";
import { tasksAtom } from "@/Lib/atoms";
import axios from "axios";
import { useAtom } from "jotai";
import { Plus } from "@mynaui/icons-react";

export const TaskTools = () => {
    const [tasks, setTasks] = useAtom(tasksAtom);

    const handleAddNewTask = () => {
        const data = {
            title: "New Task",
            description: "New Task Description",
            completed: false,
        };
        // Make a request for a user with a given ID
        axios
            .post(route("api.tasks.store"), data)
            .then(function (response) {
                // handle success
                setTasks([...tasks, response.data.task]);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    };

    return (
        <div className="flex justify-start">
            <Button onClick={handleAddNewTask} className="m-2">
                <Plus /> Add New Task
            </Button>
        </div>
    );
};
