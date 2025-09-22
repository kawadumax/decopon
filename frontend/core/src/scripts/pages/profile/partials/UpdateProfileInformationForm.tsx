import { ProfileService } from "@/scripts/api/services/ProfileService";
import { authStorage } from "@/scripts/lib/authStorage";
import type { Auth } from "@/scripts/types";
import InputError from "@components/InputError";
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import { Transition } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";


type UpdateData = {
  name: string;
  email: string;
};

const updateProfile = async (updateData: UpdateData) => {
  try {
    return await ProfileService.updateProfile(updateData);
  } catch (e) {
    throw new Error(String(e));
  }
};

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
  const queryClient = useQueryClient();
  const { user } = queryClient.getQueryData(["auth"]) as Auth;

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      const auth = { user: data };
      queryClient.setQueryData(["auth"], auth);
      authStorage.set(auth);
    },
  });

  const form = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
    onSubmit: async ({ value, formApi }) => {
      mutation.mutate(value as UpdateData, {
        onError: () => {
          formApi.reset();
        },
      });
    },
  });

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
              {t("common.saved")}
            </p>
          </Transition>
        </div>
      </form>
    </section>
  );
}
