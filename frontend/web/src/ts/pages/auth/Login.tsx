import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";
import { DemoCaution } from "./partials/DemoCaution";

export default function Login({
  status,
  canResetPassword,
}: {
  status?: string;
  canResetPassword: boolean;
}) {
  const { t } = useTranslation();
  // const { data, setData, post, processing, errors, reset } = useForm({
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    // TODO: Implement this
    // post(route("login"), {
    // 	onFinish: () => reset(),
    // });
  };

  return (
    <>
      {status && (
        <div className="mb-4 font-medium text-green-600 text-sm">{status}</div>
      )}

      <form onSubmit={submit}>
        <DemoCaution
          header={t("auth.login.caution")}
          content={t("auth.login.demo")}
        />

        <div>
          <InputLabel htmlFor="email" value={t("common.email")} />
          <TextInput
            id="email"
            type="email"
            name="email"
            // value={data.email}
            className="mt-1 block w-full"
            autoComplete="username"
            isFocused={true}
            // onChange={(e) => setData("email", e.target.value)}
          />
          {/* <InputError message={errors.email} className="mt-2" /> */}
        </div>

        <div className="mt-4">
          <InputLabel htmlFor="password" value={t("common.password")} />
          <TextInput
            id="password"
            type="password"
            name="password"
            // value={data.password}
            className="mt-1 block w-full"
            autoComplete="current-password"
            // onChange={(e) => setData("password", e.target.value)}
          />
          {/* <InputError message={errors.password} className="mt-2" /> */}
        </div>

        <div className="mt-4 block">
          <label className="flex items-center" htmlFor="remember">
            <Checkbox
              id="remember"
              name="remember"
              // checked={data.remember}
              onCheckedChange={
                (checked) => {
                  console.log(checked);
                }
                // setData("remember", checked as boolean)
              }
            />
            <span className="ms-2 text-gray-600 text-sm dark:text-gray-400">
              {t("auth.login.rememberMe")}
            </span>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end">
          {canResetPassword && (
            <Link
              to={route("password.request")}
              className="rounded-md text-gray-600 text-sm underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:focus:ring-offset-gray-800 dark:hover:text-gray-100"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          )}

          <PrimaryButton className="ms-4">
            {t("auth.login.submit")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
