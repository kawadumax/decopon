import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const LoginPage = lazy(() => import("@/scripts/pages/auth/Login"));

export const Route = createFileRoute("/guest/login")({
  component: LoginPage,
  context: () => ({ title: t("auth.login.title") }),
});
