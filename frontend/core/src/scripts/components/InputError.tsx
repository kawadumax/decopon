import type { HTMLAttributes } from "react";
import { cn } from "@/scripts/lib/utils";

export default function InputError({
  message,
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
  return message ? (
    <p {...props} className={cn("text-destructive text-sm", className)}>
      {message}
    </p>
  ) : null;
}
