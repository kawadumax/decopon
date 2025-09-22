import { ProfileService } from "@/scripts/api/services/ProfileService";
import type { Auth } from "@/scripts/types";
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import { Transition } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";


type UpdatePasswordData = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

const updatePassword = async (updateData: UpdatePasswordData) => {
  try {
      await ProfileService.updatePassword(updateData);
  } catch (e) {
    throw new Error(String(e));
  }
};

export default function UpdatePasswordForm({
  className = "",
}: {
  className: string;
}) {
  const { t } = useTranslation();
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const auth = queryClient.getQueryData(["auth"]) as Auth;
  const [status, setStatus] = useState("");
  const mutation = useMutation({
    mutationFn: updatePassword,
  });

  const form = useForm({
    defaultValues: {
      username: auth?.user?.name ?? "",
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    onSubmit: async ({ value, formApi }) => {
      mutation.mutate(value, {
        onSettled: () => {
          formApi.reset();
        },
        onError: () => {
          setStatus(t("profile.updatePassword.error"));
        },
      });
    },
  });

  return (
    <section className={className}>
      <header>
        <h2 className="font-medium text-gray-900 text-lg dark:text-gray-100">
          {t("profile.updatePassword.title")}
        </h2>

        <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
          {t("profile.updatePassword.description")}
        </p>
      </header>

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
        className="mt-6 space-y-6"
      >
        <form.Field name="username">
          {(field) => (
            <input
              className="hidden"
              type="text"
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="username"
            />
          )}
        </form.Field>

        <div className="mt-4">
          <form.Field name="current_password">
            {(field) => (
              <>
                <InputLabel htmlFor={field.name} value="Current Password" />

                <TextInput
                  id={field.name}
                  ref={currentPasswordInput}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  className="mt-1 block w-full"
                  autoComplete="current-password"
                />

              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4">
          <form.Field name="password">
            {(field) => (
              <>
                <InputLabel htmlFor={field.name} value="New Password" />

                <TextInput
                  id={field.name}
                  ref={passwordInput}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type={field.name}
                  className="mt-1 block w-full"
                  autoComplete="new-password"
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
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  className="mt-1 block w-full"
                  autoComplete="new-password"
                />

              </>
            )}
          </form.Field>
        </div>

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={form.state.isSubmitting}>
            {t("common.save")}
          </PrimaryButton>

          <Transition
            show={mutation.isSuccess}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-gray-600 text-sm dark:text-gray-400">
              {t("profile.updatePassword.saved")}
            </p>
          </Transition>
        </div>
      </form>
    </section>
  );
}
