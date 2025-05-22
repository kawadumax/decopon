import { type Log, LogSource } from "@/scripts/types/index.d";
import { formatISODate } from "@lib/utils";
import { InfoCircle } from "@mynaui/icons-react";
import { useTranslation } from "react-i18next";

const DefaultItem = ({ log }: { log: Log }) => {
  return (
    <li className="flex flex-row justify-between border-1 border-hidden p-2 hover:border-amber-400 hover:border-solid">
      <p className="text-base">{log.content}</p>
      <p className="font-mono text-black text-xs text-opacity-50">
        {formatISODate(log.created_at)}
      </p>
    </li>
  );
};

const SystemItem = ({ log }: { log: Log }) => {
  const { t } = useTranslation();
  return (
    <li className="flex flex-row justify-between bg-lime-100 p-2">
      <span className="flex flex-row justify-start gap-1 text-black text-opacity-50">
        <InfoCircle />
        {log.content}
      </span>
      <p className="whitespace-nowrap font-mono text-black text-xs text-opacity-50">
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
