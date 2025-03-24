import ResetPassword from "@/pages/auth/ResetPassword";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/reset-password")({
  component: ResetPassword,
  context: () => ({ title: t("auth.resetPassword.title") }),
});
