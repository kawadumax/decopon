import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdatePreferenceForm from "./Partials/UpdatePreferenceForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
export default function Edit({
	mustVerifyEmail,
	status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
	const { t } = useTranslation();
	return (
		<AuthenticatedLayout
			header={
				<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
					{t("profile.title")}
				</h2>
			}
		>
			<Head title={t("profile.title")} />

			<div className="py-12 bg-gray-100 dark:bg-gray-900">
				<div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
					<div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
						<UpdateProfileInformationForm
							mustVerifyEmail={mustVerifyEmail}
							status={status}
							className="max-w-xl"
						/>
					</div>

					<div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
						<UpdatePreferenceForm className="max-w-xl" />
					</div>

					<div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
						<UpdatePasswordForm className="max-w-xl" />
					</div>

					<div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
						<DeleteUserForm className="max-w-xl" />
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
