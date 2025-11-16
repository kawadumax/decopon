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
          ? "border-primary text-fg-strong dark:border-primary dark:text-fg-inverse"
          : "border-transparent text-fg-muted hover:border-line-subtle hover:text-fg focus:border-primary focus:text-fg dark:text-fg-muted dark:focus:border-line-subtle dark:focus:text-fg-secondary dark:hover:border-line-subtle dark:hover:text-fg-secondary",
        className,
      )}
    >
      {children}
    </Link>
  );
}

