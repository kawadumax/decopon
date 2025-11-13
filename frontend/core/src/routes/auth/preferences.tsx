import Index from "@/scripts/pages/preference/Index";
import { ProfileService } from "@/scripts/api/services/ProfileService";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { t } from "i18next";
import type { ProfileResponse } from "@/scripts/types";

export const Route = createFileRoute("/auth/preferences")({
  loader: async (): Promise<ProfileResponse> => {
    return await ProfileService.getProfile();
  },
  component: () => {
    const { status, mustVerifyEmail } = useLoaderData({
      from: "/auth/preferences",
    });
    return <Index status={status} mustVerifyEmail={mustVerifyEmail} />;
  },
  context: () => ({ title: t("preference.title") }),
});
