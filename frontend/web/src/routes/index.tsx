import Welcome from "@/pages/Welcome";
import type { User } from "@/types/index.d";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

// dummy auth object
const auth = {
  user: {
    id: 1,
    name: "test",
    email: "user@example.com",
    preference: {
      locale: "en",
    },
  } as User,
};

export const Route = createFileRoute("/")({
  component: () => <Welcome />,
  context: () => ({ title: t("welcome.title") }),
});
