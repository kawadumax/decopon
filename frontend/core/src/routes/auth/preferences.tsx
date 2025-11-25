import { ProfileService } from "@/scripts/api/services/ProfileService";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";
import type { ProfileResponse } from "@/scripts/types";

const PreferencesPage = lazy(() => import("@/scripts/pages/preference/Index"));

export const Route = createFileRoute("/auth/preferences")({
  loader: async (): Promise<ProfileResponse> => {
    return await ProfileService.getProfile();
  },
  component: () => {
    const { status, mustVerifyEmail } = useLoaderData({
      from: "/auth/preferences",
    });
    return (
      <PreferencesPage status={status} mustVerifyEmail={mustVerifyEmail} />
    );
  },
  context: () => ({ title: t("preference.title") }),
});
