import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const VerifyEmailPage = lazy(() => import("@/scripts/pages/auth/VerifyEmail"));

export const Route = createFileRoute("/guest/verify-email/")({
  component: VerifyEmailPage,
  context: () => ({ title: t("auth.verifyEmail.title") }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      email: typeof search.email === "string" ? search.email : "",
    };
  },
});
