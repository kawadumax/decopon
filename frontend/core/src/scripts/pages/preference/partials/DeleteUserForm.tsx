import { ProfileService } from "@/scripts/api/services/ProfileService";
import DangerButton from "@components/DangerButton";
import InputLabel from "@components/InputLabel";
import Modal from "@components/Modal";
import SecondaryButton from "@components/SecondaryButton";
import TextInput from "@components/TextInput";
import { useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/scripts/lib/utils";


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
          await ProfileService.deleteUser(value);
      } catch (error) {
        console.error("API error:", error);
        formApi.reset();
      }
    },
  });

  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true);
  };


    const closeModal = () => {
      setConfirmingUserDeletion(false);
      form.reset();
    };

  return (
    <section className={cn("space-y-6", className)}>
      <header>
        <h2 className="font-medium text-gray-900 text-lg dark:text-gray-100">
          {t("preference.deleteAccount.title")}
        </h2>

        <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
          {t("preference.deleteAccount.description")}
        </p>
      </header>

      <DangerButton onClick={confirmUserDeletion}>
        {t("preference.deleteAccount.button")}
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
            {t("preference.deleteAccount.modal.title")}
          </h2>

          <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
            {t("preference.deleteAccount.modal.description")}
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

                </>
              )}
            </form.Field>
          </div>

          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>
              {t("preference.deleteAccount.modal.cancel")}
            </SecondaryButton>

            <DangerButton className="ms-3" disabled={form.state.isSubmitting}>
              {t("preference.deleteAccount.modal.confirm")}
            </DangerButton>
          </div>
        </form>
      </Modal>
    </section>
  );
}
