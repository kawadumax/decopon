import ApplicationLogo from "@/components/ApplicationLogo";
import Dropdown from "@/components/Dropdown";
import NavLink from "@/components/NavLink";
import ResponsiveNavLink from "@/components/ResponsiveNavLink";
import { TimerStateWidget } from "@/components/TimerStateWidget";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useDeviseSize } from "@/hooks/useDeviseSize";
import { useTimeEntryApi } from "@/hooks/useTimeEntryApi";
import { breakTimeAtom, languageAtom, workTimeAtom } from "@/lib/atoms";
import { type Auth, Locale, type User } from "@/types/index.d";
import { ArrowLeft } from "@mynaui/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { t } from "i18next";
import { useSetAtom } from "jotai";
import {
  type Dispatch,
  type PropsWithChildren,
  type ReactNode,
  type SetStateAction,
  forwardRef,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

const links = [
  {
    name: t("header.menu.dashboard"),
    href: "/auth/dashboard",
  },
  {
    name: t("header.menu.tasks"),
    href: "/auth/tasks",
  },
  {
    name: t("header.menu.tags"),
    href: "/auth/tags",
  },
  {
    name: t("header.menu.timeline"),
    href: "/auth/logs",
  },
] as const;

const Drawer = ({
  user,
}: {
  user: User;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <DrawerButton open={open} setOpen={setOpen} />
      </SheetTrigger>
      <SheetContent side={"left"}>
        <SheetHeader>
          <div className="px-4">
            <div className="font-medium text-base text-gray-800 dark:text-gray-200">
              {user.name}
            </div>
            <div className="font-medium text-gray-500 text-sm">
              {user.email}
            </div>
          </div>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="space-y-1">
          {links.map((link) => (
            <ResponsiveNavLink key={link.name} to={link.href}>
              {link.name}
            </ResponsiveNavLink>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="border-gray-200 dark:border-gray-600">
          <div className="space-y-1">
            <ResponsiveNavLink to="/auth/profiles">
              {t("header.menu.profile")}
            </ResponsiveNavLink>
            <ResponsiveNavLink to={route("logout")} variant="button">
              {t("header.menu.logout")}
            </ResponsiveNavLink>
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
  } & React.HTMLProps<HTMLButtonElement> // ← button props も追加
>(({ open, setOpen, ...props }, ref) => {
  return (
    <div className="flex items-center sm:hidden">
      <button
        ref={ref}
        {...props}
        type="button"
        onClick={() => setOpen((previousState) => !previousState)}
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-hidden dark:text-gray-500 dark:focus:bg-gray-900 dark:focus:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-400"
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

const HeaderNavigation = ({ user }: { user: User }) => {
  const { t } = useTranslation();

  return (
    <nav className="h-16 border-gray-100 border-b bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex shrink-0 items-center">
              <Link to="/">
                <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200" />
              </Link>
            </div>

            <div className="sm:-my-px hidden space-x-8 sm:ms-10 sm:flex">
              {links.map((link) => (
                <NavLink key={link.name} to={link.href}>
                  {link.name}
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
                      className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 font-medium text-gray-500 text-sm leading-4 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-hidden dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
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
                  <Dropdown.Link to="/auth/profiles">
                    {t("header.menu.profile")}
                  </Dropdown.Link>
                  <Dropdown.Button>{t("header.menu.logout")}</Dropdown.Button>
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
  return (
    <button type="button" className="p-2">
      <ArrowLeft fill="currentColor" />
    </button>
  );
};

const HeaderNavigationMobile = ({ user }: { user: User }) => {
  return (
    <nav className="flex flex-row justify-between border-gray-100 border-b bg-white dark:border-gray-700 dark:bg-gray-800">
      <BackButton />
      <TimerStateWidget />
      <Drawer user={user} />
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

  const devise = useDeviseSize();

  const preference = user.preference;
  const lang = preference?.locale || Locale.ENGLISH;
  const setLang = useSetAtom(languageAtom);
  const { initCyclesOfTimeEntry } = useTimeEntryApi();

  useEffect(() => {
    setLang(lang);
  }, [lang, setLang]);

  const setWorkTime = useSetAtom(workTimeAtom);
  const setBreakTime = useSetAtom(breakTimeAtom);
  setWorkTime(preference?.work_time || 25);
  setBreakTime(preference?.break_time || 5);

  useEffect(() => {
    initCyclesOfTimeEntry();
  }, [initCyclesOfTimeEntry]);

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      {devise === "pc" ? (
        <HeaderNavigation user={user} />
      ) : (
        <HeaderNavigationMobile user={user} />
      )}
      <main className="h-[calc(100vh-8rem)] grow">{children}</main>
      <Toaster richColors />
    </div>
  );
}
