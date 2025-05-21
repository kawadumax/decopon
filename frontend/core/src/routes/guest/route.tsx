import Guest from "@/layouts/GuestLayout";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/guest")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Guest>
      <Outlet />
    </Guest>
  );
}
