import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, Task } from "@/types";
import { Head } from "@inertiajs/react";
import { TaskTree } from "./Partials/TaskTree";
import { TaskTools } from "./Partials/TaskTools";
import { TaskSideView } from "./Partials/TaskSideView";
import { useAtom } from "jotai";
import { tasksAtom } from "@/Lib/atoms";
import { useEffect } from "react";
import Split from "react-split";

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
        <AuthenticatedLayout>
            <Head title="Task List" />
            {/* 白銀比を元にした数値 */}
            <Split className="flex flex-row" sizes={[17.2, 41.4, 41.4]}>
                <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800">
                    タグなど？
                </div>
                <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800">
                    <TaskTools></TaskTools>
                    <TaskTree></TaskTree>
                </div>
                <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800">
                    <TaskSideView></TaskSideView>
                </div>
            </Split>
        </AuthenticatedLayout>
    );
}
