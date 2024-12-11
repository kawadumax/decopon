import { Task } from "@/types";
import { PrimitiveAtom, useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { useApi } from "@/Hooks/useApi";

export const TaskEditableDescription = ({
    taskAtom,
}: {
    taskAtom: PrimitiveAtom<Task>;
}) => {
    const api = useApi();
    const [task, setTask] = useAtom(taskAtom);
    const [description, setDescription] = useState(task.description);

    const handleOnBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
        if (description !== task.description) {
            api.put(
                route("api.tasks.update", task.id),
                { description: description },
                (response) => {
                    setTask(response.data.task);
                }
            );
        }
    };

    const handleOnChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(event.target.value);
    };

    useEffect(() => {
        setDescription(task.description);
    }, [taskAtom]);

    return (
        <div>
            <Textarea
                value={description}
                onChange={handleOnChange}
                onBlur={handleOnBlur}
            ></Textarea>
        </div>
    );
};
