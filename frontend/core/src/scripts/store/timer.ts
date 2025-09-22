import { getToday } from "@lib/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DecoponSession } from "../types";

interface TimerState {
  elapsedTime: number;
  startedTime: number | null;
  isWorkTime: boolean;
  isRunning: boolean;
  cycles: {
    date: string;
    count: number;
  };
  decoponSession?: DecoponSession;
}

interface TimerStore {
  timerState: TimerState;
  workTime: number;
  breakTime: number;
  setTimerState: (updater: (prev: TimerState) => TimerState) => void;
  setIsRunning: (isRunning: boolean) => void;
  setIsWorkTime: (isWorkTime: boolean) => void;
  setCycles: (cycles: { date: string; count: number }) => void;
  setElapsedTime: (elapsedTime: number) => void;
  setWorkTime: (minutes: number) => void;
  setBreakTime: (minutes: number) => void;
  getSpan: () => number;
  remainTime: () => number;
  setRemainTime: (newTime: number) => void;
  resetRemainTime: (command: string) => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      timerState: {
        elapsedTime: 0,
        startedTime: null,
        decoponSession: undefined,
        isWorkTime: true,
        isRunning: false,
        cycles: {
          date: getToday(),
          count: 0,
        },
      },
      workTime: 25 * 60 * 1000,
      breakTime: 10 * 60 * 1000,
      setTimerState: (updater) =>
        set((state) => ({ timerState: updater(state.timerState) })),
      setIsRunning: (isRunning) =>
        set((state) => ({ timerState: { ...state.timerState, isRunning } })),
      setIsWorkTime: (isWorkTime) =>
        set((state) => ({ timerState: { ...state.timerState, isWorkTime } })),
      setCycles: (cycles) =>
        set((state) => ({ timerState: { ...state.timerState, cycles } })),
      setElapsedTime: (elapsedTime) =>
        set((state) => ({ timerState: { ...state.timerState, elapsedTime } })),
      setWorkTime: (minutes) => set({ workTime: minutes * 60 * 1000 }),
      setBreakTime: (minutes) => set({ breakTime: minutes * 60 * 1000 }),
      getSpan: () =>
        get().timerState.isWorkTime ? get().workTime : get().breakTime,
      remainTime: () => get().getSpan() - get().timerState.elapsedTime,
      setRemainTime: (newTime) =>
        set((state) => ({
          timerState: {
            ...state.timerState,
            elapsedTime: get().getSpan() - newTime,
          },
        })),
      resetRemainTime: (command) => {
        const span = get().getSpan();
        switch (command) {
          case "RESET":
            set((state) => ({
              timerState: { ...state.timerState, elapsedTime: 0 },
            }));
            break;
          case "ZERO":
            set((state) => ({
              timerState: { ...state.timerState, elapsedTime: span },
            }));
            break;
          default:
            break;
        }
      },
    }),
    {
      name: "timerState",
      onRehydrateStorage: () => (state, error) => {
        if (error || !state?.timerState) return;
        const today = getToday();
        if (state.timerState.cycles.date !== today) {
          state.setTimerState?.((prev) => ({
            ...prev,
            cycles: {
              date: today,
              count: 0,
            },
          }));
        }
      },
    },
  ),
);
