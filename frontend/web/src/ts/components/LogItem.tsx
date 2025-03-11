import { formatISODate } from "@/lib/utils";
import { type Log, LogSource } from "@/types/index.d";
import { InfoCircle } from "@mynaui/icons-react";
import { useTranslation } from "react-i18next";

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
	const { t } = useTranslation();
	return (
		<li className="flex flex-row justify-between m-1 p-1 bg-lime-100">
			<span className="text-black text-opacity-50 flex flex-row justify-start gap-1">
				<InfoCircle />
				{log.content}
			</span>
			<p className="font-mono text-xs text-black text-opacity-50">
				{t("log.type.system")}, {formatISODate(log.created_at)}
			</p>
		</li>
	);
};

export const LogItem = ({ log }: { log: Log }) => {
	if (log.source === LogSource.System) {
		return <SystemItem log={log} />;
	}
	return <DefaultItem log={log} />;
};
