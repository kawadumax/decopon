import ConfirmPassword from "@/scripts/pages/auth/ConfirmPassword";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/confirm-password")({
  component: ConfirmPassword,
  context: () => ({ title: t("auth.confirmPassword.title") }),
});
