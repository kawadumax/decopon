import { timerStateAtom } from "@/lib/atoms";
import { getToday, logger } from "@/lib/utils";
import { type TimeEntry, TimeEntryStatus } from "@/types/index.d";
import type { AxiosResponse } from "axios";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useApi } from "./useApi";

export const useTimeEntryApi = () => {
  const [timerState, setTimerState] = useAtom(timerStateAtom);
  const api = useApi();

  const activeTimeEntry = useMemo(
    () => timerState.timeEntry || null,
    [timerState.timeEntry],
  );

  const createUpdateData = useCallback(
    (status: TimeEntryStatus): Partial<TimeEntry> => ({
      ended_at: new Date().toISOString(),
      status,
    }),
    [],
  );

  const updateTimeEntry = useCallback(
    (
      id: number,
      data: Partial<TimeEntry>,
      onSuccess: (response: AxiosResponse) => void,
    ) => {
      api.put(
        route("api.time-entries-id.update", id),
        data,
        (response) => {
          logger("Time entry updated:", response);
          onSuccess(response);
        },
        (error) => {
          logger("Error updating time entry:", error);
        },
      );
    },
    [api],
  );

  const setResponseToAtom = useCallback(
    (response: AxiosResponse) => {
      setTimerState((prev) => ({
        ...prev,
        timeEntry: response.data.time_entry,
      }));
    },
    [setTimerState],
  );

  const setUndefinedToAtom = useCallback(() => {
    setTimerState((prev) => ({ ...prev, timeEntry: undefined }));
  }, [setTimerState]);

  const progressTimeEntry = useCallback(() => {
    if (!timerState.isWorkTime) return;

    const data: Partial<TimeEntry> = {
      started_at: new Date().toISOString(),
      ended_at: undefined,
      status: TimeEntryStatus.InProgress,
    };

    if (activeTimeEntry) {
      // timeEntryがある場合はInterruptedされているということ
      updateTimeEntry(activeTimeEntry.id, data, setResponseToAtom);
    } else {
      // TimeEntryレコード作成
      api.post(route("api.time-entries.store"), data, setResponseToAtom);
    }
  }, [
    api,
    timerState.isWorkTime,
    updateTimeEntry,
    setResponseToAtom,
    activeTimeEntry,
  ]);

  const interruptTimeEntry = useCallback(() => {
    if (!activeTimeEntry) return;
    updateTimeEntry(
      activeTimeEntry.id,
      createUpdateData(TimeEntryStatus.Interrupted),
      setResponseToAtom,
    );
  }, [updateTimeEntry, setResponseToAtom, createUpdateData, activeTimeEntry]);

  const completeTimeEntry = useCallback(() => {
    if (!activeTimeEntry) return;

    updateTimeEntry(
      activeTimeEntry.id,
      createUpdateData(TimeEntryStatus.Completed),
      setUndefinedToAtom,
    );
  }, [updateTimeEntry, setUndefinedToAtom, createUpdateData, activeTimeEntry]);

  const abandoneTimeEntry = useCallback(() => {
    if (!activeTimeEntry) return;

    updateTimeEntry(
      activeTimeEntry.id,
      createUpdateData(TimeEntryStatus.Abandoned),
      setUndefinedToAtom,
    );
  }, [updateTimeEntry, setUndefinedToAtom, createUpdateData, activeTimeEntry]);

  const initCyclesOfTimeEntry = useCallback(() => {
    const today = getToday();
    if (timerState.cycles.date === today) return;
    api.get(
      route("api.time-entries.cycles", {
        date: today,
      }),
      (response) => {
        setTimerState((prev) => ({
          ...prev,
          cycles: response.data.cycles || {
            date: today,
            count: 0,
          },
        }));
      },
    );
  }, [api, setTimerState, timerState.cycles.date]);

  return {
    initCyclesOfTimeEntry,
    progressTimeEntry,
    interruptTimeEntry,
    completeTimeEntry,
    abandoneTimeEntry,
  };
};
