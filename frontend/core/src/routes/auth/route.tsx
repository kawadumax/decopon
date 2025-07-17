import Authenticated from "@/scripts/layouts/AuthenticatedLayout";
import { requireAuth } from "@/scripts/queries/auth";
import { Outlet, createFileRoute } from "@tanstack/react-router";

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
