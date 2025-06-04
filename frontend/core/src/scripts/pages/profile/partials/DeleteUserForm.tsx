import DangerButton from "@components/DangerButton";
import InputLabel from "@components/InputLabel";
import Modal from "@components/Modal";
import SecondaryButton from "@components/SecondaryButton";
import TextInput from "@components/TextInput";
import { callApi } from "@lib/apiClient";
import { useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { route } from "ziggy-js";

export default function DeleteUserForm({
  className = "",
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const passwordInput = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await callApi("delete", route("profile.destroy"), value);
      } catch (error) {
        console.error("API error:", error);
        formApi.reset();
      }
    },
  });
  // const {
  //   data,
  //   setData,
  //   delete: destroy,
  //   processing,
  //   reset,
  //   errors,
  //   clearErrors,
  // } = useForm({
  //   password: "",
  // });

  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true);
  };

  // const deleteUser: FormEventHandler = (e) => {
  //   e.preventDefault();

  //   destroy(route("profile.destroy"), {
  //     preserveScroll: true,
  //     onSuccess: () => closeModal(),
  //     onError: () => passwordInput.current?.focus(),
  //     onFinish: () => reset(),
  //   });
  // };

  const closeModal = () => {
    setConfirmingUserDeletion(false);
    // clearErrors();
    form.reset();
  };

  return (
    <section className={`space-y-6 ${className}`}>
      <header>
        <h2 className="font-medium text-gray-900 text-lg dark:text-gray-100">
          {t("profile.deleteAccount.title")}
        </h2>

        <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
          {t("profile.deleteAccount.description")}
        </p>
      </header>

      <DangerButton onClick={confirmUserDeletion}>
        {t("profile.deleteAccount.button")}
      </DangerButton>

      <Modal show={confirmingUserDeletion} onClose={closeModal}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="p-6"
        >
          <h2 className="font-medium text-gray-900 text-lg dark:text-gray-100">
            {t("profile.deleteAccount.modal.title")}
          </h2>

          <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
            {t("profile.deleteAccount.modal.description")}
          </p>

          <div className="mt-4">
            <form.Field name="password">
              {(field) => (
                <>
                  <InputLabel
                    htmlFor={field.name}
                    value="Password"
                    className="sr-only"
                  />

                  <TextInput
                    id={field.name}
                    type="password"
                    name={field.name}
                    ref={passwordInput}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="mt-1 block w-3/4"
                    isFocused
                    placeholder="Password"
                  />

                  {/* <InputError message={errors.password} className="mt-2" /> */}
                </>
              )}
            </form.Field>
          </div>

          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>
              {t("profile.deleteAccount.modal.cancel")}
            </SecondaryButton>

            <DangerButton className="ms-3" disabled={form.state.isSubmitting}>
              {t("profile.deleteAccount.modal.confirm")}
            </DangerButton>
          </div>
        </form>
      </Modal>
    </section>
  );
}
