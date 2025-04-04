import ApplicationLogo from "@/components/ApplicationLogo";
import Dropdown from "@/components/Dropdown";
import NavLink from "@/components/NavLink";
import ResponsiveNavLink from "@/components/ResponsiveNavLink";
import { TimerStateWidget } from "@/components/TimerStateWidget";
import { Toaster } from "@/components/ui/sonner";
import { useTimeEntryApi } from "@/hooks/useTimeEntryApi";
import { breakTimeAtom, languageAtom, workTimeAtom } from "@/lib/atoms";
import { type Auth, Locale } from "@/types/index.d";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

export default function Authenticated({
  header,
  children,
}: PropsWithChildren<{ header?: ReactNode }>) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const auth = queryClient.getQueryData(["auth"]) as Auth;
  const user = auth.user;
  if (!user) {
    throw new Error("User not found");
  }

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

  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState(false);

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
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
                <NavLink
                  to="/auth/dashboard"
                  active={route().current("dashboard")}
                >
                  {t("header.menu.dashboard")}
                </NavLink>
                <NavLink
                  to="/auth/tasks"
                  active={route().current("tasks.index")}
                >
                  {t("header.menu.tasks")}
                </NavLink>
                <NavLink to="/auth/tags" active={route().current("tags.index")}>
                  {t("header.menu.tags")}
                </NavLink>
                <NavLink to="/auth/logs" active={route().current("logs.index")}>
                  {t("header.menu.timeline")}
                </NavLink>
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
                        className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 font-medium text-gray-500 text-sm leading-4 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
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

            <div className="-me-2 flex items-center sm:hidden">
              <button
                type="button"
                onClick={() =>
                  setShowingNavigationDropdown(
                    (previousState) => !previousState,
                  )
                }
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-500 dark:focus:bg-gray-900 dark:focus:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-400"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <title>Dropdown</title>
                  <path
                    className={
                      !showingNavigationDropdown ? "inline-flex" : "hidden"
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                  <path
                    className={
                      showingNavigationDropdown ? "inline-flex" : "hidden"
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${showingNavigationDropdown ? "block" : "hidden"} sm:hidden`}
        >
          <div className="space-y-1 pt-2 pb-3">
            <ResponsiveNavLink
              to={"/auth/dashboard"}
              active={route().current("dashboard")}
            >
              {t("header.menu.dashboard")}
            </ResponsiveNavLink>
          </div>

          <div className="border-gray-200 border-t pt-4 pb-1 dark:border-gray-600">
            <div className="px-4">
              <div className="font-medium text-base text-gray-800 dark:text-gray-200">
                {user.name}
              </div>
              <div className="font-medium text-gray-500 text-sm">
                {user.email}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <ResponsiveNavLink to="/auth/profiles">
                {t("header.menu.profile")}
              </ResponsiveNavLink>
              <ResponsiveNavLink to={route("logout")} variant="button">
                {t("header.menu.logout")}
              </ResponsiveNavLink>
            </div>
          </div>
        </div>
      </nav>

      {header && (
        <header className="z-10 bg-white shadow dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {header}
          </div>
        </header>
      )}

      <main className="h-[calc(100vh-8rem)] flex-grow">{children}</main>
      <Toaster richColors />
    </div>
  );
}
