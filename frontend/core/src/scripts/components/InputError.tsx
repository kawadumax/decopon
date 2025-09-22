import type { HTMLAttributes } from "react";
import { cn } from "@/scripts/lib/utils";

export default function InputError({
  message,
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
  return message ? (
    <p
      {...props}
      className={cn("text-red-600 text-sm dark:text-red-400", className)}
    >
      {message}
    </p>
  ) : null;
}
