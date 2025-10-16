import Welcome from "@/scripts/pages/Welcome";
import { fetchAuthQueryOptions, queryClient } from "@/scripts/queries";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { t } from "i18next";

const SINGLE_USER_MODE_ENABLED =
  import.meta.env.VITE_APP_SINGLE_USER_MODE === "1" ||
  import.meta.env.VITE_APP_SINGLE_USER_MODE?.toLowerCase() === "true";

export const Route = createFileRoute("/")({
  loader: async () => {
    if (SINGLE_USER_MODE_ENABLED) {
      throw redirect({ to: "/auth/dashboard" });
    }
    // loaderで認証情報をプリフェッチし、クエリキャッシュに保存しようとする。
    // awaitしていないことに注意。
    queryClient.prefetchQuery(fetchAuthQueryOptions);
  },
  component: Welcome,
  context: () => ({ title: t("welcome.title") }),
});
