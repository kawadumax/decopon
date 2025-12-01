import { useNativeNotificationSettingsStore } from "../store/nativeNotification";

export type NativeNotificationPayload = {
  title: string;
  body?: string;
};

export type PermissionPrompt = () => Promise<boolean> | boolean;

export interface NativeNotificationAdapter {
  isPermissionGranted: () => Promise<boolean | string>;
  requestPermission: () => Promise<boolean | string>;
  sendNotification: (payload: NativeNotificationPayload) => Promise<void>;
}

let activeAdapter: NativeNotificationAdapter | null = null;

const normalizePermissionResult = (result: unknown): boolean => {
  if (typeof result === "string") {
    return result.toLowerCase() === "granted";
  }
  return Boolean(result);
};

const runPrompt = async (prompt?: PermissionPrompt): Promise<boolean> => {
  if (!prompt) {
    return true;
  }
  try {
    return (await prompt()) !== false;
  } catch (error) {
    console.error("Failed to run notification permission prompt", error);
    return false;
  }
};

export const registerNativeNotificationAdapter = (
  adapter: NativeNotificationAdapter,
) => {
  activeAdapter = adapter;
};

export const unregisterNativeNotificationAdapter = () => {
  activeAdapter = null;
};

export const hasNativeNotificationAdapter = () => Boolean(activeAdapter);

export const isNativeNotificationEnabled = () =>
  useNativeNotificationSettingsStore.getState().enabled;

export const setNativeNotificationEnabled = (enabled: boolean) => {
  const store = useNativeNotificationSettingsStore.getState();
  store.setEnabled(enabled);
};

export const resetNativeNotificationPrompt = () => {
  const store = useNativeNotificationSettingsStore.getState();
  store.setHasPrompted(false);
};

export const ensureNativeNotificationPermission = async (options?: {
  prompt?: PermissionPrompt;
}) => {
  const adapter = activeAdapter;
  if (!adapter) {
    return false;
  }

  const store = useNativeNotificationSettingsStore.getState();
  if (!store.enabled) {
    return false;
  }

  try {
    const granted = normalizePermissionResult(
      await adapter.isPermissionGranted(),
    );
    if (granted) {
      return true;
    }

    if (!store.hasPrompted) {
      const shouldRequest = await runPrompt(options?.prompt);
      store.setHasPrompted(true);
      if (!shouldRequest) {
        store.setEnabled(false);
        return false;
      }
    }

    const permission = await adapter.requestPermission();
    const grantedAfterRequest = normalizePermissionResult(permission);
    if (!grantedAfterRequest) {
      store.setEnabled(false);
    }
    return grantedAfterRequest;
  } catch (error) {
    console.error("Native notification permission check failed", error);
    return false;
  }
};

export const sendNativeNotification = async (
  payload: NativeNotificationPayload,
  options?: { prompt?: PermissionPrompt },
) => {
  const adapter = activeAdapter;
  if (!adapter) {
    return false;
  }

  const store = useNativeNotificationSettingsStore.getState();
  if (!store.enabled) {
    return false;
  }

  const permissionGranted = await ensureNativeNotificationPermission({
    prompt: options?.prompt,
  });
  if (!permissionGranted) {
    return false;
  }

  try {
    await adapter.sendNotification(payload);
    return true;
  } catch (error) {
    console.error("Failed to send native notification", error);
    return false;
  }
};
