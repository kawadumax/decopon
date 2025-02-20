import { timerStateAtom } from "@/Lib/atoms";
import { logger } from "@/Lib/utils";
import type { TimeEntry } from "@/types";
import type axios from "axios";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useApi } from "./useApi";

export const useTimeEntryApi = () => {
	const [timerState, setTimerState] = useAtom(timerStateAtom);
	const api = useApi();

	const hasActiveTimeEntry = useMemo(() => {
		return !!timerState?.timeEntry?.id;
	}, [timerState.timeEntry]);

	const updateTimeEntry = useCallback(
		(
			id: number,
			data: Partial<TimeEntry>,
			onSuccess: (response: axios.AxiosResponse) => void,
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
		(response: axios.AxiosResponse) => {
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

		if (hasActiveTimeEntry) {
			// timeEntryがあるがInterrupted
			updateTimeEntry(
				(timerState.timeEntry as TimeEntry).id,
				{
					started_at: new Date().toISOString(),
					ended_at: undefined,
					status: "In_Progress",
				},
				setResponseToAtom,
			);
		} else {
			// TimeEntryレコード作成
			api.post(
				route("api.time-entries.store"),
				{
					started_at: new Date().toISOString(),
					ended_at: undefined,
					status: "In_Progress",
				},
				setResponseToAtom,
			);
		}
	}, [timerState, api, updateTimeEntry, hasActiveTimeEntry, setResponseToAtom]);

	const interruptTimeEntry = useCallback(() => {
		if (!hasActiveTimeEntry) return;
		updateTimeEntry(
			(timerState.timeEntry as TimeEntry).id,
			{
				ended_at: new Date().toISOString(),
				status: "Interrupted",
			},
			setResponseToAtom,
		);
	}, [timerState, hasActiveTimeEntry, updateTimeEntry, setResponseToAtom]);

	const completeTimeEntry = useCallback(() => {
		if (!hasActiveTimeEntry) return;

		updateTimeEntry(
			(timerState.timeEntry as TimeEntry).id,
			{
				ended_at: new Date().toISOString(),
				status: "Completed",
			},
			setUndefinedToAtom,
		);
	}, [timerState, updateTimeEntry, hasActiveTimeEntry, setUndefinedToAtom]);

	const abandoneTimeEntry = useCallback(() => {
		if (!hasActiveTimeEntry) return;

		updateTimeEntry(
			(timerState.timeEntry as TimeEntry).id,
			{
				ended_at: new Date().toISOString(),
				status: "Abandoned",
			},
			setUndefinedToAtom,
		);
	}, [timerState, updateTimeEntry, hasActiveTimeEntry, setUndefinedToAtom]);

	return {
		progressTimeEntry,
		interruptTimeEntry,
		completeTimeEntry,
		abandoneTimeEntry,
	};
};
