import { callApi } from "@lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { route } from "ziggy-js";

const logoutMutationFn = async (setLoading: (loading: boolean) => void) => {
  setLoading(true);
  try {
    await callApi("post", route("logout"));
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
