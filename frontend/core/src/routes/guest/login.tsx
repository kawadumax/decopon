import Login from "@/scripts/pages/auth/Login";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/login")({
  component: Login,
  context: () => ({ title: t("auth.login.title") }),
});
