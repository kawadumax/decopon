import DangerButton from "@/components/DangerButton";
import InputError from "@/components/InputError";
import InputLabel from "@/components/InputLabel";
import Modal from "@/components/Modal";
import SecondaryButton from "@/components/SecondaryButton";
import TextInput from "@/components/TextInput";
import { useForm } from "@tanstack/react-form";
import { type FormEventHandler, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function DeleteUserForm({
  className = "",
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const passwordInput = useRef<HTMLInputElement>(null);

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

  const deleteUser: FormEventHandler = (e) => {
    e.preventDefault();

    destroy(route("profile.destroy"), {
      preserveScroll: true,
      onSuccess: () => closeModal(),
      onError: () => passwordInput.current?.focus(),
      onFinish: () => reset(),
    });
  };

  const closeModal = () => {
    setConfirmingUserDeletion(false);

    clearErrors();
    reset();
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
        <form onSubmit={deleteUser} className="p-6">
          <h2 className="font-medium text-gray-900 text-lg dark:text-gray-100">
            {t("profile.deleteAccount.modal.title")}
          </h2>

          <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
            {t("profile.deleteAccount.modal.description")}
          </p>

          <div className="mt-6">
            <InputLabel
              htmlFor="password"
              value="Password"
              className="sr-only"
            />

            <TextInput
              id="password"
              type="password"
              name="password"
              ref={passwordInput}
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              className="mt-1 block w-3/4"
              isFocused
              placeholder="Password"
            />

            <InputError message={errors.password} className="mt-2" />
          </div>

          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>
              {t("profile.deleteAccount.modal.cancel")}
            </SecondaryButton>

            <DangerButton className="ms-3" disabled={processing}>
              {t("profile.deleteAccount.modal.confirm")}
            </DangerButton>
          </div>
        </form>
      </Modal>
    </section>
  );
}
