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
  Init = "init",
  Push = "push",
  Pop = "pop",
  None = "none",
}

export type PushCommand = {
  type: StackCmdType.Push;
  to: string;
  direction?: Direction;
};

export type InitCommand = PushCommand;

export type PopCommand = {
  type: StackCmdType.Pop;
  to: string;
  direction?: Direction;
};

export type StackCommand = PushCommand | PopCommand | InitCommand;

interface State {
  current?: StackCommand;
  previous?: StackCommand;
  stack: StackCommand[];
}

// --- Reducer --------------------------------------------------------
const initialState: State = { stack: [] };

function reducer(
  state: State,
  action:
    | { type: "init"; payload: InitCommand }
    | { type: "push"; payload: PushCommand }
    | { type: "pop"; payload?: PopCommand }
    | { type: "reset" },
): State {
  switch (action.type) {
    case "init":
      return {
        previous: state.current,
        current: action.payload,
        stack: [action.payload],
      };
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
        previous: popped ? { ...popped, type: StackCmdType.Pop } : undefined,
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
    up: "animate-push-up will-change-transform",
    down: "animate-push-down will-change-transform",
    left: "animate-push-left will-change-transform",
    right: "animate-push-right will-change-transform",
    none: "animate-push-none will-change-transform",
  },
  pop: {
    up: "animate-pop-up will-change-transform",
    down: "animate-pop-down will-change-transform",
    left: "animate-pop-left will-change-transform",
    right: "animate-pop-right will-change-transform",
    none: "animate-pop-none will-change-transform",
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
type StackContextType = [
  State,
  React.Dispatch<
    | {
        type: "init";
        payload: InitCommand;
      }
    | {
        type: "push";
        payload: PushCommand;
      }
    | {
        type: "pop";
        payload?: PopCommand;
      }
    | {
        type: "reset";
      }
  >,
];

const StackContext = createContext<StackContextType | null>(null);

export const useStackView = () => {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error("useStack must be used within <StackView>");
  return ctx;
};

// --- StackView ------------------------------------------------------
export function StackViewProvider({ children }: { children: ReactNode }) {
  const reducerCtx = useReducer(reducer, initialState);
  return (
    <StackContext.Provider value={reducerCtx}>{children}</StackContext.Provider>
  );
}

// --- StackViewList --------------------------------------------------
export const StackViewList = ({
  initialPanelId = "default",
  children,
}: { initialPanelId?: string; children: ReactNode }) => {
  const [state, dispatch] = useStackView();

  useEffect(() => {
    dispatch({
      type: "init",
      payload: {
        type: StackCmdType.Push,
        to: initialPanelId,
        direction: Direction.None,
      },
    });
  }, [initialPanelId, dispatch]);

  // 描画対象パネルを計算
  const views = useMemo(() => {
    const nodes: ReactElement[] = [];

    // パネルを走査
    const panels = Children.toArray(children) as ReactElement[];
    for (const panel of panels) {
      if (!isValidElement<PanelProps>(panel)) continue;

      const key = panel.props.panelId;
      const { current, previous } = state;

      // 表示対象のパネルを判定
      const isCurrent = current?.to === key;
      const isPrev = previous?.to === key;

      if (!isCurrent && !isPrev) continue;

      const cmd = isCurrent
        ? StackCmdType.Push
        : (previous?.type ?? StackCmdType.None);
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

    return nodes;
  }, [children, state]);

  return <div className="relative flex-1 overflow-hidden">{views}</div>;
};

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
  const visibility = isActive ? "block" : "hidden translate-x-full";
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
