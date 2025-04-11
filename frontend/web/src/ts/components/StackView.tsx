import { cn } from "@/lib/utils";
import {
  Children,
  type ReactElement,
  type ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
} from "react";

interface StackViewContextType {
  view: string;
  setView: (v: string) => void;
  direction: "forward" | "backward";
}

const initialContext: StackViewContextType = {
  view: "",
  setView: () => {},
  direction: "forward",
};

const StackViewContext = createContext<StackViewContextType>(initialContext);

export function useStackView() {
  const ctx = useContext(StackViewContext);
  if (!ctx) throw new Error("useStackView must be used within <StackView>");
  return ctx;
}

interface StackViewProps {
  initialView: string;
  children: ReactNode;
}

interface StackViewListProps {
  children: React.ReactElement[];
}

export function StackView({ initialView, children }: StackViewProps) {
  const [view, setViewState] = useState(initialView);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const setView = (next: string) => {
    setDirection(order[next] > order[view] ? "forward" : "backward");
    setViewState(next);
  };

  const order: Record<string, number> = {};
  let index = 0;

  const views = Children.map(children, (child) => {
    if (
      !isValidElement<StackViewListProps>(child) ||
      child.type !== StackViewList
    )
      return null;
    return Children.map(child.props.children, (viewEl: ReactElement) => {
      const key = viewEl.key as string;
      order[key] = index++;
      return cloneElement(viewEl, {
        isActive: key === view,
      } as React.HTMLAttributes<HTMLElement>);
    });
  })?.flat();

  return (
    <StackViewContext.Provider value={{ view, setView, direction }}>
      <div className="relative min-h-[400px] w-full overflow-hidden">
        {views}
      </div>
    </StackViewContext.Provider>
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
}

export function StackViewPanel({ children, isActive }: StackViewPanelProps) {
  return (
    <div
      className={cn(
        "absolute w-full transition-all duration-300",
        isActive ? "animate-slide-in" : "hidden",
      )}
    >
      {children}
    </div>
  );
}
