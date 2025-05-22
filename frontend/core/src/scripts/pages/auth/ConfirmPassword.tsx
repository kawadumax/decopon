import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { callApi } from "@lib/apiClient";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function ConfirmPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await callApi("post", route("password.confirm"), value);
        navigate({ to: "/auth/dashboard" });
      } catch (error) {
        console.error("API error:", error);
        formApi.reset();
      }
    },
  });

  return (
    <>
      <div className="mb-4 text-gray-600 text-sm dark:text-gray-400">
        {t("auth.comfirmPassword.description")}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
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
                  isFocused={true}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />

                {/* <InputError message={errors.password} className="mt-2" /> */}
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <PrimaryButton className="ms-4" disabled={form.state.isSubmitting}>
            {t("auth.comfirmPassword.submit")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}
