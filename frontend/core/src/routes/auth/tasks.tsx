import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const TasksPage = lazy(() => import("@/scripts/pages/task/Index"));

export const Route = createFileRoute("/auth/tasks")({
  component: TasksPage,
  context: () => ({ title: t("task.title") }),
});
