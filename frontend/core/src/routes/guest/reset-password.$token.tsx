import ResetPassword from "@/scripts/pages/auth/ResetPassword";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/reset-password/$token")({
  component: ResetPassword,
  context: () => ({ title: t("auth.resetPassword.title") }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      email: search.email as string,
    };
  },
});
