import { atom } from "jotai";
import { atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { callApi } from "./apiClient";

const createAtomWithQueryList = <T>(endpoint: string) => {
  return atomWithQuery<T[]>(() => ({
    queryKey: [endpoint],
    queryFn: async (): Promise<T[]> => {
      try {
        const data = await callApi("get", route(`api.${endpoint}.index`));
        console.log(data);
        return data[endpoint] ?? [];
      } catch (error) {
        console.log(error);
        return [];
      }
    },
    placeholderData: [],
  }));
};

export const updateQueryDataAtom = atom(
  null,
  (
    get,
    _set,
    {
      queryKey,
      updater,
    }: {
      queryKey: string[];
      updater: ((prev: unknown) => unknown) | unknown;
    },
  ) => {
    const queryClient = get(queryClientAtom);
    const current = queryClient.getQueryData(queryKey);
    const next = typeof updater === "function" ? updater(current) : updater;
    queryClient.setQueryData(queryKey, next);
  },
);

export const createResourceListAtom = <T>(endpoint: string) => {
  const queryAtom = createAtomWithQueryList<T>(endpoint);
  const resourceAtom = atom(
    (get) => get(queryAtom).data ?? [],
    (_get, set, updater: T[] | ((prev: T[]) => T[])) => {
      set(updateQueryDataAtom, {
        queryKey: [endpoint],
        updater,
      });
    },
  );
  return resourceAtom;
};
