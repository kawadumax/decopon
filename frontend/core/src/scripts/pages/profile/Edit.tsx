import { useTranslation } from "react-i18next";
import DeleteUserForm from "./partials/DeleteUserForm";
import UpdatePasswordForm from "./partials/UpdatePasswordForm";
import UpdatePreferenceForm from "./partials/UpdatePreferenceForm";
import UpdateProfileInformationForm from "./partials/UpdateProfileInformationForm";
export default function Edit({
  mustVerifyEmail,
  status,
}: { mustVerifyEmail: boolean; status?: string }) {
  const { t } = useTranslation();
  return (
    <>
      <header className="bg-white shadow-sm dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h2 className="font-semibold text-gray-800 text-xl leading-tight dark:text-gray-200">
            {t("profile.title")}
          </h2>
        </div>
      </header>

      <div className="bg-gray-100 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
          <div className="bg-white p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-gray-800">
            <UpdateProfileInformationForm
              mustVerifyEmail={mustVerifyEmail}
              status={status}
              className="max-w-xl"
            />
          </div>

          <div className="bg-white p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-gray-800">
            <UpdatePreferenceForm className="max-w-xl" />
          </div>

          <div className="bg-white p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-gray-800">
            <UpdatePasswordForm className="max-w-xl" />
          </div>

          <div className="bg-white p-4 shadow-sm sm:rounded-lg sm:p-8 dark:bg-gray-800">
            <DeleteUserForm className="max-w-xl" />
          </div>
        </div>
      </div>
    </>
  );
}
