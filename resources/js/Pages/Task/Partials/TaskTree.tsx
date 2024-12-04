import { Task } from "@/types";

export const TaskTree = ({ tasks }: { tasks: Task[] }) => {
    return (
        <ul className="flex flex-col list-inside list-disc dark:text-gray-200">
            {tasks.map((task) => (
                <li className="m-1 pl-2" key={task.id}>
                    {task.title}
                </li>
            ))}
        </ul>
    );
};
