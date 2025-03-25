import { callApi } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import Welcome from "@/pages/Welcome";
import type { User } from "@/types";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

const fetchUser = async () => {
  const user: User = await callApi("get", route("get-user"));
  return { user };
};

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      // Tanstack Queryのキャッシュが無ければfetch
      const user = await queryClient.fetchQuery({
        queryKey: ["auth"],
        queryFn: fetchUser,
        staleTime: 1000 * 60 * 5, // 5分キャッシュ
        initialData: { user: undefined },
      });
      return { user };
    } catch (_error) {
      return { user: undefined };
    }
  },
  component: () => <Welcome />,
  context: () => ({ title: t("welcome.title") }),
});
