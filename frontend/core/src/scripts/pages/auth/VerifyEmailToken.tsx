import { AuthService } from "@/scripts/api/services/AuthService";
import { authStorage } from "@/scripts/lib/authStorage";
import type { User } from "@/scripts/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

type VerifyResponse = { user?: User; token?: string };

export default function VerifyEmailToken() {
  const routeApi = getRouteApi("/guest/verify-email/$token");
  const token = routeApi.useParams({ select: (params) => params.token });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (tok: string): Promise<VerifyResponse> => {
      const res = (await AuthService.verifyEmail(tok)) as VerifyResponse;
      if (!res.user) {
        throw new Error("Verification failed");
      }
      return res;
    },
    onSuccess: (data) => {
      const auth = { user: data.user };
      queryClient.setQueryData(["auth"], auth);
      authStorage.set(auth);
      navigate({ to: "/auth/dashboard" });
    },
    onError: (error) => {
      console.error("Verify email error:", error);
    },
  });

  useEffect(() => {
    mutation.mutate(token);
  }, [token]);

  return (
    <div className="text-gray-600 text-sm dark:text-gray-400">
      メールを確認しています...
    </div>
  );
}
