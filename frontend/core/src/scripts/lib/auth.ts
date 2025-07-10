import type { User } from "@/scripts/types";
import { callApi } from "@lib/apiClient";
import { queryClient } from "@lib/queryClient";
import { redirect } from "@tanstack/react-router";
import { route } from "ziggy-js";

export const fetchAuth = async (): Promise<{ user: User }> => {
  const user = await callApi("get", route("get-user"));
  return { user };
};

export const checkAuth = async (): Promise<{ user: User | undefined }> => {
  try {
    // ensureQueryDataは、クエリが存在しない場合はフェッチを行い、存在する場合はキャッシュされたデータを返す
    const auth = await queryClient.ensureQueryData({
      queryKey: ["auth"],
      queryFn: fetchAuth,
    });
    return auth;
  } catch {
    const auth = { user: undefined };
    queryClient.setQueryData(["auth"], auth);
    return auth;
  }
};

// 「失敗時にはリダイレクト」用
export const requireAuth = async () => {
  const auth = await checkAuth();
  if (!auth.user) {
    queryClient.removeQueries({ queryKey: ["auth"] });
    throw redirect({ to: "/guest/login" });
  }
  return auth;
};
