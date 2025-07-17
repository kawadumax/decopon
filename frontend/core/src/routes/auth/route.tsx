import Authenticated from "@/scripts/layouts/AuthenticatedLayout";
import { queryClient, fetchAuthQueryOptions } from "@/scripts/queries";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

// 失敗時にはリダイレクト
const requireAuth = async () => {
  const auth = await queryClient.ensureQueryData(fetchAuthQueryOptions);
  if (!auth.user) {
    queryClient.removeQueries({ queryKey: ["auth"] });
    throw redirect({ to: "/guest/login" });
  }
};

export const Route = createFileRoute("/auth")({
  loader: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Authenticated>
      <Outlet />
    </Authenticated>
  );
}
