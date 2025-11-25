import type { LabelHTMLAttributes } from "react";
import { cn } from "@/scripts/lib/utils";

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
      className={cn(
        "block font-medium text-fg text-sm dark:text-fg-secondary",
        className,
      )}
    >
      {value ? value : children}
    </label>
  );
}
