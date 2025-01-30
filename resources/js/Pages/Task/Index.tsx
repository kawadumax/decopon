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

            <Split
                className="flex flex-row min-h-full max-h-full"
                sizes={[17.2, 41.4, 41.4]} // 白銀比を元にした比率
                gutterSize={4}
                gutter={() => {
                    const gutterElement = document.createElement("div");
                    gutterElement.className = `w-1 bg-amber-400 hover:cursor-col-resize hover:w-2 hover:bg-amber-500 transition-all delay-300 duration-300 ease-in-out`;
                    return gutterElement;
                }}
                // 元のgutterのスタイルを削除
                gutterStyle={() => ({})}
            >
                <div className="overflow-auto bg-white shadow-sm dark:bg-gray-800 max-h-full">
                    タグなど？
                </div>
                <div className="overflow-auto hidden-scrollbar bg-white shadow-sm dark:bg-gray-800 max-h-full">
                    <TaskTools></TaskTools>
                    <TaskTree></TaskTree>
                </div>
                <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 max-h-full">
                    <TaskSideView></TaskSideView>
                </div>
            </Split>
        </AuthenticatedLayout>
    );
}
