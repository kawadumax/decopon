import { ProfileService } from "@/scripts/api/services/ProfileService";
import { authStorage } from "@/scripts/lib/authStorage";
import type { Auth, Locale } from "@/scripts/types";

const locales = { ENGLISH: "en", JAPANESE: "ja" } as const;
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Transition } from "@headlessui/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";


export default function UpdatePreferenceForm({
  className = "",
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const auth = queryClient.getQueryData(["auth"]) as Auth;
  const user = auth.user;
  const form = useForm({
    defaultValues: {
      work_time: user?.work_time || 25,
      break_time: user?.break_time || 5,
      locale: (user?.locale || "en") as Locale,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const res = (await ProfileService.updatePreference(value)) as any;
        if (res) {
          const updatedAuth = queryClient.setQueryData(["auth"], (auth: Auth) => {
            if (!auth || !auth.user) return auth;
            return {
              ...auth,
              user: {
                ...auth.user,
                ...res,
              },
            };
          });
          if (updatedAuth) {
            authStorage.set(updatedAuth as Auth);
          }
        }
      } catch (error) {
        console.error("API error:", error);
        formApi.reset();
      }
    },
  });

  return (
    <section className={className}>
      <header>
        <h2 className="font-medium text-gray-900 text-lg dark:text-gray-100">
          {t("preference.updatePreference.title")}
        </h2>

        <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
          {t("preference.updatePreference.description")}
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
          <form.Field name="work_time">
            {(field) => (
              <>
                <InputLabel
                  htmlFor={field.name}
                  value={t("preference.updatePreference.workTime")}
                />

                <TextInput
                  id={field.name}
                  type="number"
                  className="mt-1 block w-full"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(Number.parseInt(e.target.value))
                  }
                  required
                  min="1"
                />

              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4">
          <form.Field name="break_time">
            {(field) => (
              <>
                <InputLabel
                  htmlFor="break_time"
                  value={t("preference.updatePreference.breakTime")}
                />
                <TextInput
                  id="break_time"
                  type="number"
                  className="mt-1 block w-full"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(Number.parseInt(e.target.value))
                  }
                  required
                  min="1"
                />
              </>
            )}
          </form.Field>
        </div>

        <div className="mt-4">
          <form.Field name="locale">
            {(field) => (
              <>
                <InputLabel
                  htmlFor="locale"
                  value={t("preference.updatePreference.locale")}
                />
                <Select
                  defaultValue={field.state.value}
                  onValueChange={(e) => {
                    field.handleChange(e as Locale);
                  }}
                >
                  <SelectTrigger id="locale">
                    <SelectValue
                      placeholder={t("preference.updatePreference.locale")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(locales).map(([key, value]) => {
                      return (
                        <SelectItem key={key} value={value}>
                          {key}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </>
            )}
          </form.Field>
        </div>

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={form.state.isSubmitting}>
            {t("common.save")}
          </PrimaryButton>

          <Transition
            show={form.state.isSubmitSuccessful}
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
