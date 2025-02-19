import { timerStateAtom } from "@/Lib/atoms";
import { logger } from "@/Lib/utils";
import type { TimeEntry } from "@/types";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { useApi } from "./useApi";

export const useTimeEntryApi = () => {
	const [timerState, setTimerState] = useAtom(timerStateAtom);
	const api = useApi();

	const progressTimeEntry = useCallback(() => {
		if (!timerState.isWorkTime) return;

		if (timerState.timeEntry) {
			// timeEntryがあるがInterrupted
			api.put(
				route("api.time-entries-id.update", timerState.timeEntry.id),
				{
					started_at: new Date().toISOString(),
					ended_at: undefined,
					status: "In_Progress",
				} as Partial<TimeEntry>,
				(response) => {
					logger("Time entry progressed:", response);
					setTimerState((prev) => {
						return { ...prev, timeEntry: response.data.time_entry };
					});
				},
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
				(response) => {
					// TimeEntryIdが返ってくるのでatomに保持する
					setTimerState((prev) => {
						return { ...prev, timeEntry: response.data.time_entry };
					});
				},
			);
		}
	}, [timerState, setTimerState, api]);

	const interruptTimeEntry = useCallback(() => {
		const timeEntryId = timerState?.timeEntry?.id;
		if (!timeEntryId) return;
		api.put(
			route("api.time-entries-id.update", timeEntryId),
			{
				ended_at: new Date().toISOString(),
				status: "Interrupted",
			} as Partial<TimeEntry>,
			(response) => {
				logger("Time entry interrupted:", response);
				setTimerState((prev) => {
					return {
						...prev,
						timeEntry: response.data.time_entry,
					};
				});
			},
		);
	}, [timerState, setTimerState, api]);

	const completeTimeEntry = useCallback(() => {
		const timeEntryId = timerState?.timeEntry?.id;
		if (!timeEntryId) return;
		api.put(
			route("api.time-entries-id.update", timeEntryId),
			{
				ended_at: new Date().toISOString(),
				status: "Completed",
			} as Partial<TimeEntry>,
			(response) => {
				logger("Time entry completed:", response);
				setTimerState((prev) => {
					return { ...prev, timeEntry: undefined };
				});
			},
		);
	}, [timerState, setTimerState, api]);

	const abandoneTimeEntry = useCallback(() => {
		if (!timerState?.timeEntry?.id) return;
		api.put(
			route("api.time-entries-id.update", timerState.timeEntry.id),
			{
				ended_at: new Date().toISOString(),
				status: "Abandoned",
			} as Partial<TimeEntry>,
			(response) => {
				logger("Time entry abandoned:", response);
				setTimerState((prev) => {
					return { ...prev, timeEntry: undefined };
				});
			},
		);
	}, [timerState, setTimerState, api]);
	return {
		progressTimeEntry,
		interruptTimeEntry,
		completeTimeEntry,
		abandoneTimeEntry,
	};
};
