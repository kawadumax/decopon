import { AuthService } from "@/scripts/api/services/AuthService";
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import { useState } from "react";

interface ErrorResponse {
  message?: string;
}

export default function ConfirmPassword() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const form = useForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      setStatus("");
      setError("");

      try {
        const res = await AuthService.confirmPassword(value);
        setStatus(res.status ?? "");
        formApi.reset();
      } catch (err) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const message =
          axiosError.response?.data?.message ?? t("api.unknown.default");
        setError(message);
        formApi.reset();
      }
    },
  });

  return (
    <>
      <div className="mb-4 text-fg-secondary text-sm dark:text-fg-muted">
        {t("auth.confirmPassword.description")}
      </div>

      {status === "password-confirmed" && (
        <div className="mb-4 font-medium text-success text-sm">
          {t("auth.confirmPassword.success")}
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
          <form.Field name="password">
            {(field) => (
              <>
                <InputLabel
                  htmlFor={field.name}
                  value={t("common.password")}
                />

                <TextInput
                  id={field.name}
                  type="password"
                  name={field.name}
                  value={field.state.value}
                  className="mt-1 block w-full"
                  isFocused={true}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />

              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <PrimaryButton className="ms-4" disabled={form.state.isSubmitting}>
            {t("auth.confirmPassword.submit")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
