import ForgotPassword from "@/pages/auth/ForgotPassword";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/forgot-password")({
  component: ForgotPassword,
  context: () => ({ title: t("auth.forgotPassword.title") }),
});
