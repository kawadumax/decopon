import { useLogout } from "@/hooks/useLogout";
import type { DecoponLinkProps } from "@/types";
import { Link } from "@tanstack/react-router";

type NavLinkProps = DecoponLinkProps & {
	active?: boolean;
	variant: "button" | "link";
};

type NavLinkInnerProps = Omit<NavLinkProps, "variant">;

const commonClass = (active: boolean | undefined) =>
	`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
		active
			? "border-amber-400 bg-amber-50 text-amber-700 focus:border-amber-700 focus:bg-amber-100 focus:text-amber-800 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-300 dark:focus:border-amber-300 dark:focus:bg-amber-900 dark:focus:text-amber-200"
			: "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 dark:focus:border-gray-600 dark:focus:bg-gray-700 dark:focus:text-gray-200"
	} text-base font-medium transition duration-150 ease-in-out focus:outline-none`;

const Btn = ({ children, active, className }: NavLinkInnerProps) => {
	const { logout, loading } = useLogout();

	return (
		<button
			type="button"
			onClick={logout}
			disabled={loading}
			className={`${commonClass(active)} ${className}`}
		>
			{children}
		</button>
	);
};

const WrapLink = ({ active, className, children, to }: NavLinkInnerProps) => {
	return (
		<Link to={to} className={`${commonClass(active)} ${className}`}>
			{children}
		</Link>
	);
};

export default function ResponsiveNavLink({
	active = false,
	variant = "link",
	className = "",
	children,
	to,
}: NavLinkProps) {
	return variant === "link" ? (
		<WrapLink active={active} className={className} to={to}>
			{children}
		</WrapLink>
	) : (
		<Btn active={active} className={className} to={to}>
			{children}
		</Btn>
	);
}
