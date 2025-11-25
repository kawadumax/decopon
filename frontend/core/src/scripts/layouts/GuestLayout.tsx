import ApplicationLogo from "@components/ApplicationLogo";
import { Toaster } from "@components/ui/sonner";
import { Link } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
export default function Guest({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface-muted pt-6 sm:justify-center sm:pt-0 dark:bg-surface-inverse">
      <div>
        <Link to="/">
          <ApplicationLogo className="h-20 w-20 fill-current text-fg-muted" />
        </Link>
      </div>

      <div className="mt-6 w-full overflow-hidden bg-surface px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg dark:bg-surface-inverse">
        {children}
      </div>
      <Toaster richColors />
    </div>
  );
}

