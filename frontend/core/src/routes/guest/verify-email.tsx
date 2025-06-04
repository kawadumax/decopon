import VerifyEmail from "@/scripts/pages/auth/VerifyEmail";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/verify-email")({
  component: VerifyEmail,
  context: () => ({ title: t("auth.verifyEmail.title") }),
});
