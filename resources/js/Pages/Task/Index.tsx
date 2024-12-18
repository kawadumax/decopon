import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, Task } from "@/types";
import { Head } from "@inertiajs/react";
import { TaskTree } from "./Partials/TaskTree";
import { TaskTools } from "./Partials/TaskTools";
import { TaskSideView } from "./Partials/TaskSideView";
import { useAtom } from "jotai";
import { tasksAtom } from "@/Lib/atoms";
import { useEffect } from "react";

export default function Index(
    props: PageProps<{
        tasks: Task[];
    }>
) {
    const [, setTasks] = useAtom(tasksAtom);

    useEffect(() => {
        setTasks(props.tasks);
    }, [props.tasks]);

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
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 flex flex-row">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800 w-1/2">
                        <TaskTools></TaskTools>
                        <TaskTree></TaskTree>
                    </div>
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800 w-[640px] h-fit fixed bottom-0 right-28">
                        <TaskSideView></TaskSideView>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
