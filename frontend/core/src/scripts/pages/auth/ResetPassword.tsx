import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import { callApi } from "@lib/apiClient";
import { useForm } from "@tanstack/react-form";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("");
  const routeApi = getRouteApi("/guest/reset-password/$token");
  const token = routeApi.useParams({
    select: (params) => params.token,
  });
  const { email } = routeApi.useSearch();
  const form = useForm({
    defaultValues: {
      token: token,
      email: email,
      password: "",
      password_confirmation: "",
    },
    async onSubmit({ value, formApi }) {
      try {
        const res = await callApi("post", route("password.store"), value);
        setStatus(res.status);
      } catch (error) {
        console.error("API error:", error);
      } finally {
        formApi.reset();
      }
    },
  });

  return (
    <>
      <div className="mb-4 text-gray-600 text-sm dark:text-gray-400">
        {t("auth.forgotPassword.description")}
      </div>

      {status && (
        <div className="mb-4 font-medium text-green-600 text-sm dark:text-green-400">
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
        <div className="mt-4">
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
                  autoComplete="email"
                  isFocused={true}
                />

                {/* <InputError message={form.errors.email} className="mt-2" /> */}
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4">
          <form.Field name="password">
            {(field) => (
              <>
                <InputLabel htmlFor={field.name} value="Password" />
                <TextInput
                  id={field.name}
                  type="password"
                  name="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="mt-1 block w-full"
                  autoComplete="new-password"
                  isFocused={false}
                />
                {/* <InputError message={form.errors.email} className="mt-2" /> */}
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4">
          <form.Field name="password_confirmation">
            {(field) => (
              <>
                <InputLabel htmlFor={field.name} value="Confirm Password" />

                <TextInput
                  type="password"
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="mt-1 block w-full"
                  autoComplete="new-password"
                />

                {/* <InputError message={errors.password_confirmation} className="mt-2" /> */}
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <PrimaryButton className="ms-4" disabled={form.state.isSubmitting}>
            {t("auth.resetPassword.submit")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
