import Welcome from "@/scripts/pages/Welcome";
import { fetchAuthQueryOptions, queryClient } from "@/scripts/queries";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/")({
  loader: async () => {
    // loaderで認証情報をプリフェッチし、クエリキャッシュに保存しようとする。
    // awaitしていないことに注意。
    queryClient.prefetchQuery(fetchAuthQueryOptions);
  },
  component: Welcome,
  context: () => ({ title: t("welcome.title") }),
});
