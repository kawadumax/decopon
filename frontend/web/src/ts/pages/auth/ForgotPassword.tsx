import InputError from "@/components/InputError";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import GuestLayout from "@/layouts/GuestLayout";
// import { Head, useForm } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

export default function ForgotPassword({ status }: { status?: string }) {
	const { t } = useTranslation();
	const { data, setData, post, processing, errors } = useForm({
		email: "",
	});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();

		post(route("password.email"));
	};

	return (
		<GuestLayout>
			{/* <Head title={t("auth.forgotPassword.title")} /> */}

			<div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
				{t("auth.forgotPassword.description")}
			</div>

			{status && (
				<div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
					{status}
				</div>
			)}

			<form onSubmit={submit}>
				<TextInput
					id="email"
					type="email"
					name="email"
					value={data.email}
					className="mt-1 block w-full"
					isFocused={true}
					onChange={(e) => setData("email", e.target.value)}
				/>

				<InputError message={errors.email} className="mt-2" />

				<div className="mt-4 flex items-center justify-end">
					<PrimaryButton className="ms-4" disabled={processing}>
						{t("auth.forgotPassword.submit")}
					</PrimaryButton>
				</div>
			</form>
		</GuestLayout>
	);
}
