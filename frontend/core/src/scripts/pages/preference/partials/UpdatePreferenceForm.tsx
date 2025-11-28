import { useEffect, useState } from "react";

import { ProfileService } from "@/scripts/api/services/ProfileService";
import { authStorage } from "@/scripts/lib/authStorage";
import {
  ensureNativeNotificationPermission,
  hasNativeNotificationAdapter,
} from "@/scripts/lib/nativeNotification";
import type { Auth, Locale } from "@/scripts/types";

const locales = { ENGLISH: "en", JAPANESE: "ja" } as const;
const themes = { light: "light", dark: "dark", system: "system" } as const;
import InputLabel from "@components/InputLabel";
import PrimaryButton from "@components/PrimaryButton";
import TextInput from "@components/TextInput";
import { Checkbox } from "@components/ui/checkbox";
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
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useNativeNotificationSettingsStore } from "@store/nativeNotification";

export default function UpdatePreferenceForm({
  className = "",
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const auth = queryClient.getQueryData(["auth"]) as Auth;
  const user = auth.user;
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme ?? themes.light);
  const notificationEnabled = useNativeNotificationSettingsStore(
    (state) => state.enabled,
  );
  const setNotificationEnabled = useNativeNotificationSettingsStore(
    (state) => state.setEnabled,
  );

  useEffect(() => {
    setSelectedTheme(theme ?? themes.light);
  }, [theme]);

  const handleNotificationToggle = async (checked: boolean) => {
    setNotificationEnabled(checked);

    if (!checked) {
      return;
    }

    if (!hasNativeNotificationAdapter()) {
      return;
    }

    const granted = await ensureNativeNotificationPermission({
      prompt: () => window.confirm(t("notification.permissionPrompt")),
    });

    if (!granted) {
      setNotificationEnabled(false);
    }
  };

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
        <h2 className="font-medium text-fg-strong text-lg dark:text-fg">
          {t("preference.updatePreference.title")}
        </h2>

        <p className="mt-1 text-fg-secondary text-sm dark:text-fg-muted">
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

        <div className="mt-4">
          <InputLabel
            htmlFor="theme"
            value={t("preference.updatePreference.theme")}
          />
          <Select
            value={selectedTheme}
            onValueChange={(value) => {
              setSelectedTheme(value as (typeof themes)[keyof typeof themes]);
              setTheme(value);
            }}
          >
            <SelectTrigger id="theme">
              <SelectValue
                placeholder={t("preference.updatePreference.theme")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={themes.light}>
                {t("preference.updatePreference.themeOptions.light")}
              </SelectItem>
              <SelectItem value={themes.dark}>
                {t("preference.updatePreference.themeOptions.dark")}
              </SelectItem>
              <SelectItem value={themes.system}>
                {t("preference.updatePreference.themeOptions.system")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3">
            <Checkbox
              id="native-notification-enabled"
              checked={notificationEnabled}
              onCheckedChange={(checked) => {
                void handleNotificationToggle(checked === true);
              }}
            />
            <div className="space-y-1">
              <InputLabel
                htmlFor="native-notification-enabled"
                value={t("notification.settings.label")}
              />
              <p className="text-sm text-fg-secondary dark:text-fg-muted">
                {t("notification.settings.description")}
              </p>
            </div>
          </div>
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
            <p className="text-fg-secondary text-sm dark:text-fg-muted">
              {t("common.saved")}
            </p>
          </Transition>
        </div>
      </form>
    </section>
  );
}
