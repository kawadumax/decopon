import Welcome from "@/pages/Welcome";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/")({
  component: () => <Welcome />,
  context: () => ({ title: t("welcome.title") }),
});
