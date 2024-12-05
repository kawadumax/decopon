import { Task } from "@/types";
import { TaskItem } from "./TaskItem";

export const TaskTree = ({ tasks }: { tasks: Task[] }) => {
    return (
        <ul className="flex flex-col list-inside list-disc dark:text-gray-200">
            {tasks.map((task) => (
                <TaskItem task={task} key={task.id}></TaskItem>
            ))}
        </ul>
    );
};
