import VerifyEmailToken from "@/scripts/pages/auth/VerifyEmailToken";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/verify-email/$token")({
  component: VerifyEmailToken,
  context: () => ({ title: t("auth.verifyEmail.title") }),
});
