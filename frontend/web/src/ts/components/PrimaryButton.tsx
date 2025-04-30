import type { ButtonHTMLAttributes } from "react";

export default function PrimaryButton({
  className = "",
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-white text-xs uppercase tracking-widest transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 active:bg-gray-900 dark:bg-gray-200 dark:text-gray-800 dark:active:bg-gray-300 dark:focus:bg-white dark:focus:ring-offset-gray-800 dark:hover:bg-white ${
        disabled && "opacity-25"
      } ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
