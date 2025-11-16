import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { isTauriEnvironment } from "@/scripts/lib/isTauriEnvironment";

import DeleteUserForm from "./partials/DeleteUserForm";
import UpdatePasswordForm from "./partials/UpdatePasswordForm";
import UpdatePreferenceForm from "./partials/UpdatePreferenceForm";
import UpdateProfileInformationForm from "./partials/UpdateProfileInformationForm";
import TauriDangerZone from "./partials/TauriDangerZone";

export default function Index({
  mustVerifyEmail,
  status,
}: { mustVerifyEmail: boolean; status?: string }) {
  const { t } = useTranslation();
  const isTauri = useMemo(() => isTauriEnvironment(), []);

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-surface shadow-sm dark:bg-surface-inverse">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="font-semibold text-fg text-xl leading-tight dark:text-fg-inverse">
            {t("preference.title")}
          </h2>
        </div>
      </header>

      <main className="flex-1 bg-surface-muted py-12 dark:bg-surface-inverse">
        <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
          {!isTauri && (
            <div className="bg-surface p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-surface-inverse">
              <UpdateProfileInformationForm
                mustVerifyEmail={mustVerifyEmail}
                status={status}
                className="max-w-xl"
              />
            </div>
          )}

          <div className="bg-surface p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-surface-inverse">
            <UpdatePreferenceForm className="max-w-xl" />
          </div>

          <div className="bg-surface p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-surface-inverse">
            <UpdatePasswordForm className="max-w-xl" />
          </div>

          {!isTauri && (
            <div className="bg-surface p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-surface-inverse">
              <DeleteUserForm className="max-w-xl" />
            </div>
          )}

          <div className="bg-surface p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-surface-inverse">
            <TauriDangerZone className="max-w-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
