import type { DecoponLinkProps } from "@/scripts/types";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { cn } from "@/scripts/lib/utils";

export default function NavLink({
  className = "",
  children,
  to,
}: DecoponLinkProps) {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to, fuzzy: false });
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center border-b-2 px-1 pt-1 font-medium text-sm leading-5 transition duration-150 ease-in-out focus:outline-hidden",
        isActive
          ? "border-amber-400 text-gray-900 dark:border-amber-600 dark:text-gray-100"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-amber-400 focus:text-gray-700 dark:text-gray-400 dark:focus:border-gray-700 dark:focus:text-gray-300 dark:hover:border-gray-700 dark:hover:text-gray-300",
        className,
      )}
    >
      {children}
    </Link>
  );
}
