import InputError from "@/components/InputError";
import InputLabel from "@/components/InputLabel";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import GuestLayout from "@/layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";
import { DemoCaution } from "./Partials/DemoCaution";

export default function Register() {
	const { t } = useTranslation();
	const { data, setData, post, processing, errors, reset } = useForm({
		name: "",
		email: "",
		password: "",
		password_confirmation: "",
	});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();

		post(route("register"), {
			onFinish: () => reset("password", "password_confirmation"),
		});
	};

	return (
		<GuestLayout>
			<Head title={t("auth.register.title")} />

			<form onSubmit={submit}>
				<DemoCaution
					header={t("auth.register.caution")}
					content={t("auth.register.demo")}
				/>
				<div>
					<InputLabel htmlFor="name" value="Name" />

					<TextInput
						id="name"
						name="name"
						value={data.name}
						className="mt-1 block w-full"
						autoComplete="name"
						isFocused={true}
						onChange={(e) => setData("name", e.target.value)}
						required
					/>

					<InputError message={errors.name} className="mt-2" />
				</div>

				<div className="mt-4">
					<InputLabel htmlFor="email" value="Email" />

					<TextInput
						id="email"
						type="email"
						name="email"
						value={data.email}
						className="mt-1 block w-full"
						autoComplete="username"
						onChange={(e) => setData("email", e.target.value)}
						required
					/>

					<InputError message={errors.email} className="mt-2" />
				</div>

				<div className="mt-4">
					<InputLabel htmlFor="password" value="Password" />

					<TextInput
						id="password"
						type="password"
						name="password"
						value={data.password}
						className="mt-1 block w-full"
						autoComplete="new-password"
						onChange={(e) => setData("password", e.target.value)}
						required
					/>

					<InputError message={errors.password} className="mt-2" />
				</div>

				<div className="mt-4">
					<InputLabel
						htmlFor="password_confirmation"
						value="Confirm Password"
					/>

					<TextInput
						id="password_confirmation"
						type="password"
						name="password_confirmation"
						value={data.password_confirmation}
						className="mt-1 block w-full"
						autoComplete="new-password"
						onChange={(e) => setData("password_confirmation", e.target.value)}
						required
					/>

					<InputError message={errors.password_confirmation} className="mt-2" />
				</div>

				<div className="mt-4 flex items-center justify-end">
					<Link
						href={route("login")}
						className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
					>
						{t("auth.register.alreadyRegistered")}
					</Link>

					<PrimaryButton className="ms-4" disabled={processing}>
						{t("auth.register.submit")}
					</PrimaryButton>
				</div>
			</form>
		</GuestLayout>
	);
}
