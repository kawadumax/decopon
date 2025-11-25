import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/scripts/lib/utils";

export default function PrimaryButton({
  className = "",
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-primary-foreground text-xs uppercase tracking-widest transition duration-150 ease-in-out hover:bg-primary/90 focus:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 active:bg-primary/80 dark:bg-primary/80 dark:hover:bg-primary/70 dark:focus:bg-primary/75 dark:active:bg-primary/70 dark:focus:ring-offset-surface",
        disabled && "opacity-25",
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
