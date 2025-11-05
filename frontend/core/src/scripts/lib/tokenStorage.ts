import { getLocalStorage } from "./browserStorage";

const TOKEN_STORAGE_KEY = "token";

export const tokenStorage = {
  setToken(token: string) {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    storage.setItem(TOKEN_STORAGE_KEY, token);
  },
  getToken(): string | undefined {
    const storage = getLocalStorage();
    if (!storage) {
      return undefined;
    }
    return storage.getItem(TOKEN_STORAGE_KEY) ?? undefined;
  },
  removeToken() {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    storage.removeItem(TOKEN_STORAGE_KEY);
  },
};
