import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const VerifyEmailTokenPage = lazy(
  () => import("@/scripts/pages/auth/VerifyEmailToken"),
);

export const Route = createFileRoute("/guest/verify-email/$token")({
  component: VerifyEmailTokenPage,
  context: () => ({ title: t("auth.verifyEmail.title") }),
});
