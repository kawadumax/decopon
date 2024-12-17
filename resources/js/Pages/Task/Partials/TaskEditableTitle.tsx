import { Checkbox } from "@/Components/ui/checkbox";
import { Toggle } from "@/Components/ui/toggle";
import { Input } from "@/Components/ui/input";
import { Edit } from "@mynaui/icons-react";
import { Task } from "@/types";
import { PrimitiveAtom, useAtom, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/Hooks/useApi";
import { tasksBatchAtom } from "@/Lib/atoms";

export const TaskEditableTitle = ({
    taskAtom,
    variant = "default",
}: {
    taskAtom: PrimitiveAtom<Task>;
    variant?: "default" | "lg";
}) => {
    const api = useApi();
    const [task, setTask] = useAtom(taskAtom);
    const batchTasks = useSetAtom(tasksBatchAtom);
    const [editable, setEditable] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputChanged, setInputChanged] = useState<boolean>(false);

    const handleEditToggle = () => {
        setEditable((prev) => !prev);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputChanged(true);
        setTask((prev) => ({ ...prev, title: event.target.value }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        api.put(
            route("api.tasks.update.complete", task.id),
            { completed: checked },
            (response) => {
                batchTasks(response.data.tasks);
            }
        );
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

    const renderTitle = () => {
        if (variant === "lg") {
            return <h2 className="text-lg font-bold">{task.title}</h2>;
        } else {
            return <span className="break-keep">{task.title}</span>;
        }
    };

    return (
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
                renderTitle()
            )}
            <Toggle variant={"default"} size={"sm"} onClick={handleEditToggle}>
                <Edit />
            </Toggle>
        </span>
    );
};
