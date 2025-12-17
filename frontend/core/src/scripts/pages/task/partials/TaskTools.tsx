import { cn } from "@/scripts/lib/utils";
import { useTaskMutations } from "@/scripts/queries";
import type { CreateTaskVariables } from "@/scripts/queries";
import { useTagStore } from "@/scripts/store/tag";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { useKeyboardState } from "@hooks/useKeyboardInset";
import { PlusCircle, X } from "@mynaui/icons-react";
import type { CSSProperties, RefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

type TaskToolsProps = {
  containerRef: RefObject<HTMLElement>;
};

const isEditableElement = (target: HTMLElement | null) => {
  if (!target) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
};

const useContainerRect = (containerRef: RefObject<HTMLElement>) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const nextRect = container.getBoundingClientRect();
    setRect(nextRect);
  }, [containerRef]);

  useLayoutEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [updateRect]);

  return rect;
};

const useKeyboardShortcut = (onOpen: () => void) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key.toLowerCase() !== "n") return;
      const target = event.target as HTMLElement | null;
      if (isEditableElement(target)) return;
      event.preventDefault();
      onOpen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
};

const TaskCreateOverlay = ({
  isOpen,
  inputValue,
  onChange,
  onSubmit,
  onClose,
  isPending,
  containerRect,
  bottomOffset,
}: {
  isOpen: boolean;
  inputValue: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isPending: boolean;
  containerRect: DOMRect | null;
  bottomOffset: string;
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const layoutStyle = useMemo(() => {
    const style: CSSProperties = { bottom: bottomOffset };
    if (containerRect) {
      style.left = containerRect.left;
      style.width = containerRect.width;
    }
    return style;
  }, [bottomOffset, containerRect]);
  const layoutClassName = cn(
    "fixed bottom-0 pointer-events-none transition-[bottom] duration-200",
    "z-50",
    containerRect ? null : "left-4 right-4",
  );

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={layoutStyle} className={layoutClassName}>
      <div className="pointer-events-auto mx-auto max-w-2xl px-4">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-elevated px-3 py-2 shadow-lg dark:border-line-subtle dark:bg-surface">
          <Input
            ref={inputRef}
            data-task-composer-input="true"
            value={inputValue}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("task.add")}
            className="flex-1 bg-transparent"
            aria-label={t("task.add")}
          />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || inputValue.trim() === ""}
          >
            {t("common.add")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const TaskTools = ({ containerRef }: TaskToolsProps) => {
  const { t } = useTranslation();
  const deviceSize = useDeviceSize();
  const { inset: keyboardInset, isOpen: isKeyboardOpen } = useKeyboardState();
  const currentTag = useTagStore((s) => s.currentTag);
  const { createTask } = useTaskMutations(currentTag?.id);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const containerRect = useContainerRect(containerRef);
  const isMobile = deviceSize === "mobile";
  const isTabletOrPc = deviceSize === "tablet" || deviceSize === "pc";

  const baseBottomOffset = useMemo(() => {
    if (deviceSize === "pc") return 24;
    if (deviceSize === "tablet") return 24;
    if (isKeyboardOpen) return 8;
    return 88;
  }, [deviceSize, isKeyboardOpen]);
  const bottomOffset = useMemo(
    () =>
      `calc(env(safe-area-inset-bottom, 0px) + ${keyboardInset}px + ${baseBottomOffset}px)`,
    [baseBottomOffset, keyboardInset],
  );

  const openComposer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setIsOpen(false);
    setInputValue("");
  }, []);

  useKeyboardShortcut(openComposer);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length === 0 || createTask.isPending) return;
    const payload: CreateTaskVariables = {
      title: trimmed,
      description: "New Task Description",
      completed: false,
      parent_task_id: undefined,
      tags: currentTag ? [currentTag] : [],
    };
    createTask.mutate(payload, {
      onSuccess: () => {
        setInputValue("");
        requestAnimationFrame(() => {
          if (isOpen && isMobile) {
            // 連続追加用にフォーカスを維持
            const input = document.querySelector<HTMLInputElement>(
              "[data-task-composer-input=true]",
            );
            input?.focus();
          }
        });
      },
    });
  }, [createTask, currentTag, inputValue, isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen || !isTabletOrPc) return;
    const id = requestAnimationFrame(() => inlineInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen, isTabletOrPc]);

  return (
    <>
      {isTabletOrPc && (
        <div className="px-4 pb-8 pt-4">
          {!isOpen ? (
            <button
              type="button"
              onClick={openComposer}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition",
                "hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                "dark:hover:bg-surface-inverse-muted",
              )}
            >
              <PlusCircle className="size-5" />
              <span>{t("task.add")}</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-line-subtle bg-surface-elevated/60 p-3 shadow-sm dark:border-line dark:bg-surface">
              <Input
                ref={inlineInputRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSubmit();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeComposer();
                  }
                }}
                placeholder={t("task.add")}
                className="bg-transparent"
                aria-label={t("task.add")}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={closeComposer}>
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createTask.isPending || inputValue.trim() === ""}
                >
                  {t("common.add")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {isMobile && (
        <>
          <div className="px-4 pb-8 pt-4">
            <button
              type="button"
              onClick={openComposer}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition",
                "hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                "dark:hover:bg-surface-inverse-muted",
              )}
            >
              <PlusCircle className="size-5" />
              <span>{t("task.add")}</span>
            </button>
          </div>

          <TaskCreateOverlay
            isOpen={isOpen}
            inputValue={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onClose={closeComposer}
            isPending={createTask.isPending}
            containerRect={containerRect}
            bottomOffset={bottomOffset}
          />
        </>
      )}
    </>
  );
};

export const TaskComposer = TaskTools;
