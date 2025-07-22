import { callApi } from "@/scripts/queries/apiClient";
import { Button } from "@components/ui/button";
import type { ReactNode } from "react";

export const PostButton = ({
  to,
  className,
  children,
}: { to: string; className: string; children: ReactNode }) => {
  const handleOnClick = () => {
    callApi("post", to);
  };
  return (
    <Button onClick={handleOnClick} className={className}>
      {children}
    </Button>
  );
};
