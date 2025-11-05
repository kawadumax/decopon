import { getLocalStorage } from "./browserStorage";
import type { Auth } from "../types";

const AUTH_STORAGE_KEY = "auth";
export const AUTH_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

type StoredAuth = {
  data: Auth;
  storedAt: number;
};

const isExpired = (storedAt: number) => Date.now() - storedAt > AUTH_CACHE_TTL_MS;

const parseStoredAuth = (raw: string): StoredAuth | undefined => {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.storedAt !== "number" ||
      typeof parsed.data === "undefined"
    ) {
      return undefined;
    }
    return parsed as StoredAuth;
  } catch (error) {
    console.error("Failed to parse auth cache", error);
    return undefined;
  }
};

export const authStorage = {
  set(auth: Auth) {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    const payload: StoredAuth = { data: auth, storedAt: Date.now() };
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  },
  get(): Auth | undefined {
    const storage = getLocalStorage();
    if (!storage) {
      return undefined;
    }
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = parseStoredAuth(raw);
    if (!parsed) {
      storage.removeItem(AUTH_STORAGE_KEY);
      return undefined;
    }

    if (isExpired(parsed.storedAt)) {
      storage.removeItem(AUTH_STORAGE_KEY);
      return undefined;
    }

    return parsed.data;
  },
  clear() {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    storage.removeItem(AUTH_STORAGE_KEY);
  },
};
