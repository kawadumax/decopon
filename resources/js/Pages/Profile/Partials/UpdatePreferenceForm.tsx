import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { useForm, usePage } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

export default function UpdatePreferenceForm({
	className = "",
}: {
	className?: string;
}) {
	const { t } = useTranslation();
	const user = usePage().props.auth.user;

	const { data, setData, patch, errors, processing, recentlySuccessful } =
		useForm({
			work_time: user.preference?.work_time || 25,
			break_time: user.preference?.break_time || 5,
		});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();

		patch(route("preference.update"));
	};

	return (
		<section className={className}>
			<header>
				<h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
					{t("profile.updatePreference.title")}
				</h2>

				<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
					{t("profile.updatePreference.description")}
				</p>
			</header>

			<form onSubmit={submit} className="mt-6 space-y-6">
				<div>
					<InputLabel
						htmlFor="work_time"
						value={t("profile.updatePreference.workTime")}
					/>

					<TextInput
						id="work_time"
						type="number"
						className="mt-1 block w-full"
						value={data.work_time}
						onChange={(e) =>
							setData("work_time", Number.parseInt(e.target.value))
						}
						required
						min="1"
					/>

					<InputError className="mt-2" message={errors.work_time} />
				</div>

				<div>
					<InputLabel
						htmlFor="break_time"
						value={t("profile.updatePreference.breakTime")}
					/>

					<TextInput
						id="break_time"
						type="number"
						className="mt-1 block w-full"
						value={data.break_time}
						onChange={(e) =>
							setData("break_time", Number.parseInt(e.target.value))
						}
						required
						min="1"
					/>

					<InputError className="mt-2" message={errors.break_time} />
				</div>

				<div className="flex items-center gap-4">
					<PrimaryButton disabled={processing}>
						{t("common.save")}
					</PrimaryButton>

					<Transition
						show={recentlySuccessful}
						enter="transition ease-in-out"
						enterFrom="opacity-0"
						leave="transition ease-in-out"
						leaveTo="opacity-0"
					>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							{t("common.saved")}
						</p>
					</Transition>
				</div>
			</form>
		</section>
	);
}
