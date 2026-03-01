import type { MobileSheetSwipeHandlers } from "@hooks/useMobileSheetSwipes";
import { cn } from "@lib/utils";

import { HitSlop } from "./HitSlop";

type TimerSwipeHandleProps = {
  swipeHandlers: MobileSheetSwipeHandlers;
  className?: string;
};

export const TimerSwipeHandle = ({ swipeHandlers, className }: TimerSwipeHandleProps) => {
  return (
    <HitSlop
      hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
      className={cn("flex justify-center", className)}
      {...swipeHandlers}
    >
      <div
        aria-hidden
        className="h-1.5 w-12 rounded-full bg-fg/60 shadow-sm backdrop-blur-sm dark:bg-fg-inverse/60"
      />
    </HitSlop>
  );
};
