import { t } from "i18next";
import { toast } from "sonner";

type ToastType = "success" | "error";

type ResolveOptions = {
  baseKey?: string;
  baseKeys?: (string | undefined)[];
  status?: number;
};

type NotifyOptions = ResolveOptions & {
  fallbackMessage?: string;
};

const collectBaseKeys = ({ baseKey, baseKeys }: ResolveOptions): string[] => {
  const keys = [] as string[];
  if (baseKey) {
    keys.push(baseKey);
  }
  if (baseKeys) {
    for (const key of baseKeys) {
      if (key) {
        keys.push(key);
      }
    }
  }
  return keys;
};

const resolve = (options: ResolveOptions): string | undefined => {
  const { status } = options;
  const keys = collectBaseKeys(options);

  for (const baseKey of keys) {
    const candidates: string[] = [];
    if (typeof status === "number") {
      candidates.push(`${baseKey}.${status}`);
    }
    candidates.push(`${baseKey}.default`, baseKey);

    for (const key of candidates) {
      const message = t(key, { defaultValue: "" });
      if (message) {
        return message;
      }
    }
  }

  return undefined;
};

const show = (type: ToastType, message?: string): void => {
  if (message) {
    toast[type](message);
  }
};

const notifyWithFallback = (
  type: ToastType,
  options: NotifyOptions = {},
): void => {
  const message = resolve(options) ?? options.fallbackMessage;
  show(type, message);
};

const notify = (
  type: ToastType,
  options?: string | NotifyOptions,
): void => {
  if (typeof options === "string" || typeof options === "undefined") {
    notifyWithFallback(type, { baseKey: options });
    return;
  }
  notifyWithFallback(type, options);
};

export const ToastMessageManager = {
  resolve,
  notify,
  notifyWithFallback,
  show,
};

export type { ToastType, NotifyOptions, ResolveOptions };
