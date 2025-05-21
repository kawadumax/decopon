import { callApi } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@/types";
import { redirect } from "@tanstack/react-router";

export const fetchAuth = async (): Promise<{ user: User }> => {
  const user = await callApi("get", route("get-user"));
  return { user };
};

// 「失敗するかもしれないけど、まずは取得してみる」用
export const tryAuth = async (): Promise<{ user: User | undefined }> => {
  try {
    const auth = await queryClient.fetchQuery({
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
  const auth = await tryAuth();
  if (!auth.user) {
    queryClient.removeQueries({ queryKey: ["auth"] });
    throw redirect({ to: "/guest/login" });
  }
  return auth;
};
