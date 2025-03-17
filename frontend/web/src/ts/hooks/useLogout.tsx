import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useApi } from "./useApi";

export function useLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const logout = useCallback(async () => {
    setLoading(true);
    api.post(
      route("logout"),
      {},
      (response) => {
        router.navigate({ to: "/" });
      },
      (response) => {
        setLoading(false);
        return;
      },
    );
  }, [router, api]);

  return { logout, loading };
}
