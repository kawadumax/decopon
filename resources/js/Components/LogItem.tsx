import { formatISODate } from "@/Lib/utils";
import type { Log } from "@/types";
import { InfoCircle } from "@mynaui/icons-react";

const DefaultItem = ({ log }: { log: Log }) => {
	return (
		<li className="rounded flex flex-row justify-between hover:ring-1 hover:ring-amber-400 m-1 p-1">
			<p className="text-base">{log.content}</p>
			<p className="font-mono text-xs text-black text-opacity-50">
				{formatISODate(log.created_at)}
			</p>
		</li>
	);
};

const SystemItem = ({ log }: { log: Log }) => {
	return (
		<li className="flex flex-row justify-between m-1 p-1 bg-lime-100">
			<span className="text-black text-opacity-50 flex flex-row justify-start gap-1">
				<InfoCircle />
				{log.content}
			</span>
			<p className="font-mono text-xs text-black text-opacity-50">
				System Log, {formatISODate(log.created_at)}
			</p>
		</li>
	);
};

export const LogItem = ({ log }: { log: Log }) => {
	if (log.source === "System") {
		return <SystemItem log={log} />;
	}
	return <DefaultItem log={log} />;
};
