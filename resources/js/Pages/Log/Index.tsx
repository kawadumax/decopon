import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { logsAtom } from "@/Lib/atoms";
import { PageProps, Log } from "@/types";
import { Head } from "@inertiajs/react";
import { useAtom } from "jotai";
import { LogItem } from "@/Components/LogItem";
import { useEffect, useRef } from "react";
import Split from "react-split";
import { LogTagList } from "./Partials/LogTagList";

export default function Index(
    props: PageProps<{
        logs: Log[];
    }>
) {
    const logContainerRef = useRef<HTMLUListElement>(null);
    const [logs, setLogs] = useAtom(logsAtom);
    useEffect(() => {
        setLogs(props.logs);
    }, [props.logs]);

    return (
        <AuthenticatedLayout>
            <Head title="Timeline" />

            <Split
                className="flex flex-row min-h-full max-h-full bg-white"
                sizes={[17.2, 82.8]} // 白銀比を元にした比率
                gutterSize={1}
                gutter={() => {
                    const gutterElement = document.createElement("div");
                    gutterElement.className = `w-2 bg-stone-50 hover:cursor-col-resize hover:w-2 hover:bg-amber-400 transition-all delay-100 duration-300 ease-in-out`;
                    return gutterElement;
                }}
                // 元のgutterのスタイルを削除
                gutterStyle={() => ({})}
            >
                <div><LogTagList></LogTagList></div>
                <div>
                    <ul
                        ref={logContainerRef}
                        className="flex-1 overflow-y-auto"
                    >
                        {logs &&
                            logs.map((log, index) => (
                                <LogItem key={index} log={log} />
                            ))}
                    </ul>
                </div>
            </Split>
        </AuthenticatedLayout>
    );
}
