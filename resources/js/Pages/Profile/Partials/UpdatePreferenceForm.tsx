import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";

export default function UpdatePreferenceForm({
    className = "",
}: {
    className?: string;
}) {
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
                    Preference Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your account's preference information and email
                    address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="work_time" value="作業時間（分）" />

                    <TextInput
                        id="work_time"
                        type="number"
                        className="mt-1 block w-full"
                        value={data.work_time}
                        onChange={(e) =>
                            setData("work_time", parseInt(e.target.value))
                        }
                        required
                        min="1"
                    />

                    <InputError className="mt-2" message={errors.work_time} />
                </div>

                <div>
                    <InputLabel htmlFor="break_time" value="休憩時間（分）" />

                    <TextInput
                        id="break_time"
                        type="number"
                        className="mt-1 block w-full"
                        value={data.break_time}
                        onChange={(e) =>
                            setData("break_time", parseInt(e.target.value))
                        }
                        required
                        min="1"
                    />

                    <InputError className="mt-2" message={errors.break_time} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>保存</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            保存しました。
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
