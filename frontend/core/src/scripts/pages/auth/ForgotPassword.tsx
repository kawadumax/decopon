import { AuthService } from "@/scripts/api/services/AuthService";
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";


export default function ForgotPassword() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    async onSubmit({ value, formApi }) {
        try {
          const res = await AuthService.forgotPassword(value);
        setStatus((res as any).status);
      } catch (error) {
        console.error("API error:", error);
      } finally {
        formApi.reset();
      }
    },
  });

  return (
    <>
      <div className="mb-4 text-fg-secondary text-sm dark:text-fg-muted">
        {t("auth.forgotPassword.description")}
      </div>

      {status && (
        <div className="mb-4 font-medium text-success-foreground text-sm dark:text-success">
          {status}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <>
              <InputLabel htmlFor={field.name} value="Email" />
              <TextInput
                id={field.name}
                type="email"
                name="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 block w-full"
                isFocused={true}
              />

            </>
          )}
        </form.Field>
        <div className="mt-4 flex items-center justify-end">
          <PrimaryButton className="ms-4" disabled={form.state.isSubmitting}>
            {t("auth.forgotPassword.submit")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
