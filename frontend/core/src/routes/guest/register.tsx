import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const RegisterPage = lazy(() => import("@/scripts/pages/auth/Register"));

export const Route = createFileRoute("/guest/register")({
  component: RegisterPage,
  context: () => ({ title: t("auth.register.title") }),
});
