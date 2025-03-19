import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { callApi } from "@/lib/apiClient";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DemoCaution } from "./partials/DemoCaution";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const res = await callApi("post", route("register"), value);
        if (res.is_login) {
          navigate({ to: "/auth/dashboard" });
        }
      } catch (error) {
        // エラーメッセージ表示例
        // formApi.setError("email", "Email already exists");
        // formApi.setError("password", "Password is too short");
        // formApi.setError("password_confirmation", "Password confirmation does not match");
        console.error("API error:", error);
        formApi.reset();
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <DemoCaution
        header={t("auth.register.caution")}
        content={t("auth.register.demo")}
      />

      <div>
        <form.Field name="name">
          {(field) => (
            <>
              <InputLabel htmlFor={field.name} value="Name" />
              <TextInput
                id={field.name}
                name={field.name}
                value={field.state.value}
                className="mt-1 block w-full"
                autoComplete="name"
                isFocused={true}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
              {/* エラーメッセージ表示例 */}
              {/* {field.state.errors.length > 0 && (
              <div className="mt-2 text-red-600">
                {field.state.errors.join(", ")}
              </div>
            )} */}
            </>
          )}
        </form.Field>
      </div>

      <div className="mt-4">
        <form.Field name="email">
          {(field) => (
            <>
              <InputLabel htmlFor={field.name} value="Email" />
              <TextInput
                id={field.name}
                type="email"
                name={field.name}
                value={field.state.value}
                className="mt-1 block w-full"
                autoComplete="username"
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
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
                name={field.name}
                value={field.state.value}
                className="mt-1 block w-full"
                autoComplete="new-password"
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
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
                id={field.name}
                type="password"
                name={field.name}
                value={field.state.value}
                className="mt-1 block w-full"
                autoComplete="new-password"
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </>
          )}
        </form.Field>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <Link
          to="/guest/login"
          className="rounded-md text-gray-600 text-sm underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:text-gray-400 dark:focus:ring-offset-gray-800 dark:hover:text-gray-100"
        >
          {t("auth.register.alreadyRegistered")}
        </Link>

        <PrimaryButton className="ms-4">
          {t("auth.register.submit")}
        </PrimaryButton>
      </div>
    </form>
  );
}
