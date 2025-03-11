import { LogItem } from "@/components/LogItem";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { logsAtom } from "@/lib/atoms";
import type { Log, PageProps } from "@/types";
// import { Head } from "@inertiajs/react";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import Split from "react-split";
import { LogTagList } from "./partials/LogTagList";

export default function Index(
	props: PageProps<{
		logs: Log[];
	}>,
) {
	const logContainerRef = useRef<HTMLUListElement>(null);
	const [logs, setLogs] = useAtom(logsAtom);
	useEffect(() => {
		setLogs(props.logs);
	}, [props.logs, setLogs]);

	return (
		<AuthenticatedLayout>
			{/* <Head title="Timeline" /> */}

			<Split
				className="flex flex-row min-h-full max-h-full bg-white"
				sizes={[17.2, 82.8]} // 白銀比を元にした比率
				gutterSize={1}
				gutter={() => {
					const gutterElement = document.createElement("div");
					gutterElement.className =
						"w-2 bg-stone-50 hover:cursor-col-resize hover:w-2 hover:bg-amber-400 transition-all delay-100 duration-300 ease-in-out";
					return gutterElement;
				}}
				// 元のgutterのスタイルを削除
				gutterStyle={() => ({})}
			>
				<div>
					<LogTagList />
				</div>
				<div>
					<ul ref={logContainerRef} className="flex-1 overflow-y-auto">
						{logs?.map((log) => (
							<LogItem key={log.id} log={log} />
						))}
					</ul>
				</div>
			</Split>
		</AuthenticatedLayout>
	);
}
