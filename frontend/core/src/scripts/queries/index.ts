import { QueryClient } from "@tanstack/react-query";
import { fetchAuth } from "./apiClient";

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
