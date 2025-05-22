import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { callApi } from "@lib/apiClient";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DemoCautionWithAccount } from "./partials/DemoCaution";

type LoginData = {
  email: string;
  password: string;
};

interface ErrorResponse {
  data: {
    message?: string;
  };
}

const loginMutationFn = async (loginData: LoginData) => {
  await callApi("get", route("sanctum.csrf-cookie"));
  const res = await callApi("post", route("login"), loginData);
  if (!res.user) {
    throw new Error("Login failed");
  }
  return res;
};

export default function Login() {
  const [status, setStatus] = useState("");
  const { t } = useTranslation();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: loginMutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth"], data);
    },
    onError: (error: AxiosError) => {
      console.error("Login Error:", error);
      const message = (error.response as ErrorResponse).data.message;
      if (message) {
        setStatus(message);
      }
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      mutation.mutate(value, {
        onError: () => {
          formApi.reset();
        },
        onSuccess: () => {
          navigate({ to: "/auth/dashboard" });
        },
      });
    },
  });

  return (
    <>
      {status && (
        <div className="mb-4 font-medium text-green-600 text-sm">{status}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DemoCautionWithAccount
          header={t("auth.login.caution")}
          content={t("auth.login.demo")}
        />

        <div>
          <form.Field name="email">
            {(field) => (
              <>
                <InputLabel htmlFor={field.name} value={t("common.email")} />
                <TextInput
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  className="mt-1 block w-full"
                  autoComplete="username"
                  isFocused={true}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {/* エラーメッセージ表示例: */}
                {/* {field.state.errors.length > 0 && (
                  <div className="mt-2 text-red-600">{field.state.errors.join(', ')}</div>
                )} */}
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4">
          <form.Field name="password">
            {(field) => (
              <>
                <InputLabel htmlFor={field.name} value={t("common.password")} />
                <TextInput
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  className="mt-1 block w-full"
                  autoComplete="current-password"
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {/* エラーメッセージ表示例 */}
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Link
            to="/guest/forgot-password"
            className="rounded-md text-gray-600 text-sm underline hover:text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:focus:ring-offset-gray-800 dark:hover:text-gray-100"
          >
            {t("auth.login.forgotPassword")}
          </Link>
          <PrimaryButton className="ms-4" disabled={form.state.isSubmitting}>
            {t("auth.login.submit")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
