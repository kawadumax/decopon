import { callApi } from "@/scripts/api/client";
import { endpoints } from "@/scripts/api/endpoints";
import { authStorage } from "@/scripts/lib/authStorage";
import { tokenStorage } from "@/scripts/lib/tokenStorage";
import { queryClient } from "@/scripts/queries/client";
import type { Auth, AuthResponse } from "@/scripts/types";

const SINGLE_USER_MODE_ENABLED =
  import.meta.env.VITE_APP_SINGLE_USER_MODE === "1" ||
  import.meta.env.VITE_APP_SINGLE_USER_MODE?.toLowerCase() === "true";

export const isSingleUserModeEnabled = () => SINGLE_USER_MODE_ENABLED;

export class SingleUserBootstrapUnavailableError extends Error {
  readonly cause?: unknown;

  constructor(message?: string, cause?: unknown) {
    super(message);
    this.name = "SingleUserBootstrapUnavailableError";
    this.cause = cause;
  }
}

export async function singleUserBootstrap() {
  if (!SINGLE_USER_MODE_ENABLED) {
    return;
  }

  try {
    const { token, user } = await callApi<AuthResponse>(
      "get",
      endpoints.auth.local.session,
    );

    if (token) {
      tokenStorage.setToken(token);
    }

    const auth: Auth = { user };
    authStorage.set(auth);
    queryClient.setQueryData(["auth"], auth);
  } catch (error) {
    tokenStorage.removeToken();
    authStorage.clear();
    queryClient.removeQueries({ queryKey: ["auth"] });
    throw new SingleUserBootstrapUnavailableError(
      "Failed to establish a single-user session.",
      error,
    );
  }
}
