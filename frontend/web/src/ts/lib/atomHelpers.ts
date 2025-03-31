import { atom } from "jotai";
import { atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { callApi } from "./apiClient";

const createAtomWithQueryList = <T>(endpoint: string) => {
  return atomWithQuery<T[]>(() => ({
    queryKey: [endpoint],
    queryFn: async (): Promise<T[]> => {
      try {
        const res = await callApi("get", route(`api.${endpoint}.index`));
        console.log(res);
        return res[endpoint] ?? [];
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
      queryKey: unknown[];
      updater: (prev: unknown) => unknown;
    },
  ) => {
    const queryClient = get(queryClientAtom);
    const current = queryClient.getQueryData(queryKey);
    const next = updater(current);
    queryClient.setQueryData(queryKey, next);
  },
);

export const createResListAtom = <T>(endpoint: string) => {
  const queryAtom = createAtomWithQueryList<T>(endpoint);
  const resAtom = atom(
    (get) => get(queryAtom).data ?? [],
    (_get, set, newValues: T[]) => {
      set(updateQueryDataAtom, {
        queryKey: [endpoint],
        updater: (_prev) => newValues,
      });
    },
  );
  return resAtom;
};
