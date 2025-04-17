import { cn } from "@/lib/utils";
import {
  Children,
  type ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";

export const Directions = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  none: "none",
};

export type Direction = (typeof Directions)[keyof typeof Directions];

export type StackCommand = {
  command: "push" | "pop";
  to?: string;
  direction?: Direction;
};

interface StackViewProps {
  command?: StackCommand | (() => StackCommand);
  children: ReactNode;
}

interface StackViewListProps {
  children: React.ReactElement[];
}

export function StackView({ command, children }: StackViewProps) {
  // changeViewが関数の場合は実行する
  const rawCommand = typeof command === "function" ? command() : command;
  const [currentView, setCurrentView] = useState<StackCommand>({
    command: "push",
    to: "default",
    direction: Directions.none,
  });
  const [viewStack, setViewStack] = useState<StackCommand[]>([
    currentView as StackCommand,
  ]);

  useEffect(() => {
    if (rawCommand && rawCommand.command === "push") {
      // ViewStackに操作を保存する
      setCurrentView(rawCommand);
      setViewStack((prev) => [...prev, rawCommand]);
    } else if (rawCommand && rawCommand.command === "pop") {
      // ViewStackから操作を削除する
      setViewStack((prev) => {
        const newStack = [...prev];
        newStack.pop();
        return newStack;
      });
    }
  }, [rawCommand]);

  console.log(viewStack);
  console.log(currentView);

  const views: ReactNode[] = [];
  const others: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (
      !isValidElement<StackViewListProps>(child) ||
      child.type !== StackViewList
    ) {
      others.push(child);
      return;
    }

    const panels = Array.isArray(child.props.children)
      ? child.props.children
      : [child.props.children];
    if (rawCommand?.command === "push") {
      for (const panel of panels) {
        if (!isValidElement(panel)) {
          // パネルでない場合はスキップ
          continue;
        }

        views.push(
          // パネルに対して引数を与えながらクローン
          cloneElement(panel, {
            isActive: panel.key === currentView?.to,
            cmd: "push",
            direction: currentView?.direction,
          } as React.HTMLAttributes<HTMLElement>),
        );
      }
    } else if (rawCommand?.command === "pop") {
      for (const panel of panels) {
        if (!isValidElement(panel)) {
          // パネルでない場合はスキップ
          continue;
        }

        const prevView = viewStack.at(-1);

        if (panel.key === prevView?.to) {
          views.push(
            // パネルに対して引数を与えながらクローン
            cloneElement(panel, {
              isActive: true,
              direction: "none",
              cmd: "push",
            } as React.HTMLAttributes<HTMLElement>),
          );
        } else if (panel.key === currentView?.to) {
          views.push(
            // パネルに対して引数を与えながらクローン
            cloneElement(panel, {
              isActive: true,
              direction: currentView?.direction,
              cmd: "pop",
            } as React.HTMLAttributes<HTMLElement>),
          );
        }
      }
    }
  });

  return (
    <div className="relative min-h-[400px] w-full overflow-hidden">
      {others}
      {views}
    </div>
  );
}

export const StackViewList: React.FC<StackViewListProps> = ({
  children,
}: { children: ReactNode }) => {
  return <>{children}</>;
};

interface StackViewPanelProps {
  children: ReactNode;
  isActive?: boolean;
  direction?: Direction;
  cmd?: "push" | "pop";
}

export function StackViewPanel({
  children,
  isActive,
  direction,
  cmd = "push",
}: StackViewPanelProps) {
  const hiddenStyle = isActive ? "block" : "hidden";
  if (direction === undefined) {
    direction = "none";
  }
  const animationStyles: Record<typeof cmd, Record<Direction, string>> = {
    push: {
      up: "animate-push-up",
      down: "animate-push-down",
      left: "animate-push-left",
      right: "animate-push-right",
      none: "animate-push-none",
    },
    pop: {
      up: "animate-pop-up",
      down: "animate-pop-down",
      left: "animate-pop-left",
      right: "animate-pop-right",
      none: "animate-pop-none",
    },
  } as const;

  return (
    <div
      className={cn(
        "absolute w-full transition-all duration-300",
        animationStyles[cmd][direction],
        hiddenStyle,
      )}
    >
      {children}
    </div>
  );
}
