import Register from "@/pages/auth/Register";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/guest/register")({
  component: Register,
  context: () => ({ title: t("auth.register.title") }),
});
