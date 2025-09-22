import type { Auth } from "../types";

const AUTH_STORAGE_KEY = "auth";
export const AUTH_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

type StoredAuth = {
  data: Auth;
  storedAt: number;
};

const isExpired = (storedAt: number) => Date.now() - storedAt > AUTH_CACHE_TTL_MS;

const getLocalStorage = (): Storage | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.error("Failed to access localStorage", error);
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
    try {
      const parsed = JSON.parse(raw) as StoredAuth;
      if (!parsed || typeof parsed !== "object" || !("storedAt" in parsed)) {
        return undefined;
      }
      if (isExpired(parsed.storedAt)) {
        storage.removeItem(AUTH_STORAGE_KEY);
        return undefined;
      }
      return parsed.data;
    } catch (error) {
      console.error("Failed to parse auth cache", error);
      storage.removeItem(AUTH_STORAGE_KEY);
      return undefined;
    }
  },
  clear() {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    storage.removeItem(AUTH_STORAGE_KEY);
  },
};
