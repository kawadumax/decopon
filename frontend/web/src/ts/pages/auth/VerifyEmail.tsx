import PrimaryButton from "@/components/PrimaryButton";
import GuestLayout from "@/layouts/GuestLayout";
// import { Head, Link, useForm } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

export default function VerifyEmail({ status }: { status?: string }) {
	const { t } = useTranslation();
	const { post, processing } = useForm({});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();

		post(route("verification.send"));
	};

	return (
		<GuestLayout>
			{/* <Head title={t("auth.verifyEmail.title")} /> */}

			<div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
				{t("auth.verifyEmail.description")}
			</div>

			{status === "verification-link-sent" && (
				<div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
					{t("auth.verifyEmail.linkSent")}
				</div>
			)}

			<form onSubmit={submit}>
				<div className="mt-4 flex items-center justify-between">
					<PrimaryButton disabled={processing}>
						{t("auth.verifyEmail.resend")}
					</PrimaryButton>

					<Link
						href={route("logout")}
						method="post"
						as="button"
						className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
					>
						{t("auth.verifyEmail.logout")}
					</Link>
				</div>
			</form>
		</GuestLayout>
	);
}
