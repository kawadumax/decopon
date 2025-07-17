import Welcome from "@/scripts/pages/Welcome";
import { fetchAuth } from "@/scripts/queries/auth";
import { queryClient } from "@/scripts/queries/queryClient";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/")({
  loader: async () => {
    // loaderで認証情報をプリフェッチし、クエリキャッシュに保存しようとする。
    // awaitしていないことに注意。
    queryClient.prefetchQuery({
      queryKey: ["auth"],
      queryFn: fetchAuth,
    });
  },
  component: Welcome,
  context: () => ({ title: t("welcome.title") }),
});
