import { AuthService } from "@/scripts/api/services/AuthService";
import { authStorage } from "@/scripts/lib/authStorage";
import { Button } from "@components/ui/button";
import type { ReactNode } from "react";

export const PostButton = ({
  className,
  children,
}: { className: string; children: ReactNode }) => {
  const handleOnClick = () => {
    const auth = authStorage.get();
    const email = auth?.user?.email;
    if (!email) {
      return;
    }

    void AuthService.resendVerification({ email });
  };
  return (
    <Button onClick={handleOnClick} className={className}>
      {children}
    </Button>
  );
};
