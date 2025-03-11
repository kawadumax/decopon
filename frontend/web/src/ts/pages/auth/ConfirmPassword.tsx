import InputError from "@/components/InputError";
import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import GuestLayout from "@/layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

export default function ConfirmPassword() {
	const { t } = useTranslation();
	const { data, setData, post, processing, errors, reset } = useForm({
		password: "",
	});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();

		post(route("password.confirm"), {
			onFinish: () => reset("password"),
		});
	};

	return (
		<GuestLayout>
			<Head title={t("auth.comfirmPassword.title")} />

			<div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
				{t("auth.comfirmPassword.description")}
			</div>

			<form onSubmit={submit}>
				<div className="mt-4">
					<InputLabel htmlFor="password" value="Password" />

					<TextInput
						id="password"
						type="password"
						name="password"
						value={data.password}
						className="mt-1 block w-full"
						isFocused={true}
						onChange={(e) => setData("password", e.target.value)}
					/>

					<InputError message={errors.password} className="mt-2" />
				</div>

				<div className="mt-4 flex items-center justify-end">
					<PrimaryButton className="ms-4" disabled={processing}>
						{t("auth.comfirmPassword.submit")}
					</PrimaryButton>
				</div>
			</form>
		</GuestLayout>
	);
}
