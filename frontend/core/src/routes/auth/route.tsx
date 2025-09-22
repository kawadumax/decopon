import Authenticated from "@/scripts/layouts/AuthenticatedLayout";
import { fetchAuthQueryOptions, queryClient } from "@/scripts/queries";
import { decoponSessionCyclesQueryOptions } from "@/scripts/queries/decoponSession";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

// 失敗時にはリダイレクト
const requireAuth = async () => {
  const auth = await queryClient.ensureQueryData(fetchAuthQueryOptions);
  if (!auth.user) {
    queryClient.removeQueries({ queryKey: ["auth"] });
    throw redirect({ to: "/guest/login" });
  }
  await queryClient.ensureQueryData(decoponSessionCyclesQueryOptions);
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
