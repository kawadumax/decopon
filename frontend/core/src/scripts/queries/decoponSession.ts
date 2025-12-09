import type {
  MutationOptions,
  QueryObserverOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { DecoponSessionService } from "../api/services/DecoponSessionService";
import { getToday, logger } from "../lib/utils";
import { useTimerStore } from "../store/timer";
import { queryClient } from ".";
import {
  type CycleCount,
  type DecoponSession,
  DecoponSessionStatus,
} from "../types";

type TimerState = ReturnType<typeof useTimerStore.getState>["timerState"];

/**
 * タイマー状態をまとめて更新するためのユーティリティ
 */
const updateTimerState = (
  updater: Partial<TimerState> | ((prev: TimerState) => Partial<TimerState>),
) => {
  const setTimerState = useTimerStore.getState().setTimerState;
  setTimerState((prev) => ({
    ...prev,
    ...(typeof updater === "function" ? updater(prev) : updater),
  }));
};

const setDecoponSession = (session?: DecoponSession) => {
  if (!session) return;
  updateTimerState({ decoponSession: session });
};

const resetDecoponSession = () => {
  updateTimerState({ decoponSession: undefined });
};

export const progressDecoponSessionMutationOptions: MutationOptions<
  DecoponSession | null,
  unknown,
  void
> = {
  mutationFn: async () => {
    const { timerState } = useTimerStore.getState();
    if (timerState.decoponSession) {
      return DecoponSessionService.progress(timerState.decoponSession.id);
    }
    return DecoponSessionService.store(DecoponSessionService.progressPayload());
  },
  mutationKey: ["decoponSession", "progress"],
  onSuccess: (data) => {
    if (data) setDecoponSession(data);
    updateTimerState({ isRunning: true });
  },
  onError: (err: unknown) => {
    logger("error progress decopon session", err);
  },
};

export const interruptDecoponSessionMutationOptions: MutationOptions<
  DecoponSession | null,
  unknown,
  void
> = {
  mutationFn: async () => {
    const { decoponSession } = useTimerStore.getState().timerState;
    if (!decoponSession) return null;
    return DecoponSessionService.interrupt(decoponSession.id);
  },
  mutationKey: ["decoponSession", "interrupt"],
  onSuccess: (data) => {
    if (data) setDecoponSession(data);
    updateTimerState({ isRunning: false });
  },
  onError: (err: unknown) => {
    logger("error interrupt decopon session", err);
  },
};

export const completeDecoponSessionMutationOptions: MutationOptions<
  DecoponSession | null,
  unknown,
  void
> = {
  mutationFn: async () => {
    const { decoponSession } = useTimerStore.getState().timerState;
    if (!decoponSession) return null;
    const data: Partial<DecoponSession> = {
      ended_at: new Date().toISOString(),
      status: DecoponSessionStatus.Completed,
    };
    return DecoponSessionService.update(decoponSession.id, data);
  },
  mutationKey: ["decoponSession", "complete"],
  onSuccess: (data) => {
    if (data) resetDecoponSession();
    const today = getToday();
    let shouldInvalidateCycles = false;
    updateTimerState((prev) => {
      const isSameDay = prev.cycles.date === today;
      if (!isSameDay) {
        shouldInvalidateCycles = true;
      }
      return {
        isRunning: false,
        isWorkTime: !prev.isWorkTime,
        elapsedTime: 0,
        startedTime: null,
        cycles: {
          date: today,
          count: isSameDay ? prev.cycles.count + 1 : 1,
        },
      };
    });
    if (shouldInvalidateCycles) {
      void queryClient.invalidateQueries({
        queryKey: ["decoponSession", "cycles"],
      });
    }
  },
  onError: (err: unknown) => {
    logger("error complete decopon session", err);
  },
};

export const abandonDecoponSessionMutationOptions: MutationOptions<
  DecoponSession | null,
  unknown,
  void
> = {
  mutationFn: async () => {
    const { decoponSession } = useTimerStore.getState().timerState;
    if (!decoponSession) return null;
    const data: Partial<DecoponSession> = {
      ended_at: new Date().toISOString(),
      status: DecoponSessionStatus.Abandoned,
    };
    return DecoponSessionService.update(decoponSession.id, data);
  },
  mutationKey: ["decoponSession", "abandon"],
  onSuccess: (data) => {
    if (data) resetDecoponSession();
    updateTimerState({ isRunning: false, elapsedTime: 0, startedTime: null });
  },
  onError: (err: unknown) => {
    logger("error abandon decopon session", err);
  },
};

export const decoponSessionsQueryOptions =
  (): UseQueryOptions<
    DecoponSession[],
    Error,
    DecoponSession[],
    readonly ["decoponSessions"]
  > => ({
    queryKey: ["decoponSessions"] as const,
    queryFn: async (): Promise<DecoponSession[]> => {
      try {
        return await DecoponSessionService.index();
      } catch (error) {
        logger("error fetch decopon sessions", error);
        return [];
      }
    },
    placeholderData: [] as DecoponSession[],
  });

export const decoponSessionCyclesQueryOptions = {
  queryKey: ["decoponSession", "cycles"] as const,
  queryFn: async (): Promise<CycleCount> => {
    const today = getToday();
    return DecoponSessionService.cycles(today);
  },
  onSuccess: (data: CycleCount) => {
    const setTimerState = useTimerStore.getState().setTimerState;
    const today = getToday();
    setTimerState((prev) => ({
      ...prev,
      cycles: data || { date: today, count: 0 },
    }));
  },
  onError: (err: unknown) => {
    logger("error fetch decopon session cycles", err);
  },
} as QueryObserverOptions<
  CycleCount,
  Error,
  CycleCount,
  readonly ["decoponSession", "cycles"]
>;
