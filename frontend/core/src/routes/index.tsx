import Welcome from "@/pages/Welcome";
import { tryAuth } from "@lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/")({
  loader: async () => {
    return await tryAuth();
  },
  component: Welcome,
  context: () => ({ title: t("welcome.title") }),
});
