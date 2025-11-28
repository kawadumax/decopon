import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NativeNotificationSettingsState {
  enabled: boolean;
  hasPrompted: boolean;
  setEnabled: (enabled: boolean) => void;
  setHasPrompted: (hasPrompted: boolean) => void;
}

export const useNativeNotificationSettingsStore =
  create<NativeNotificationSettingsState>()(
    persist(
      (set) => ({
        enabled: true,
        hasPrompted: false,
        setEnabled: (enabled) => set({ enabled }),
        setHasPrompted: (hasPrompted) => set({ hasPrompted }),
      }),
      {
        name: "nativeNotificationSettings",
      },
    ),
  );
