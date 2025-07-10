import { fetchAuth } from "@/scripts/lib/auth";
import { queryClient } from "@/scripts/lib/queryClient";
import Welcome from "@/scripts/pages/Welcome";
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
