import Index from "@/pages/task/Index";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/auth/tasks")({
  component: Index,
  context: () => ({ title: t("task.title") }),
});
