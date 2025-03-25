import PrimaryButton from "@/components/PrimaryButton";
import { callApi } from "@/lib/apiClient";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("");
  const form = useForm({
    defaultValues: {},
    onSubmit: async () => {
      try {
        const res = await callApi("post", route("verification.send"));
        setStatus(res.status);
      } catch (error) {
        console.error("API error:", error);
      }
    },
  });

  return (
    <>
      <div className="mb-4 text-gray-600 text-sm dark:text-gray-400">
        {t("auth.verifyEmail.description")}
      </div>

      {status === "verification-link-sent" && (
        <div className="mb-4 font-medium text-green-600 text-sm dark:text-green-400">
          {t("auth.verifyEmail.linkSent")}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="mt-4 flex items-center justify-between">
          <PrimaryButton disabled={form.state.isSubmitting}>
            {t("auth.verifyEmail.resend")}
          </PrimaryButton>

          <Link
            to={route("logout")}
            className="rounded-md text-gray-600 text-sm underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:text-gray-400 dark:focus:ring-offset-gray-800 dark:hover:text-gray-100"
          >
            {t("auth.verifyEmail.logout")}
          </Link>
        </div>
      </form>
    </>
  );
}
