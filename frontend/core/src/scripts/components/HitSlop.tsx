import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@lib/utils";

type HitSlopInset = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type HitSlop = number | HitSlopInset;

type HitSlopProps = {
  hitSlop?: HitSlop;
} & HTMLAttributes<HTMLDivElement>;

export const HitSlop = forwardRef<HTMLDivElement, HitSlopProps>(
  ({ hitSlop = 8, className, style, children, ...rest }, ref) => {
    const slop = typeof hitSlop === "number"
      ? { top: hitSlop, right: hitSlop, bottom: hitSlop, left: hitSlop }
      : { top: 0, right: 0, bottom: 0, left: 0, ...hitSlop };

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        style={{
          paddingTop: slop.top,
          paddingRight: slop.right,
          paddingBottom: slop.bottom,
          paddingLeft: slop.left,
          marginTop: -slop.top,
          marginRight: -slop.right,
          marginBottom: -slop.bottom,
          marginLeft: -slop.left,
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

HitSlop.displayName = "HitSlop";
