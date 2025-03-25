import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { callApi } from "@/lib/apiClient";
import { Transition } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export default function UpdatePasswordForm({
  className = "",
}: {
  className: string;
}) {
  const { t } = useTranslation();
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  // const { data, setData, errors, put, reset, processing, recentlySuccessful } =
  //   useForm({
  //     current_password: "",
  //     password: "",
  //     password_confirmation: "",
  //   });

  const form = useForm({
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await callApi("put", route("password.update"), value);
        formApi.reset();
      } catch (error) {
        console.error("API error:", error);
        // if (error?.response?.status === 422) {
        //   const { errors } = error?.response?.data;
        //   if (errors.password) {
        //     formApi.reset();
        //     passwordInput.current?.focus();
        //   }
        //   if (errors.current_password) {
        //     formApi.reset({ current_password: "" });
        //     currentPasswordInput.current?.focus();
        //   }
        // }
      }
    },
  });

  // const updatePassword: FormEventHandler = (e) => {
  //   e.preventDefault();

  //   put(route("password.update"), {
  //     preserveScroll: true,
  //     onSuccess: () => reset(),
  //     onError: (errors) => {
  //       if (errors.password) {
  //         reset("password", "password_confirmation");
  //         passwordInput.current?.focus();
  //       }

  //       if (errors.current_password) {
  //         reset("current_password");
  //         currentPasswordInput.current?.focus();
  //       }
  //     },
  //   });
  // };

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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="mt-6 space-y-6"
      >
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

                {/* <InputError message={errors.current_password} className="mt-2" /> */}
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

                {/* <InputError message={errors.password} className="mt-2" /> */}
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

                {/* <InputError
                  message={errors.password_confirmation}
                  className="mt-2"
                /> */}
              </>
            )}
          </form.Field>
        </div>

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={form.state.isSubmitting}>
            {t("common.save")}
          </PrimaryButton>

          <Transition
            // show=recentlySuccessful
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
