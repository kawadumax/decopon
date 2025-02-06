import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { logsAtom } from "@/Lib/atoms";
import { PageProps, Log } from "@/types";
import { Head } from "@inertiajs/react";
import { useAtom } from "jotai";
import { Logs } from "lucide-react";
import { useEffect } from "react";
import Split from "react-split";

export default function Index(
    props: PageProps<{
        logs: Log[];
    }>
) {
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
                <div>不必要エリア</div>
                <div>
                    <ul>
                        {logs.map((log) => {
                            return <li>{log.content}</li>;
                        })}
                    </ul>
                </div>
            </Split>
        </AuthenticatedLayout>
    );
}
