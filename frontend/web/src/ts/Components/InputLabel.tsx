import type { LabelHTMLAttributes } from "react";

export default function InputLabel({
	value,
	className = "",
	children,
	...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: <explanation>
		<label
			{...props}
			className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
		>
			{value ? value : children}
		</label>
	);
}
