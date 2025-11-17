import { renderMarkdown } from "@/scripts/lib/markdown";
import { type Log, LogSource } from "@/scripts/types";
import { formatISODate } from "@lib/utils";
import { InfoCircle } from "@mynaui/icons-react";
import { useLogFilterStore } from "@store/log";
import { useTranslation } from "react-i18next";

const MarkdownContent = ({ content }: { content: string }) => (
  <div
    className="log-content whitespace-pre-wrap break-words"
    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
  />
);

const LogTags = ({ tags }: { tags: Log["tags"] }) => {
  const setSelectedTagIds = useLogFilterStore(
    (state) => state.setSelectedTagIds,
  );
  if (!tags || tags.length === 0) {
    return null;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <button
          type="button"
          key={tag.id}
          className="rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted transition hover:border-primary hover:text-primary"
          onClick={() => setSelectedTagIds([tag.id])}
        >
          #{tag.name}
        </button>
      ))}
    </div>
  );
};

const DefaultItem = ({ log }: { log: Log }) => {
  return (
    <li className="flex flex-col gap-2 border-1 border-hidden p-3 hover:border-primary hover:border-solid">
      <div className="flex flex-row items-start justify-between gap-4">
        <MarkdownContent content={log.content} />
        <p className="whitespace-nowrap font-mono text-fg-strong text-xs text-opacity-50">
          {formatISODate(log.created_at)}
        </p>
      </div>
      <LogTags tags={log.tags} />
    </li>
  );
};

const SystemItem = ({ log }: { log: Log }) => {
  const { t } = useTranslation();
  return (
    <li className="flex flex-col gap-2 rounded bg-success-muted p-3">
      <div className="flex flex-row items-start justify-between gap-4">
        <span className="flex flex-row justify-start gap-2 text-success-foreground text-opacity-70">
          <InfoCircle />
          <MarkdownContent content={log.content} />
        </span>
        <p className="whitespace-nowrap font-mono text-success-foreground text-xs text-opacity-70">
          {t("log.type.system")}, {formatISODate(log.created_at)}
        </p>
      </div>
      <LogTags tags={log.tags} />
    </li>
  );
};

export const LogItem = ({ log }: { log: Log }) => {
  if (log.source === LogSource.System) {
    return <SystemItem log={log} />;
  }
  return <DefaultItem log={log} />;
};
