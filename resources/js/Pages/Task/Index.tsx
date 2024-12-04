import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, Task } from "@/types";
import { Head } from "@inertiajs/react";
import { TaskTree } from "./Partials/TaskTree";
import { TaskTools } from "./Partials/TaskTools";
import { useAtom } from "jotai";
import { tasksAtom } from "@/Lib/atoms";

export default function Index(
    props: PageProps<{
        tasks: Task[];
    }>
) {
    console.log("tasks:", props.tasks);
    const [tasks, setTasks] = useAtom(tasksAtom);
    setTasks(props.tasks);
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Tasks
                </h2>
            }
        >
            <Head title="Task List" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <TaskTools></TaskTools>
                        <TaskTree tasks={tasks}></TaskTree>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
