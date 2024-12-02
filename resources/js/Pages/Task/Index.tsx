import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import TaskTree from "./Partials/TaskTree";

export default function Index({
    tasks,
}: PageProps<{
    tasks: {
        id: number;
        title: string;
        completed: boolean;
        description: string;
    }[];
}>) {
    console.log("tasks:", tasks);
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
                        <TaskTree></TaskTree>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
