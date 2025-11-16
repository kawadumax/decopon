import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const ForgotPasswordPage = lazy(() => import("@/scripts/pages/auth/ForgotPassword"));

export const Route = createFileRoute("/guest/forgot-password")({
  component: ForgotPasswordPage,
  context: () => ({ title: t("auth.forgotPassword.title") }),
});
