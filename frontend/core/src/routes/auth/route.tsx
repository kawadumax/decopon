import Authenticated from "@/scripts/layouts/AuthenticatedLayout";
import { SingleUserBootstrapUnavailableError } from "@/scripts/lib/singleUserBootstrap";
import { fetchAuthQueryOptions, queryClient } from "@/scripts/queries";
import { decoponSessionCyclesQueryOptions } from "@/scripts/queries/decoponSession";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

// 失敗時にはリダイレクト
const requireAuth = async () => {
  try {
    const auth = await queryClient.ensureQueryData(fetchAuthQueryOptions);
    if (!auth.user) {
      throw redirect({ to: "/guest/login" });
    }
    await queryClient.ensureQueryData(decoponSessionCyclesQueryOptions);
  } catch (error) {
    if (error instanceof SingleUserBootstrapUnavailableError) {
      throw new Response("Single-user session is unavailable.", {
        status: 503,
        statusText: "Service Unavailable",
      });
    }
    throw error;
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
