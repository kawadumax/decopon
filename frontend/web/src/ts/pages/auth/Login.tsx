import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import { Checkbox } from "@/components/ui/checkbox";
// import { Head, Link, useForm } from "@inertiajs/react";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";
import { DemoCaution } from "./partials/DemoCaution";

export default function Login({
	status,
	canResetPassword,
}: {
	status?: string;
	canResetPassword: boolean;
}) {
	const { t } = useTranslation();
	// const { data, setData, post, processing, errors, reset } = useForm({
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			remember: false,
		},
	});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();
		// TODO: Implement this
		// post(route("login"), {
		// 	onFinish: () => reset(),
		// });
	};

	return (
		<>
			{status && (
				<div className="mb-4 font-medium text-sm text-green-600">{status}</div>
			)}

			<form onSubmit={submit}>
				<DemoCaution
					header={t("auth.login.caution")}
					content={t("auth.login.demo")}
				/>

				<div>
					<InputLabel htmlFor="email" value={t("common.email")} />
					<TextInput
						id="email"
						type="email"
						name="email"
						// value={data.email}
						className="mt-1 block w-full"
						autoComplete="username"
						isFocused={true}
						// onChange={(e) => setData("email", e.target.value)}
					/>
					{/* <InputError message={errors.email} className="mt-2" /> */}
				</div>

				<div className="mt-4">
					<InputLabel htmlFor="password" value={t("common.password")} />
					<TextInput
						id="password"
						type="password"
						name="password"
						// value={data.password}
						className="mt-1 block w-full"
						autoComplete="current-password"
						// onChange={(e) => setData("password", e.target.value)}
					/>
					{/* <InputError message={errors.password} className="mt-2" /> */}
				</div>

				<div className="block mt-4">
					<label className="flex items-center" htmlFor="remember">
						<Checkbox
							id="remember"
							name="remember"
							// checked={data.remember}
							onCheckedChange={
								(checked) => {
									console.log(checked);
								}
								// setData("remember", checked as boolean)
							}
						/>
						<span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
							{t("auth.login.rememberMe")}
						</span>
					</label>
				</div>

				<div className="flex items-center justify-end mt-4">
					{canResetPassword && (
						<Link
							to={route("password.request")}
							className="underline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
						>
							{t("auth.login.forgotPassword")}
						</Link>
					)}

					<PrimaryButton className="ms-4">
						{t("auth.login.submit")}
					</PrimaryButton>
				</div>
			</form>
		</>
	);
}
