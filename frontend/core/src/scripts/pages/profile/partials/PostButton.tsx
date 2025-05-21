import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import type { ReactNode } from "react";

export const PostButton = ({
  to,
  className,
  children,
}: { to: string; className: string; children: ReactNode }) => {
  const api = useApi();
  const handleOnClick = () => {
    api.post(to, {});
  };
  return (
    <Button onClick={handleOnClick} className={className}>
      {children}
    </Button>
  );
};
