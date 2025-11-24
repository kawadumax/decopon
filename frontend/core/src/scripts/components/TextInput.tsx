import {
  type InputHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { cn } from "@/scripts/lib/utils";

export default forwardRef(function TextInput(
  {
    type = "text",
    className = "",
    isFocused = false,
    ...props
  }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
  ref,
) {
  const localRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => localRef.current?.focus(),
  }));

  useEffect(() => {
    if (isFocused) {
      localRef.current?.focus();
    }
  }, [isFocused]);

  return (
    <input
      {...props}
      type={type}
      className={cn(
        "rounded-md border-line-subtle shadow-xs focus:border-primary focus:ring-primary dark:border-line-subtle dark:bg-surface dark:text-fg dark:focus:border-primary dark:focus:ring-primary",
        className,
      )}
      ref={localRef}
    />
  );
});
