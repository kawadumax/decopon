import { SingleUserBootstrapUnavailableError } from "@/scripts/lib/singleUserBootstrap";
import { fetchAuthQueryOptions, queryClient } from "@/scripts/queries";
import { decoponSessionCyclesQueryOptions } from "@/scripts/queries/decoponSession";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { lazy } from "react";

const AuthenticatedLayout = lazy(
  () => import("@/scripts/layouts/AuthenticatedLayout"),
);

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
  component: () => (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  ),
});
