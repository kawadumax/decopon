import { timerStateAtom } from "@/Lib/atoms";
import { logger } from "@/Lib/utils";
import { type TimeEntry, TimeEntryStatus } from "@/types/index.d";
import type { AxiosResponse } from "axios";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useApi } from "./useApi";

export const useTimeEntryApi = () => {
	const [timerState, setTimerState] = useAtom(timerStateAtom);
	const api = useApi();

	const activeTimeEntry = useMemo(() => {
		return timerState.timeEntry || null;
	}, [timerState.timeEntry]);

	const createUpdateData = useCallback(
		(status: TimeEntryStatus): Partial<TimeEntry> => {
			return {
				ended_at: new Date().toISOString(),
				status,
			};
		},
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
			setTimerState((prev) => {
				return { ...prev, timeEntry: response.data.time_entry };
			});
		},
		[setTimerState],
	);

	const setUndefinedToAtom = useCallback(() => {
		setTimerState((prev) => {
			return { ...prev, timeEntry: undefined };
		});
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

	return {
		progressTimeEntry,
		interruptTimeEntry,
		completeTimeEntry,
		abandoneTimeEntry,
	};
};
