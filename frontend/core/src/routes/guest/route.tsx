import { Outlet, createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const GuestLayout = lazy(() => import("@/scripts/layouts/GuestLayout"));

export const Route = createFileRoute("/guest")({
  component: () => (
    <GuestLayout>
      <Outlet />
    </GuestLayout>
  ),
});
