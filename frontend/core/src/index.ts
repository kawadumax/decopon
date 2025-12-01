export { App } from "./scripts/App";
export { bootstrap } from "./scripts/bootstrap";
export { endpoints } from "./scripts/api/endpoints";
export {
  type NativeNotificationAdapter,
  type NativeNotificationPayload,
  type PermissionPrompt,
  registerNativeNotificationAdapter,
  unregisterNativeNotificationAdapter,
} from "./scripts/lib/nativeNotification";
export { singleUserBootstrap } from "./scripts/lib/singleUserBootstrap";
export { renderSplash } from "./scripts/lib/splash";
