import { formatDate } from "@/Lib/utils";
import type { Log } from "@/types";
export const LogItem = ({ log }: { log: Log }) => {
	return (
		<li className="rounded flex flex-row justify-between hover:ring-1 hover:ring-amber-400 m-1 p-1">
			<p className="text-base">{log.content}</p>
			<p className="font-mono text-xs text-black text-opacity-50">
				{formatDate(log.created_at)}
			</p>
		</li>
	);
};
