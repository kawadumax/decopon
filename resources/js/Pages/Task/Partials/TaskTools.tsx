import { Button } from "@/Components/ui/button";
import { Link, router } from "@inertiajs/react";
import axios from "axios";

export const TaskTools = () => {
    const handleAddNewTask = () => {
        console.log("Add New Task");
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
                console.log(response);
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
                +
            </Button>
            <Button className="m-2">Disable</Button>
            <Button className="m-2">-</Button>
        </div>
    );
};
