import { formatISODate } from "@/scripts/lib/utils";
import { fetchLogsQueryOptions } from "@/scripts/queries";
import { tasksQueryOptions } from "@/scripts/queries/task";
import { Loading } from "@components/Loading";
import { Badge } from "@components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const StatisticsCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-xs dark:border-line-subtle dark:bg-surface-inverse">
      <p className="text-sm text-fg-muted dark:text-fg-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-fg-strong dark:text-fg-inverse">
        {value}
      </p>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-fg-muted dark:border-line-subtle dark:text-fg-muted">
    {message}
  </div>
);

const StatisticsPage = () => {
  const { t } = useTranslation();
  const {
    data: tasks = [],
    isPending: isTasksPending,
  } = useQuery(tasksQueryOptions());
  const {
    data: logs = [],
    isPending: isLogsPending,
  } = useQuery(fetchLogsQueryOptions());

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.completed)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
    [tasks],
  );

  const taskExecutionLogs = useMemo(
    () =>
      logs
        .filter((log) => log.task_id !== undefined)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
        .slice(0, 20),
    [logs],
  );

  const totalTasks = tasks.length;
  const totalCompleted = completedTasks.length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);
  const lastExecutionAt = completedTasks[0]?.updated_at;

  if (isTasksPending || isLogsPending) {
    return <Loading />;
  }

  return (
    <div className="min-h-full space-y-10 bg-surface px-4 py-12 sm:px-6 lg:px-8 dark:bg-surface-inverse">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-fg-strong dark:text-fg-inverse">
          {t("statistics.title")}
        </h1>
        <p className="text-fg-secondary text-base dark:text-fg-secondary">
          {t("statistics.description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticsCard
          label={t("statistics.cards.totalTasks")}
          value={totalTasks.toLocaleString()}
        />
        <StatisticsCard
          label={t("statistics.cards.completedTasks")}
          value={totalCompleted.toLocaleString()}
        />
        <StatisticsCard
          label={t("statistics.cards.completionRate")}
          value={`${completionRate}%`}
        />
        <StatisticsCard
          label={t("statistics.cards.lastExecution")}
          value={
            lastExecutionAt
              ? formatISODate(lastExecutionAt)
              : t("statistics.cards.noRecord")
          }
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-fg-strong dark:text-fg-inverse">
            {t("statistics.sections.completedTasks.title")}
          </h2>
          <p className="text-fg-secondary text-sm dark:text-fg-secondary">
            {t("statistics.sections.completedTasks.description")}
          </p>
        </div>
        {completedTasks.length === 0 ? (
          <EmptyState message={t("statistics.table.empty")} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-xs dark:border-line-subtle dark:bg-surface-inverse">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("statistics.table.headers.task")}</TableHead>
                  <TableHead>{t("statistics.table.headers.tags")}</TableHead>
                  <TableHead>
                    {t("statistics.table.headers.completedAt")}
                  </TableHead>
                  <TableHead>
                    {t("statistics.table.headers.description")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium text-fg-strong dark:text-fg-inverse">
                      {task.title}
                    </TableCell>
                    <TableCell>
                      {task.tags && task.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-xs font-medium"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-fg-muted dark:text-fg-muted">
                          {t("statistics.table.noTags")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-fg-secondary dark:text-fg-secondary">
                      {formatISODate(task.updated_at)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {task.description ? (
                        <p className="truncate text-sm text-fg dark:text-fg-secondary">
                          {task.description}
                        </p>
                      ) : (
                        <span className="text-sm text-fg-muted dark:text-fg-muted">
                          {t("statistics.table.noDescription")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-fg-strong dark:text-fg-inverse">
            {t("statistics.sections.timeline.title")}
          </h2>
          <p className="text-fg-secondary text-sm dark:text-fg-secondary">
            {t("statistics.sections.timeline.description")}
          </p>
        </div>
        {taskExecutionLogs.length === 0 ? (
          <EmptyState message={t("statistics.timeline.empty")} />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface shadow-xs dark:divide-line-subtle dark:border-line-subtle dark:bg-surface-inverse">
            {taskExecutionLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-fg-strong dark:text-fg-inverse">
                    {log.content}
                  </p>
                  <p className="text-sm text-fg-muted dark:text-fg-muted">
                    {t("statistics.timeline.taskLabel", {
                      id: log.task_id,
                    })}
                  </p>
                </div>
                <span className="text-sm text-fg-secondary dark:text-fg-secondary">
                  {formatISODate(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default StatisticsPage;

