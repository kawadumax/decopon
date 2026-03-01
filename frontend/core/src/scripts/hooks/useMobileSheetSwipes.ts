import type { SwipeEventData } from "react-swipeable";
import { useSwipeable } from "react-swipeable";

type SwipeableSheetState = {
  open: boolean;
  setOpen: (nextState: boolean) => void;
};

const EDGE_THRESHOLD = 32;
const TIMER_SWIPE_START_MIN = 40;
const TIMER_SWIPE_START_MAX = 140;

const isFromRightEdge = (eventData: SwipeEventData) => {
  if (typeof window === "undefined") return false;
  const startX = eventData.initial?.[0];
  if (typeof startX !== "number") return false;
  return window.innerWidth - startX <= EDGE_THRESHOLD;
};

const isFromTimerSwipeBand = (eventData: SwipeEventData) => {
  const startY = eventData.initial?.[1];
  if (typeof startY !== "number") return false;
  return startY >= TIMER_SWIPE_START_MIN && startY <= TIMER_SWIPE_START_MAX;
};

export const useMobileSheetSwipes = ({
  enabled,
  drawerState,
  timerState,
}: {
  enabled: boolean;
  drawerState: SwipeableSheetState;
  timerState: SwipeableSheetState;
}) => {
  const rootHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (!enabled || drawerState.open) return;
      if (isFromRightEdge(eventData)) {
        drawerState.setOpen(true);
      }
    },
    onSwipedDown: (eventData) => {
      if (!enabled || timerState.open) return;
      if (isFromTimerSwipeBand(eventData)) {
        timerState.setOpen(true);
      }
    },
    trackTouch: true,
    trackMouse: false,
    delta: 40,
    preventScrollOnSwipe: false,
  });

  const drawerContentHandlers = useSwipeable({
    onSwipedRight: () => {
      if (!enabled || !drawerState.open) return;
      drawerState.setOpen(false);
    },
    trackTouch: true,
    trackMouse: false,
    delta: 30,
    preventScrollOnSwipe: true,
  });

  const timerContentHandlers = useSwipeable({
    onSwipedUp: () => {
      if (!enabled || !timerState.open) return;
      timerState.setOpen(false);
    },
    trackTouch: true,
    trackMouse: false,
    delta: 30,
    preventScrollOnSwipe: true,
  });

  const timerHandleHandlers = useSwipeable({
    onSwipedDown: (eventData) => {
      if (!enabled || timerState.open) return;
      if (isFromTimerSwipeBand(eventData)) {
        timerState.setOpen(true);
      }
    },
    trackTouch: true,
    trackMouse: false,
    delta: 24,
    preventScrollOnSwipe: true,
  });

  return {
    rootHandlers: (enabled ? rootHandlers : {}) as ReturnType<typeof useSwipeable>,
    drawerContentHandlers: (enabled ? drawerContentHandlers : {}) as ReturnType<
      typeof useSwipeable
    >,
    timerContentHandlers: (enabled ? timerContentHandlers : {}) as ReturnType<
      typeof useSwipeable
    >,
    timerHandleHandlers: (enabled ? timerHandleHandlers : {}) as ReturnType<
      typeof useSwipeable
    >,
  };
};

export type MobileSheetSwipeHandlers = ReturnType<typeof useSwipeable>;
