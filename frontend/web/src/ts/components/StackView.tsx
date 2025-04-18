import { cn } from "@/lib/utils";
import {
  Children,
  type ReactElement,
  type ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// --- 型と定数 -------------------------------------------------------
export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
  None = "none",
}

export enum StackCmdType {
  Push = "push",
  Pop = "pop",
  None = "none",
}

export type PushCommand = {
  type: StackCmdType.Push;
  to: string;
  direction?: Direction;
};

export type PopCommand = {
  type: StackCmdType.Pop;
};

export type StackCommand = PushCommand | PopCommand;

interface State {
  current?: PushCommand;
  previous?: PushCommand;
  stack: PushCommand[];
}

// --- Reducer --------------------------------------------------------
const initialState: State = { stack: [] };

function reducer(
  state: State,
  action:
    | { type: "push"; payload: PushCommand }
    | { type: "pop" }
    | { type: "reset" },
): State {
  switch (action.type) {
    case "push":
      return {
        previous: state.current,
        current: action.payload,
        stack: [...state.stack, action.payload],
      };
    case "pop": {
      if (state.stack.length <= 1) return state;
      const nextStack = [...state.stack];
      const popped = nextStack.pop();
      return {
        previous: popped,
        current: nextStack.at(-1),
        stack: nextStack,
      };
    }
    case "reset":
      return initialState;
    default:
      return state;
  }
}

// --- Animation クラスマップ ----------------------------------------
const animationMap: Record<
  "push" | "pop" | "none",
  Record<Direction, string>
> = {
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
  none: {
    up: "",
    down: "",
    left: "",
    right: "",
    none: "",
  },
};

// --- Context --------------------------------------------------------
const StackContext = createContext<State | null>(null);
export const useStack = () => {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error("useStack must be used within <StackView>");
  return ctx;
};

// --- StackView ------------------------------------------------------
export function StackView({
  command,
  children,
}: { command?: StackCommand; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // コマンドを reducer に送信
  useEffect(() => {
    if (!command) return;
    if (command.type === "push") {
      dispatch({ type: "push", payload: command });
    } else if (command.type === "pop") {
      dispatch({ type: "pop" });
    }
  }, [command]);

  // 描画対象パネルを計算
  const views = useMemo(() => {
    const nodes: ReactElement[] = [];

    Children.forEach(children, (child) => {
      // StackViewList 以外はそのまま描画
      if (!isValidElement(child) || child.type !== StackViewList) {
        nodes.push(child as ReactElement);
        return;
      }

      // パネルを走査
      const panels = Children.toArray(child.props.children) as ReactElement[];
      for (const panel of panels) {
        if (!isValidElement<PanelProps>(panel)) return;

        const key = panel.props.panelId;
        const { current, previous } = state;

        // 表示対象のパネルを判定
        const isCurrent = current?.to === key;
        const isPrev = previous?.to === key;
        if (!isCurrent && !isPrev) return;

        const cmd = isCurrent
          ? StackCmdType.Push
          : (command?.type ?? StackCmdType.None);
        const dir = isCurrent
          ? (current?.direction ?? Direction.None)
          : (previous?.direction ?? Direction.None);

        nodes.push(
          cloneElement(panel, {
            isActive: true,
            cmd,
            direction: dir,
          }),
        );
      }
    });

    return nodes;
  }, [children, state, command]);

  return (
    <StackContext.Provider value={state}>
      <div className="relative flex-1 overflow-hidden">{views}</div>
    </StackContext.Provider>
  );
}

// --- StackViewList --------------------------------------------------
export const StackViewList = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

// --- StackViewPanel -------------------------------------------------
interface PanelProps {
  children: ReactNode;
  panelId: string;
  isActive?: boolean;
  direction?: Direction;
  cmd?: StackCmdType.Pop | StackCmdType.Push | StackCmdType.None;
  className?: string;
}

export function StackViewPanel({
  children,
  isActive = false,
  direction = Direction.None,
  cmd = StackCmdType.None,
  className,
}: PanelProps) {
  const visibility = isActive ? "block" : "hidden";
  const anim = cmd !== "none" ? animationMap[cmd][direction] : "";

  return (
    <div
      className={cn(
        "absolute w-full fill-mode-forwards transition-all duration-300",
        anim,
        visibility,
        className,
      )}
    >
      {children}
    </div>
  );
}
