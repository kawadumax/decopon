import { Log } from "@/types";
export const LogItem = ({ log }: { log: Log }) => {
    const formatDate = (isoString: string): string => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })
            .format(date)
            .replace(/\//g, "/");
    };
    return (
        <li className="rounded flex flex-row justify-between hover:ring-1 hover:ring-amber-400 m-1 p-1">
            <p className="text-base">{log.content}</p>
            <p className="font-mono text-xs text-black text-opacity-50">
                {formatDate(log.created_at)}
            </p>
        </li>
    );
};
