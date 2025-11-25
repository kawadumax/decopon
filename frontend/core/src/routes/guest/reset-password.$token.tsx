import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const ResetPasswordPage = lazy(
  () => import("@/scripts/pages/auth/ResetPassword"),
);

export const Route = createFileRoute("/guest/reset-password/$token")({
  component: ResetPasswordPage,
  context: () => ({ title: t("auth.resetPassword.title") }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      email: search.email as string,
    };
  },
});
