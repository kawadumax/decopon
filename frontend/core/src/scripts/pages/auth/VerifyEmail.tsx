import { AuthService } from "@/scripts/api/services/AuthService";
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import { useForm } from "@tanstack/react-form";
import { getRouteApi } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ErrorResponse {
  message?: string;
}

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const routeApi = getRouteApi("/guest/verify-email/");
  const { email: initialEmail = "" } = routeApi.useSearch();
  const form = useForm({
    defaultValues: {
      email: initialEmail,
    },
    onSubmit: async ({ value }) => {
      setStatus("");
      setError("");

      try {
        const res = await AuthService.resendVerification(value);
        setStatus(res.status ?? "");
      } catch (err) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const message =
          axiosError.response?.data?.message ?? t("api.unknown.default");
        setError(message);
      }
    },
  });

  return (
    <>
      <div className="mb-4 text-fg-secondary text-sm dark:text-fg-muted">
        {t("auth.verifyEmail.description")}
      </div>

      {status === "verification-link-sent" && (
        <div className="mb-4 font-medium text-success text-sm">
          {t("auth.verifyEmail.linkSent")}
        </div>
      )}

      {error && (
        <div className="mb-4 font-medium text-destructive text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="mt-4">
          <form.Field name="email">
            {(field) => (
              <>
                <InputLabel htmlFor={field.name} value={t("common.email") ?? ""} />
                <TextInput
                  id={field.name}
                  type="email"
                  name={field.name}
                  value={field.state.value}
                  className="mt-1 block w-full"
                  autoComplete="email"
                  isFocused={true}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <PrimaryButton disabled={form.state.isSubmitting}>
            {t("auth.verifyEmail.resend")}
          </PrimaryButton>

          <a
            href="/logout"
            className="rounded-md text-fg-secondary text-sm underline hover:text-fg-strong focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-fg-muted dark:focus:ring-offset-surface-inverse dark:hover:text-fg-inverse"
          >
            {t("auth.verifyEmail.logout")}
          </a>
        </div>
      </form>
    </>
  );
}
