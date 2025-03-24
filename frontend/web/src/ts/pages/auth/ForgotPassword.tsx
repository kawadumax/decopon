import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { callApi } from "@/lib/apiClient";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

export default function ForgotPassword({ status }: { status?: string }) {
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      email: "",
    },
    async onSubmit({ value, formApi }) {
      try {
        console.log(value);
        const res = await callApi("post", route("password.email"), value);
        console.log(res);
      } catch (error) {
        console.error("API error:", error);
        formApi.reset();
      } finally {
        // 画面遷移？
      }
    },
  });

  return (
    <>
      <div className="mb-4 text-gray-600 text-sm dark:text-gray-400">
        {t("auth.forgotPassword.description")}
      </div>

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
      >
        <form.Field name="email">
          {(field) => (
            <>
              <TextInput
                id={field.name}
                type="email"
                name="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 block w-full"
                isFocused={true}
              />

              {/* <InputError message={form.errors.email} className="mt-2" /> */}
            </>
          )}
        </form.Field>
        <div className="mt-4 flex items-center justify-end">
          <PrimaryButton className="ms-4" disabled={form.state.isSubmitting}>
            {t("auth.forgotPassword.submit")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
