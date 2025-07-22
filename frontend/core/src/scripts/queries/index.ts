import { type MutationOptions, QueryClient } from "@tanstack/react-query";
import { logger } from "../lib/utils";
import type { Log } from "../types";
import { fetchAuth, storeLog } from "./apiClient";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ウィンドウフォーカス時の自動再フェッチを無効化
      refetchOnWindowFocus: false,
      // 取得したデータが stale（古い）とみなされるまでの時間（ミリ秒）
      staleTime: 1000 * 60 * 5, // 5分間は古くならない
      retry: 0, // 失敗時のリトライ回数
    },
  },
});

export const fetchAuthQueryOptions = {
  queryKey: ["auth"],
  queryFn: fetchAuth,
};

export const storeLogMutationOptions: MutationOptions<
  Log,
  unknown,
  Partial<Log>
> = {
  mutationFn: storeLog,
  mutationKey: ["logs"],
  onError: (error: unknown) => {
    logger("error log storing", error);
  },
};
