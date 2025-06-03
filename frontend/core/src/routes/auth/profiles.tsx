import Edit from "@/scripts/pages/profile/Edit";
import { callApi } from "@lib/apiClient";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { t } from "i18next";
import { route } from "ziggy-js";

export const Route = createFileRoute("/auth/profiles")({
  loader: async () => {
    const { status, mustVerifyEmail } = await callApi(
      "get",
      route("api.profile.edit"),
    );
    return { status, mustVerifyEmail };
  },
  component: () => {
    const { status, mustVerifyEmail } = useLoaderData({
      from: "/auth/profiles",
    });
    return <Edit status={status} mustVerifyEmail={mustVerifyEmail} />;
  },
  context: () => ({ title: t("profile.title") }),
});
