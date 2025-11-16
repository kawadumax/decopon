import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const TagsPage = lazy(() => import("@/scripts/pages/tag/Index"));

export const Route = createFileRoute("/auth/tags")({
  component: TagsPage,
  context: () => ({ title: t("tag.title") }),
});
