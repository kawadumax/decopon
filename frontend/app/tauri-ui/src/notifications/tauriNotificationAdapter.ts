import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type {
  NativeNotificationAdapter,
  NativeNotificationPayload,
} from "@decopon/core";

const safeRequestPermission = async () => {
  try {
    return await requestPermission();
  } catch (error) {
    console.error("Failed to request notification permission", error);
    return false;
  }
};

const safeIsPermissionGranted = async () => {
  try {
    return await isPermissionGranted();
  } catch (error) {
    console.error("Failed to read notification permission", error);
    return false;
  }
};

const safeSendNotification = async (payload: NativeNotificationPayload) => {
  try {
    await sendNotification(payload);
  } catch (error) {
    console.error("Failed to send native notification", error);
  }
};

export const tauriNotificationAdapter: NativeNotificationAdapter = {
  isPermissionGranted: safeIsPermissionGranted,
  requestPermission: safeRequestPermission,
  sendNotification: safeSendNotification,
};
