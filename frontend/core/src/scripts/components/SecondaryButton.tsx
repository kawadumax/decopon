import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/scripts/lib/utils";

export default function SecondaryButton({
  type = "button",
  className = "",
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        "inline-flex items-center rounded-md border border-line-subtle bg-surface px-4 py-2 font-semibold text-fg text-xs uppercase tracking-widest shadow-sm transition duration-150 ease-in-out hover:bg-surface-muted focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-25 dark:border-line-strong dark:bg-surface-inverse dark:text-fg-secondary dark:focus:ring-offset-surface-inverse dark:hover:bg-surface-inverse-muted",
        disabled && "opacity-25",
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

