import { isTauriEnvironment } from "@/scripts/lib/isTauriEnvironment";
import type { Auth, User } from "@/scripts/types";
import ApplicationLogo from "@components/ApplicationLogo";
import Dropdown from "@components/Dropdown";
import { HitSlop } from "@components/HitSlop";
import NavLink from "@components/NavLink";
import ResponsiveNavLink from "@components/ResponsiveNavLink";
import { StackViewProvider, useStackView } from "@components/StackView";
import { Timer } from "@components/Timer";
import { TimerStateWidget } from "@components/TimerStateWidget";
import { TimerSwipeHandle } from "@components/TimerSwipeHandle";
import { Separator } from "@components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import { Toaster } from "@components/ui/sonner";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { type KeyboardState, useKeyboardState } from "@hooks/useKeyboardInset";
import {
  type MobileSheetSwipeHandlers,
  useMobileSheetSwipes,
} from "@hooks/useMobileSheetSwipes";
import { cn } from "@lib/utils";
import {
  ActivitySquare,
  ArrowLeft,
  Book,
  ListCheck,
  Tag as TagIcon,
} from "@mynaui/icons-react";
import { useTimerStore } from "@store/timer";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  type Dispatch,
  type PropsWithChildren,
  type ReactNode,
  type SetStateAction,
  forwardRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

type DrawerLinkDefinition = {
  key: "statistics" | "tasks" | "tags" | "logs";
  href: "/auth/statistics" | "/auth/tasks" | "/auth/tags" | "/auth/logs";
  icon: typeof ActivitySquare;
};

type SheetOpenState = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const links: DrawerLinkDefinition[] = [
  {
    key: "tasks",
    href: "/auth/tasks",
    icon: ListCheck,
  },
  {
    key: "tags",
    href: "/auth/tags",
    icon: TagIcon,
  },
  {
    key: "logs",
    href: "/auth/logs",
    icon: Book,
  },
  {
    key: "statistics",
    href: "/auth/statistics",
    icon: ActivitySquare,
  },
];

const Drawer = ({
  user,
  drawerState,
  swipeHandlers,
}: {
  user: User;
  drawerState: SheetOpenState;
  swipeHandlers: MobileSheetSwipeHandlers;
}) => {
  const { open, setOpen } = drawerState;
  const { t } = useTranslation();
  const isTauri = useMemo(() => isTauriEnvironment(), []);
  const drawerLinks = useMemo(() => links, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <DrawerButton open={open} setOpen={setOpen} />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="pb-4"
        style={{
          paddingTop:
            "calc(1rem + var(--decopon-safe-area-top, env(safe-area-inset-top)))",
        }}
        {...swipeHandlers}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>ナビゲーションメニュー</SheetTitle>
          <SheetDescription>
            主要ページへのリンクを表示しています
          </SheetDescription>
        </SheetHeader>
        {!isTauri && (
          <>
            <SheetHeader>
              <div className="px-4">
                <div className="font-medium text-base text-fg dark:text-fg-inverse">
                  {user.name}
                </div>
                <div className="font-medium text-fg-muted text-sm">
                  {user.email}
                </div>
              </div>
            </SheetHeader>
            <Separator className="my-4" />
          </>
        )}
        <div className="space-y-1 mt-8">
          {drawerLinks.map((link) => (
            <ResponsiveNavLink key={link.href} to={link.href}>
              {t(`header.menu.${link.key}`)}
            </ResponsiveNavLink>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="border-line dark:border-line-strong">
          <div className="space-y-1">
            <ResponsiveNavLink to="/auth/preferences">
              {t("header.menu.preference")}
            </ResponsiveNavLink>
            <a
              href="https://kawadumax.github.io/decopon/"
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex w-full items-start border-l-4 py-2 pe-4 ps-3 text-base font-medium transition duration-150 ease-in-out focus:outline-hidden",
                "border-transparent text-fg-secondary hover:border-line-subtle hover:bg-surface-muted hover:text-fg focus:border-line-subtle focus:bg-surface-muted focus:text-fg dark:text-fg-muted dark:hover:border-line-strong dark:hover:bg-surface-inverse-muted dark:hover:text-fg-inverse dark:focus:border-line-strong dark:focus:bg-surface-inverse-muted dark:focus:text-fg-inverse",
              )}
            >
              {t("header.menu.about")}
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const DrawerButton = forwardRef<
  HTMLButtonElement,
  {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
  } & React.HTMLProps<HTMLButtonElement>
>(({ open, setOpen, ...props }, ref) => {
  return (
    <div className="flex items-center">
      <button
        ref={ref}
        {...props}
        type="button"
        onClick={() => setOpen((previousState) => !previousState)}
        className="inline-flex items-center justify-center rounded-md p-2 text-fg-muted transition duration-150 ease-in-out hover:bg-surface-muted hover:text-fg-muted focus:bg-surface-muted focus:text-fg-muted focus:outline-hidden dark:text-fg-muted dark:focus:bg-surface-elevated dark:focus:text-fg-muted dark:hover:bg-surface-elevated dark:hover:text-fg-muted"
      >
        <svg
          className="h-6 w-6"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
        >
          <title>Dropdown</title>
          <path
            className={!open ? "inline-flex" : "hidden"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
          <path
            className={open ? "inline-flex" : "hidden"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
});

const HeaderNavigationPC = ({ user }: { user: User }) => {
  const { t } = useTranslation();

  return (
    <nav className="h-16 border-line border-b bg-surface dark:border-line-subtle dark:bg-surface">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex shrink-0 items-center">
              <Link to="/">
                <ApplicationLogo className="block h-9 w-auto fill-current text-fg dark:text-fg-inverse" />
              </Link>
            </div>

            <div className="sm:-my-px hidden space-x-8 sm:ms-10 sm:flex">
              {links.map((link) => (
                <NavLink key={link.href} to={link.href}>
                  {t(`header.menu.${link.key}`)}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden sm:ms-6 sm:flex sm:items-center">
            <TimerStateWidget />
            <div className="relative ms-3">
              <Dropdown>
                <Dropdown.Trigger>
                  <span className="inline-flex rounded-md">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md border border-transparent bg-surface px-3 py-2 font-medium text-fg-muted text-sm leading-4 transition duration-150 ease-in-out hover:text-fg focus:outline-hidden dark:bg-surface dark:text-fg-muted dark:hover:text-fg-secondary"
                    >
                      {user.name}

                      <svg
                        className="-me-0.5 ms-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <title>DropDown Trigger</title>
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </span>
                </Dropdown.Trigger>

                <Dropdown.Content>
                  <Dropdown.Link to="/auth/preferences">
                    {t("header.menu.preference")}
                  </Dropdown.Link>
                  <Dropdown.ExternalLink
                    href="https://kawadumax.github.io/decopon/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("header.menu.about")}
                  </Dropdown.ExternalLink>
                </Dropdown.Content>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const BackButton = () => {
  const [state, dispatch] = useStackView();
  return (
    <button
      type="button"
      className={cn(["p-2", state.stack.length <= 1 && "invisible"])}
      onClick={() => dispatch({ type: "pop" })}
    >
      <ArrowLeft fill="currentColor" />
    </button>
  );
};

const HeaderNavigation = ({
  user,
  drawerState,
  timerState,
  drawerSwipeHandlers,
  timerSwipeHandlers,
  timerHandleHandlers,
  keyboardState,
}: {
  user: User;
  drawerState: SheetOpenState;
  timerState: SheetOpenState;
  drawerSwipeHandlers: MobileSheetSwipeHandlers;
  timerSwipeHandlers: MobileSheetSwipeHandlers;
  timerHandleHandlers: MobileSheetSwipeHandlers;
  keyboardState: KeyboardState;
}) => {
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const element = headerRef.current;
    if (!element) return;

    const updateHeaderHeight = () => {
      const { height } = element.getBoundingClientRect();
      setHeaderHeight(height);
      document.documentElement.style.setProperty(
        "--decopon-header-height",
        `${height}px`,
      );
    };

    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [keyboardState.isOpen]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    let rafId = 0;
    let pending: ReturnType<typeof getHeaderMetrics> | null = null;
    const shouldLog = () => {
      if (window.__decoponImeDebug === true) return true;
      try {
        return window.localStorage.getItem("decopon:ime-debug") === "1";
      } catch {
        return false;
      }
    };
    const getHeaderMetrics = (eventType: string) => {
      const rect = headerRef.current?.getBoundingClientRect();
      const viewport = window.visualViewport;
      const main = document.querySelector("main");
      const mainScrollTop =
        main && "scrollTop" in main ? (main as HTMLElement).scrollTop : null;
      const mainScrollHeight =
        main && "scrollHeight" in main
          ? (main as HTMLElement).scrollHeight
          : null;
      const mainClientHeight =
        main && "clientHeight" in main
          ? (main as HTMLElement).clientHeight
          : null;
      const visualViewportGap = viewport
        ? Math.max(0, window.innerHeight - viewport.height)
        : null;
      const visualOffsetApplied = (() => {
        if (!viewport) return 0;
        const offsetTop = viewport.offsetTop ?? 0;
        return Math.round(offsetTop);
      })();
      return {
        eventType,
        headerTop: rect?.top ?? null,
        headerBottom: rect?.bottom ?? null,
        headerHeight: rect?.height ?? null,
        scrollY: window.scrollY,
        documentScrollTop: document.documentElement.scrollTop,
        mainScrollTop,
        mainScrollHeight,
        mainClientHeight,
        visualViewportHeight: viewport?.height ?? null,
        visualViewportOffsetTop: viewport?.offsetTop ?? null,
        visualViewportGap,
        visualViewportAppliedOffset: visualOffsetApplied,
        isImeOpen: keyboardState.isOpen,
        layoutLoss: keyboardState.layoutLoss,
        visualLoss: keyboardState.visualLoss,
        visualViewportScale: viewport?.scale ?? null,
        visualViewportPageTop:
          typeof viewport?.pageTop === "number" ? viewport.pageTop : null,
      };
    };
    const logState = (eventType: string) => {
      if (!shouldLog()) return;
      pending = getHeaderMetrics(eventType);
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (pending) {
          console.info("[ime-debug] header-metrics", pending);
        }
        pending = null;
        rafId = 0;
      });
    };
    const onWindowScroll = () => logState("window-scroll");
    const onWindowResize = () => logState("window-resize");
    const onViewportScroll = () => logState("visual-scroll");
    const onViewportResize = () => logState("visual-resize");
    const onMainScroll = () => logState("main-scroll");
    const main = document.querySelector("main");

    window.addEventListener("scroll", onWindowScroll, { passive: true });
    window.addEventListener("resize", onWindowResize);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    window.visualViewport?.addEventListener("scroll", onViewportScroll);
    main?.addEventListener("scroll", onMainScroll, { passive: true });
    logState("init");
    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      window.removeEventListener("resize", onWindowResize);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      window.visualViewport?.removeEventListener("scroll", onViewportScroll);
      main?.removeEventListener("scroll", onMainScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [keyboardState.isOpen, keyboardState.layoutLoss, keyboardState.visualLoss]);

  return (
    <nav
      ref={headerRef}
      style={{
        paddingTop:
          "var(--decopon-safe-area-top, env(safe-area-inset-top))",
      }}
      className="fixed inset-x-0 top-0 z-40 flex w-full shrink-0 flex-row items-center justify-between border-line border-b bg-surface dark:border-line-subtle dark:bg-surface"
    >
      <BackButton />
      <Sheet open={timerState.open} onOpenChange={timerState.setOpen}>
        <div className="flex flex-col items-center gap-1">
          <SheetTrigger>
            <HitSlop hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
              <TimerStateWidget />
            </HitSlop>
          </SheetTrigger>
          <TimerSwipeHandle
            swipeHandlers={timerHandleHandlers}
            className="pb-1"
          />
        </div>
        <SheetContent
          side={"top"}
          className="p-0 pb-4"
          offsetTop={headerHeight}
          zIndex={30}
          closeSafeArea={false}
          {...timerSwipeHandlers}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Timer</SheetTitle>
            <SheetDescription>
              タイマー用の操作パネルを開きます
            </SheetDescription>
          </SheetHeader>
          <Timer />
        </SheetContent>
      </Sheet>
      <Drawer
        user={user}
        drawerState={drawerState}
        swipeHandlers={drawerSwipeHandlers}
      />
    </nav>
  );
};

const FooterNavigation = ({ isHidden }: { isHidden: boolean }) => {
  const matchRoute = useMatchRoute();
  const { t } = useTranslation();
  const footerLinks = useMemo(() => links, []);
  const footerSafeAreaBottom =
    "var(--decopon-safe-area-bottom, env(safe-area-inset-bottom))";

  if (isHidden) return null;

  return (
    <nav
      className={cn(
        "sticky bottom-0 flex flex-row items-stretch justify-between divide-x border-line border-t border-b bg-surface shadow-lg dark:border-line-subtle dark:bg-surface",
      )}
    >
      {footerLinks.map((link) => {
        const isActive = !!matchRoute({ to: link.href, fuzzy: false });
        const activeClassName = isActive ? "text-primary" : "text-fg";
        return (
          <Link
            key={link.href}
            to={link.href}
            className="flex flex-1 flex-col items-center"
            style={{ paddingBottom: footerSafeAreaBottom }}
          >
            <span
              className={cn([
                "flex flex-col items-center text-center font-light text-xs focus:text-primary",
                activeClassName,
              ])}
            >
              {<link.icon className="m-1 mb-0" />}
              {t(`header.menu.${link.key}`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default function Authenticated({
  children,
}: PropsWithChildren<{ header?: ReactNode }>) {
  const queryClient = useQueryClient();
  const auth = queryClient.getQueryData(["auth"]) as Auth;
  const user = auth.user;
  if (!user) {
    throw new Error("User not found");
  }

  const setWorkTime = useTimerStore((s) => s.setWorkTime);
  const setBreakTime = useTimerStore((s) => s.setBreakTime);
  setWorkTime(user?.work_time || 25);
  setBreakTime(user?.break_time || 5);

  return (
    <div
      className="flex h-screen flex-col bg-surface-muted dark:bg-surface-muted"
      style={{ height: "100dvh" }}
    >
      <StackViewProvider>
        <ResponsiveLayout user={user}>{children}</ResponsiveLayout>
      </StackViewProvider>
      <Toaster richColors />
    </div>
  );
}

const ResponsiveLayout = ({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) => {
  const deviceSize = useDeviceSize();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const enableMobileLayout = deviceSize === "mobile" || deviceSize === "tablet";
  const keyboardState = useKeyboardState();
  const shouldHideFooter = enableMobileLayout && keyboardState.isOpen;

  const {
    rootHandlers,
    drawerContentHandlers,
    timerContentHandlers,
    timerHandleHandlers,
  } = useMobileSheetSwipes({
    enabled: enableMobileLayout,
    drawerState: { open: isDrawerOpen, setOpen: setIsDrawerOpen },
    timerState: { open: isTimerOpen, setOpen: setIsTimerOpen },
  });

  switch (deviceSize) {
    case undefined:
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      );
    case "mobile":
    case "tablet":
      return (
        <div className="flex h-full flex-col" {...rootHandlers}>
          <HeaderNavigation
            user={user}
            drawerState={{ open: isDrawerOpen, setOpen: setIsDrawerOpen }}
            timerState={{ open: isTimerOpen, setOpen: setIsTimerOpen }}
            drawerSwipeHandlers={drawerContentHandlers}
            timerSwipeHandlers={timerContentHandlers}
            timerHandleHandlers={timerHandleHandlers}
            keyboardState={keyboardState}
          />
          <main
            className="grow min-h-0 overflow-auto"
            style={{ paddingTop: "var(--decopon-header-height, 0px)" }}
          >
            {children}
          </main>
          <FooterNavigation isHidden={shouldHideFooter} />
        </div>
      );
    case "pc":
      return (
        <>
          <HeaderNavigationPC user={user} />
          <main className="grow min-h-0 overflow-auto">{children}</main>
        </>
      );
  }
};
