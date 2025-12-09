import { Calendar } from "@/scripts/components/ui/calendar";
import { formatISODate } from "@/scripts/lib/utils";
import { decoponSessionsQueryOptions, tasksQueryOptions } from "@/scripts/queries";
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
import { format, isSameMonth, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DecoponSessionStatus, type DecoponSession, type Task } from "@/scripts/types";

const StatisticsCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-xs dark:border-line-subtle dark:bg-surface">
      <p className="text-sm text-fg-muted dark:text-fg-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-fg-strong dark:text-fg">
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

const formatDayKey = (value: string | Date) =>
  format(typeof value === "string" ? new Date(value) : value, "yyyy-MM-dd");

const getActivityLevel = (count: number, maxCount: number) => {
  if (count <= 0 || maxCount <= 0) return 0;
  const ratio = count / maxCount;
  if (ratio > 0.8) return 5;
  if (ratio > 0.6) return 4;
  if (ratio > 0.4) return 3;
  if (ratio > 0.2) return 2;
  return 1;
};

const formatSessionTimeRange = (session: DecoponSession) => {
  const start = session.started_at ? new Date(session.started_at) : undefined;
  const end = session.ended_at ? new Date(session.ended_at) : undefined;
  if (start && end) {
    return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
  }
  if (end) {
    return format(end, "HH:mm");
  }
  return "-";
};

const StatisticsPage = () => {
  const { t } = useTranslation();
  const {
    data: tasks = [],
    isPending: isTasksPending,
  } = useQuery(tasksQueryOptions());
  const {
    data: sessions = [],
    isPending: isSessionsPending,
  } = useQuery(decoponSessionsQueryOptions());

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

  const completedSessions = useMemo(
    () =>
      sessions
        .filter(
          (session) =>
            session.status === DecoponSessionStatus.Completed &&
            !!session.ended_at,
        )
        .sort(
          (a, b) =>
            new Date(b.ended_at as string).getTime() -
            new Date(a.ended_at as string).getTime(),
        ),
    [sessions],
  );

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, DecoponSession[]>();
    let maxCount = 0;
    completedSessions.forEach((session) => {
      if (!session.ended_at) return;
      const key = formatDayKey(session.ended_at);
      const next = [...(map.get(key) ?? []), session];
      map.set(key, next);
      if (next.length > maxCount) {
        maxCount = next.length;
      }
    });
    return { map, maxCount };
  }, [completedSessions]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    completedTasks.forEach((task) => {
      const key = formatDayKey(task.updated_at);
      const next = [...(map.get(key) ?? []), task];
      map.set(key, next);
    });
    return map;
  }, [completedTasks]);

  const totalTasks = tasks.length;
  const totalCompleted = completedTasks.length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);
  const lastCompletedSessionAt = completedSessions[0]?.ended_at;

  const defaultMonth = useMemo(
    () =>
      completedSessions[0]
        ? new Date(completedSessions[0].ended_at as string)
        : new Date(),
    [completedSessions],
  );

  const [month, setMonth] = useState<Date>(defaultMonth);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    setMonth(defaultMonth);
  }, [defaultMonth]);

  const firstCompletionInMonth = useMemo(() => {
    const candidates = Array.from(sessionsByDate.map.keys())
      .map((key) => parseISO(key))
      .filter((date) => isSameMonth(date, month))
      .sort((a, b) => a.getTime() - b.getTime());
    return candidates[0];
  }, [sessionsByDate, month]);

  useEffect(() => {
    setSelectedDate(firstCompletionInMonth);
  }, [firstCompletionInMonth]);

  const selectedDateKey = selectedDate ? formatDayKey(selectedDate) : undefined;
  const selectedDaySessions =
    selectedDateKey !== undefined
      ? sessionsByDate.map.get(selectedDateKey) ?? []
      : [];
  const selectedDayTasks =
    selectedDateKey !== undefined ? tasksByDate.get(selectedDateKey) ?? [] : [];

  const sessionIntensityModifiers = useMemo(() => {
    const modifiers = {
      sessionLevel1: [] as Date[],
      sessionLevel2: [] as Date[],
      sessionLevel3: [] as Date[],
      sessionLevel4: [] as Date[],
      sessionLevel5: [] as Date[],
    };
    sessionsByDate.map.forEach((value, key) => {
      const level = getActivityLevel(value.length, sessionsByDate.maxCount);
      if (level === 0) return;
      modifiers[`sessionLevel${level}` as const].push(parseISO(key));
    });
    return modifiers;
  }, [sessionsByDate]);

  if (isTasksPending || isSessionsPending) {
    return <Loading />;
  }

  return (
    <div className="min-h-full space-y-10 bg-surface px-4 py-12 sm:px-6 lg:px-8 dark:bg-surface">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-fg-strong dark:text-fg">
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
            lastCompletedSessionAt
              ? formatISODate(lastCompletedSessionAt as string)
              : t("statistics.cards.noRecord")
          }
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-fg-strong dark:text-fg">
            {t("statistics.sections.completedTasks.title")}
          </h2>
          <p className="text-fg-secondary text-sm dark:text-fg-secondary">
            {t("statistics.sections.completedTasks.description")}
          </p>
        </div>
        {completedSessions.length === 0 ? (
          <EmptyState message={t("statistics.calendar.emptySessions")} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-xs dark:border-line-subtle dark:bg-surface">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="flex flex-col items-start space-y-3 border-b border-line px-4 pb-4 pt-4 md:border-b-0 md:border-r md:border-line md:items-center md:text-center dark:border-line-subtle">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-secondary dark:text-fg-secondary">
                    {t("statistics.calendar.calendarLabel")}
                  </p>
                  <p className="text-lg font-semibold text-fg-strong dark:text-fg">
                    {format(month, "yyyy/MM")}
                  </p>
                </div>
                <div className="w-full md:flex md:justify-center">
                  <Calendar
                    mode="single"
                    month={month}
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date ?? selectedDate)}
                    onMonthChange={setMonth}
                    modifiers={sessionIntensityModifiers}
                    modifiersClassNames={{
                      sessionLevel1:
                        "bg-primary/10 text-fg-strong hover:bg-primary/15 focus-visible:bg-primary/15",
                      sessionLevel2:
                        "bg-primary/20 text-fg-strong hover:bg-primary/25 focus-visible:bg-primary/25",
                      sessionLevel3:
                        "bg-primary/40 text-primary-foreground hover:bg-primary/45 focus-visible:bg-primary/45",
                      sessionLevel4:
                        "bg-primary/60 text-primary-foreground hover:bg-primary/65 focus-visible:bg-primary/65",
                      sessionLevel5:
                        "bg-primary/80 text-primary-foreground hover:bg-primary/85 focus-visible:bg-primary/85",
                    }}
                  />
                </div>
                <p className="text-xs text-fg-muted dark:text-fg-muted">
                  {t("statistics.calendar.legend")}
                </p>
              </div>

              <div className="space-y-4 p-4">
                <div className="rounded-md border border-line bg-surface px-4 py-3 dark:border-line-subtle">
                  <p className="text-sm font-medium text-fg-strong dark:text-fg">
                    {selectedDate
                      ? t("statistics.calendar.selectedDate", {
                          date: format(selectedDate, "yyyy/MM/dd"),
                        })
                      : t("statistics.calendar.noSelection")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-fg-secondary dark:text-fg-secondary">
                    <span>
                      {t("statistics.calendar.sessionsCount", {
                        count: selectedDaySessions.length,
                      })}
                    </span>
                    <span>
                      {t("statistics.calendar.tasksCount", {
                        count: selectedDayTasks.length,
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-md border border-line bg-surface shadow-xs dark:border-line-subtle dark:bg-surface">
                    <div className="border-b border-line px-4 py-2 text-sm font-semibold text-fg-strong dark:border-line-subtle dark:text-fg">
                      {t("statistics.calendar.sessionListTitle")}
                    </div>
                    {selectedDaySessions.length === 0 ? (
                      <div className="p-4 text-sm text-fg-muted dark:text-fg-muted">
                        {t("statistics.calendar.noSessionsForDay")}
                      </div>
                    ) : (
                      <ul className="divide-y divide-line dark:divide-line-subtle">
                        {selectedDaySessions.map((session) => (
                          <li key={session.id} className="flex items-center justify-between px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-fg-strong dark:text-fg">
                                {t("statistics.calendar.sessionLabel", {
                                  id: session.id,
                                })}
                              </p>
                              <p className="text-xs text-fg-secondary dark:text-fg-secondary">
                                {formatSessionTimeRange(session)}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs font-semibold">
                              {t("decoponSession.status.completed")}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-md border border-line bg-surface shadow-xs dark:border-line-subtle dark:bg-surface">
                    <div className="border-b border-line px-4 py-2 text-sm font-semibold text-fg-strong dark:border-line-subtle dark:text-fg">
                      {t("statistics.calendar.taskListTitle")}
                    </div>
                    {selectedDayTasks.length === 0 ? (
                      <div className="p-4 text-sm text-fg-muted dark:text-fg-muted">
                        {t("statistics.calendar.emptyTasks")}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-fg dark:text-fg">
                              {t("statistics.table.headers.task")}
                            </TableHead>
                            <TableHead className="text-fg dark:text-fg">
                              {t("statistics.table.headers.tags")}
                            </TableHead>
                            <TableHead className="text-fg dark:text-fg">
                              {t("statistics.table.headers.completedAt")}
                            </TableHead>
                            <TableHead className="text-fg dark:text-fg">
                              {t("statistics.table.headers.description")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDayTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium text-fg-strong dark:text-fg">
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default StatisticsPage;
