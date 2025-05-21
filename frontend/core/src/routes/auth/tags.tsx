import Index from "@/pages/tag/Index";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/auth/tags")({
  component: Index,
  context: () => ({ title: t("tag.title") }),
});
