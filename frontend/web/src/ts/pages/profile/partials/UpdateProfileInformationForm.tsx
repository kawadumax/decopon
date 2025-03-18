import InputError from "@/components/InputError";
import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { Transition } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
// import { Link, useForm, usePage } from "@inertiajs/react";
// import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";
import { PostButton } from "./PostButton";

export default function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = "",
}: {
  mustVerifyEmail: boolean;
  status?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { auth } = useRouteContext({ from: "/auth" });
  const user = auth.user;

  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const form = useForm({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
    onSubmit: async (values) => {
      // ここでAPIを呼び出してプロフィールを更新する処理を実装
      // 例: await updateProfile(values);
      console.log("values:", values);
      setRecentlySuccessful(true);
      setTimeout(() => setRecentlySuccessful(false), 2000);
    },
  });
  // const { data, setData, patch, errors, processing, recentlySuccessful } =
  //   useForm({
  //     name: user.name,
  //     email: user.email,
  //   });

  // const submit: FormEventHandler = (e) => {
  //   e.preventDefault();

  //   patch(route("profile.update"));
  // };

  return (
    <section className={className}>
      <header>
        <h2 className="font-medium text-gray-900 text-lg dark:text-gray-100">
          {t("profile.updateProfileInformation.title")}
        </h2>

        <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
          {t("profile.updateProfileInformation.description")}
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="mt-6 space-y-6"
      >
        <form.Field name="name">
          {(field) => (
            <div>
              <InputLabel htmlFor="name" value="Name" />
              <TextInput
                id="name"
                className="mt-1 block w-full"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                required
                isFocused
                autoComplete="name"
              />
              <InputError
                className="mt-2"
                message={field.state.meta.errors[0]}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div>
              <InputLabel htmlFor="email" value="Email" />
              <TextInput
                id="email"
                type="email"
                className="mt-1 block w-full"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                required
                autoComplete="username"
              />
              <InputError
                className="mt-2"
                message={field.state.meta.errors[0]}
              />
            </div>
          )}
        </form.Field>

        {mustVerifyEmail && user.email_verified_at === null && (
          <div>
            <p className="mt-2 text-gray-800 text-sm dark:text-gray-200">
              {t("profile.updateProfileInformation.unverified")}
              <PostButton
                to={route("verification.send")}
                className="rounded-md text-gray-600 text-sm underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:text-gray-400 dark:focus:ring-offset-gray-800 dark:hover:text-gray-100"
              >
                {t("profile.updateProfileInformation.resend")}
              </PostButton>
            </p>

            {status === "verification-link-sent" && (
              <div className="mt-2 font-medium text-green-600 text-sm dark:text-green-400">
                {t("profile.updateProfileInformation.verificationLinkSent")}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={form.state.isSubmitting}>
            {t("common.save")}
          </PrimaryButton>

          <Transition
            show={recentlySuccessful}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-gray-600 text-sm dark:text-gray-400">
              {t("common.saved")}
            </p>
          </Transition>
        </div>
      </form>
    </section>
  );
}
