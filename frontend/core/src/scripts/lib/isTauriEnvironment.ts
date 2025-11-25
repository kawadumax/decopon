import { getTauriInvoke } from "@/scripts/api/client/transports/ipc/shared";

export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(getTauriInvoke());
}

