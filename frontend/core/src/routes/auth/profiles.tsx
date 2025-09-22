import Edit from "@/scripts/pages/profile/Edit";
import { ProfileService } from "@/scripts/api/services/ProfileService";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { t } from "i18next";
import type { ProfileResponse } from "@/scripts/types";

export const Route = createFileRoute("/auth/profiles")({
  loader: async (): Promise<ProfileResponse> => {
    return await ProfileService.getProfile();
  },
  component: () => {
    const { status, mustVerifyEmail } = useLoaderData({
      from: "/auth/profiles",
    });
    return <Edit status={status} mustVerifyEmail={mustVerifyEmail} />;
  },
  context: () => ({ title: t("profile.title") }),
});
