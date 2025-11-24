import type { DecoponLinkProps } from "@/scripts/types";
import { Transition } from "@headlessui/react";
import { useLogout } from "@hooks/useLogout";
import { Link } from "@tanstack/react-router";
import { cn } from "@/scripts/lib/utils";
import {
  type Dispatch,
  type PropsWithChildren,
  type ReactNode,
  type SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

const DropDownContext = createContext<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  toggleOpen: () => void;
}>({
  open: false,
  setOpen: () => {},
  toggleOpen: () => {},
});

const Dropdown = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen((previousState) => !previousState);
  };

  return (
    <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <div className="relative">{children}</div>
    </DropDownContext.Provider>
  );
};

const Trigger = ({ children }: PropsWithChildren) => {
  const { open, setOpen, toggleOpen } = useContext(DropDownContext);

  return (
    <>
      <div onKeyDown={() => toggleOpen} onClick={toggleOpen}>
        {children}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40"
          onKeyDown={() => setOpen(false)}
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

const Content = ({
  align = "right",
  width = "48",
  contentClasses = "py-1 bg-surface dark:bg-surface-muted",
  children,
}: PropsWithChildren<{
  align?: "left" | "right";
  width?: "48";
  contentClasses?: string;
}>) => {
  const { open, setOpen } = useContext(DropDownContext);

  let alignmentClasses = "origin-top";

  if (align === "left") {
    alignmentClasses = "ltr:origin-top-left rtl:origin-top-right start-0";
  } else if (align === "right") {
    alignmentClasses = "ltr:origin-top-right rtl:origin-top-left end-0";
  }

  let widthClasses = "";

  if (width === "48") {
    widthClasses = "w-48";
  }

  return (
    <>
      <Transition
        show={open}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          className={cn(
            "absolute z-50 mt-2 rounded-md shadow-lg",
            alignmentClasses,
            widthClasses,
          )}
          onClick={() => setOpen(false)}
          onKeyDown={() => setOpen(false)}
        >
          <div
            className={cn(
              "rounded-md ring-1 ring-black ring-opacity-5",
              contentClasses,
            )}
          >
            {children}
          </div>
        </div>
      </Transition>
    </>
  );
};
const commonClassis = (additionalClasses: string) =>
  cn(
    "block w-full px-4 py-2 text-start text-sm leading-5 text-fg transition duration-150 ease-in-out hover:bg-surface-muted focus:bg-surface-muted focus:outline-hidden dark:text-fg-secondary dark:hover:bg-surface-muted dark:focus:bg-surface-muted",
    additionalClasses,
  );

const DropdownLink = ({
  className = "",
  children,
  to,
  ...props
}: DecoponLinkProps) => {
  return (
    <Link to={to} {...props} className={commonClassis(className)}>
      {children}
    </Link>
  );
};

const DropdownButton = ({
  className = "",
  children,
}: { className?: string; children: ReactNode }) => {
  const { logout, loading } = useLogout();

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={commonClassis(className)}
    >
      {children}
    </button>
  );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
Dropdown.Button = DropdownButton;
export default Dropdown;
