import type { Auth, User } from "@/scripts/types";
import ApplicationLogo from "@components/ApplicationLogo";
import Dropdown from "@components/Dropdown";
import NavLink from "@components/NavLink";
import ResponsiveNavLink from "@components/ResponsiveNavLink";
import { StackViewProvider, useStackView } from "@components/StackView";
import { Timer } from "@components/Timer";
import { TimerStateWidget } from "@components/TimerStateWidget";
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
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { isTauriEnvironment } from "@/scripts/lib/isTauriEnvironment";

type DrawerLinkDefinition = {
  key: "statistics" | "tasks" | "tags" | "logs";
  href: "/auth/statistics" | "/auth/tasks" | "/auth/tags" | "/auth/logs";
  icon: typeof ActivitySquare;
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
}: {
  user: User;
}) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const isTauri = useMemo(() => isTauriEnvironment(), []);
  const drawerLinks = useMemo(() => links, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <DrawerButton open={open} setOpen={setOpen} />
      </SheetTrigger>
      <SheetContent side={"left"}>
        <SheetHeader className="sr-only">
          <SheetTitle>ナビゲーションメニュー</SheetTitle>
          <SheetDescription>主要ページへのリンクを表示しています</SheetDescription>
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

const HeaderNavigation = ({ user }: { user: User }) => {
  return (
    <nav className="flex flex-row justify-between border-line border-b bg-surface dark:border-line-subtle dark:bg-surface">
      <BackButton />
      <Sheet>
        <SheetTrigger>
          <TimerStateWidget />
        </SheetTrigger>
        <SheetContent side={"top"} className="size-full p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Timer</SheetTitle>
            <SheetDescription>タイマー用の操作パネルを開きます</SheetDescription>
          </SheetHeader>
          <Timer />
        </SheetContent>
      </Sheet>
      <Drawer user={user} />
    </nav>
  );
};

const FooterNavigation = () => {
  const matchRoute = useMatchRoute();
  const { t } = useTranslation();
  const footerLinks = useMemo(() => links, []);

  return (
    <nav className="sticky bottom-0 flex flex-row items-stretch justify-between divide-x border-line border-t border-b bg-surface shadow-lg dark:border-line-subtle dark:bg-surface">
      {footerLinks.map((link) => {
        const isActive = !!matchRoute({ to: link.href, fuzzy: false });
        const activeClassName = isActive ? "text-primary" : "text-fg";
        return (
          <Link
            key={link.href}
            to={link.href}
            className="flex flex-1 flex-col items-center"
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
    <div className="flex h-screen flex-col bg-surface-muted dark:bg-surface-muted">
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
        <>
          <HeaderNavigation user={user} />
          <main className="grow overflow-auto">{children}</main>
          <FooterNavigation />
        </>
      );
    case "pc":
      return (
        <>
          <HeaderNavigationPC user={user} />
          <main className="grow overflow-auto">{children}</main>
        </>
      );
  }
};
