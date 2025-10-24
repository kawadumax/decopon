let cachedLocalStorage: Storage | null | undefined;
let hasLoggedLocalStorageError = false;

const isWindowAvailable = (): boolean => typeof window !== "undefined";

export const getLocalStorage = (): Storage | undefined => {
  if (cachedLocalStorage) {
    return cachedLocalStorage;
  }

  if (cachedLocalStorage === null) {
    return undefined;
  }

  if (!isWindowAvailable()) {
    cachedLocalStorage = null;
    return undefined;
  }

  try {
    cachedLocalStorage = window.localStorage;
    return cachedLocalStorage;
  } catch (error) {
    cachedLocalStorage = null;
    if (!hasLoggedLocalStorageError) {
      hasLoggedLocalStorageError = true;
      // Keep console.error to aid debugging when storage is unavailable (e.g. private mode).
      console.error("Failed to access localStorage", error);
    }
    return undefined;
  }
};

export const withLocalStorage = <T>(
  callback: (storage: Storage) => T,
): T | undefined => {
  const storage = getLocalStorage();
  if (!storage) {
    return undefined;
  }
  return callback(storage);
};
