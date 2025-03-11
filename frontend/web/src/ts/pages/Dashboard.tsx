import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { useTranslation } from "react-i18next";

export const Dashboard = () => {
	const { t } = useTranslation();
	return (
		<AuthenticatedLayout>
			{/* <Head title="Dashboard" /> */}

			<div className="py-12">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
						<div className="p-6 text-gray-900 dark:text-gray-100">
							{t("dashboard.greeting")}
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
};
