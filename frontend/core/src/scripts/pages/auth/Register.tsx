import { AuthService } from "@/scripts/api/services/AuthService";
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
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
          await AuthService.register(value);
          navigate({
            to: "/guest/verify-email",
            search: { email: value.email },
          });
        } catch (error) {
          console.error("API error:", error);
          formApi.reset();
        }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
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
          className="rounded-md text-fg-secondary text-sm underline hover:text-fg-strong focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-fg-muted dark:focus:ring-offset-surface-inverse dark:hover:text-fg-inverse"
        >
          {t("auth.register.alreadyRegistered")}
        </Link>

        <PrimaryButton className="ms-4" disabled={form.state.isSubmitting}>
          {t("auth.register.submit")}
        </PrimaryButton>
      </div>
    </form>
  );
}
