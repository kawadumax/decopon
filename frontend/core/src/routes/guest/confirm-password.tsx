import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const ConfirmPasswordPage = lazy(
  () => import("@/scripts/pages/auth/ConfirmPassword"),
);

export const Route = createFileRoute("/guest/confirm-password")({
  component: ConfirmPasswordPage,
  context: () => ({ title: t("auth.confirmPassword.title") }),
});
