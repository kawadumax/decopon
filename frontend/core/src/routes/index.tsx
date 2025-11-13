import { fetchAuthQueryOptions, queryClient } from "@/scripts/queries";
import { createFileRoute, redirect } from "@tanstack/react-router";

const SINGLE_USER_MODE_ENABLED =
  import.meta.env.VITE_APP_SINGLE_USER_MODE === "1" ||
  import.meta.env.VITE_APP_SINGLE_USER_MODE?.toLowerCase() === "true";

export const Route = createFileRoute("/")({
  loader: async () => {
    if (SINGLE_USER_MODE_ENABLED) {
      throw redirect({ to: "/auth/tasks" });
    }

    const auth = await queryClient.ensureQueryData(fetchAuthQueryOptions);
    if (auth?.user?.id) {
      throw redirect({ to: "/auth/tasks" });
    }

    throw redirect({ to: "/guest/login" });
  },
});
