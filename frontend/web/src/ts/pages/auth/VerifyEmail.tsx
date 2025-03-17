import PrimaryButton from "@/components/PrimaryButton";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

export default function VerifyEmail({ status }: { status?: string }) {
  const { t } = useTranslation();
  const { post, processing } = useForm({});

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    post(route("verification.send"));
  };

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
      <form onSubmit={submit}>
        <div className="mt-4 flex items-center justify-between">
          <PrimaryButton disabled={processing}>
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
