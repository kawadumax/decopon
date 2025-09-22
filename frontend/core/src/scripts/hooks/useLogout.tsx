import { AuthService } from "@/scripts/api/services/AuthService";
import { authStorage } from "@/scripts/lib/authStorage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

const logoutMutationFn = async (setLoading: (loading: boolean) => void) => {
  setLoading(true);
  try {
    await AuthService.logout();
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

export function useLogout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => logoutMutationFn(setLoading),
    onSuccess: () => {
      queryClient.setQueryData(["auth"], { user: undefined });
      authStorage.clear();
      navigate({ to: "/" });
    },
    onError: (error) => {
      console.error("Logout Error", error);
    },
  });

  const logout = () => {
    mutation.mutate();
  };

  return { logout, loading };
}
