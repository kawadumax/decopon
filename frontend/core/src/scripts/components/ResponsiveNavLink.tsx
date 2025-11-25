import type { DecoponLinkProps } from "@/scripts/types";
import { useLogout } from "@hooks/useLogout";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { cn } from "@/scripts/lib/utils";

type NavLinkProps = Omit<DecoponLinkProps, "to"> & {
  to?: DecoponLinkProps["to"];
  active?: boolean;
  variant?: "button" | "link";
};

type NavLinkInnerProps = Omit<NavLinkProps, "variant" | "to"> & {
  to?: DecoponLinkProps["to"];
};

const commonClass = (active: boolean | undefined) =>
  cn(
    "flex w-full items-start border-l-4 py-2 pe-4 ps-3 text-base font-medium transition duration-150 ease-in-out focus:outline-hidden",
    active
      ? "border-primary bg-primary/10 text-primary focus:border-primary focus:bg-primary/15 focus:text-primary dark:border-primary dark:bg-primary/20 dark:text-primary dark:focus:border-primary dark:focus:bg-primary/15 dark:focus:text-primary"
      : "border-transparent text-fg-secondary hover:border-line-subtle hover:bg-surface-muted hover:text-fg focus:border-line-subtle focus:bg-surface-muted focus:text-fg dark:text-fg-muted dark:hover:border-line-strong dark:hover:bg-surface-inverse-muted dark:hover:text-fg-inverse dark:focus:border-line-strong dark:focus:bg-surface-inverse-muted dark:focus:text-fg-inverse",
  );

const Btn = ({ children, active, className }: NavLinkInnerProps) => {
  const { logout, loading } = useLogout();

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={cn(commonClass(active), className)}
    >
      {children}
    </button>
  );
};

const WrapLink = ({
  active,
  className,
  children,
  to,
}: NavLinkInnerProps & { to: DecoponLinkProps["to"] }) => (
  <Link to={to} className={cn(commonClass(active), className)}>
    {children}
  </Link>
);

export default function ResponsiveNavLink({
  variant = "link",
  className = "",
  children,
  to,
}: NavLinkProps) {
  const matchRoute = useMatchRoute();
  const isLink = variant === "link" && typeof to === "string" && to.length > 0;
  const isActive = isLink ? !!matchRoute({ to: to!, fuzzy: false }) : false;

  if (isLink && to) {
    return (
      <WrapLink active={isActive} className={className} to={to}>
        {children}
      </WrapLink>
    );
  }

  return (
    <Btn active={isActive} className={className}>
      {children}
    </Btn>
  );
}
