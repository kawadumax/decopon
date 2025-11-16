import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/scripts/lib/utils";

export default function DangerButton({
  className = "",
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center rounded-md border border-transparent bg-destructive px-4 py-2 font-semibold text-destructive-foreground text-xs uppercase tracking-widest transition duration-150 ease-in-out hover:bg-destructive/90 focus:outline-hidden focus:ring-2 focus:ring-destructive focus:ring-offset-2 active:bg-destructive/80 dark:focus:ring-offset-surface-inverse",
        disabled && "opacity-25",
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
