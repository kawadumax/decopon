import { cn } from "@/scripts/lib/utils";
import { useTaskMutations } from "@/scripts/queries";
import type { CreateTaskVariables } from "@/scripts/queries";
import { useTagStore } from "@/scripts/store/tag";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { useKeyboardState } from "@hooks/useKeyboardInset";
import { PlusCircle, X } from "@mynaui/icons-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

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
  isImeOpen,
  inputValue,
  onChange,
  onSubmit,
  onClose,
  isPending,
  bottomOffset,
}: {
  isOpen: boolean;
  isImeOpen: boolean;
  inputValue: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isPending: boolean;
  bottomOffset: number;
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const safeBottomOffset = Math.max(0, Math.floor(bottomOffset));
  const safeAreaVar =
    "var(--decopon-safe-area-bottom, env(safe-area-inset-bottom))";
  const bottomStyle = isImeOpen
    ? `${safeBottomOffset}px`
    : safeBottomOffset === 0
      ? safeAreaVar
      : `${safeBottomOffset}px`;
  const portalTarget =
    typeof document === "undefined" ? null : document.body;

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

  if (!portalTarget) return null;

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      style={{ bottom: bottomStyle }}
    >
      <div className="pointer-events-auto w-full">
        <div className="flex items-center gap-2 rounded-t-2xl rounded-b-none border border-line bg-surface-elevated px-3 py-2 shadow-lg dark:border-line-subtle dark:bg-surface">
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
    </div>,
    portalTarget,
  );
};

export const TaskTools = () => {
  const { t } = useTranslation();
  const deviceSize = useDeviceSize();
  const currentTag = useTagStore((s) => s.currentTag);
  const { createTask } = useTaskMutations(currentTag?.id);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const keyboardState = useKeyboardState();
  const [visualViewportGap, setVisualViewportGap] = useState(0);
  const taskOverlayLogRafRef = useRef(0);
  const taskOverlayLogPendingRef = useRef<Record<string, unknown> | null>(null);
  const isMobile = deviceSize === "mobile";
  const isTabletOrPc = deviceSize === "tablet" || deviceSize === "pc";
  const keyboardInset = isMobile && keyboardState.isOpen
    ? keyboardState.inset
    : 0;
  const rawInset = isMobile && keyboardState.isOpen
    ? keyboardState.rawInset
    : 0;
  const layoutLoss = keyboardState.layoutLoss;
  const THRESHOLD_PX = 32;
  const effectiveKeyboardInset =
    rawInset > 0 && layoutLoss < THRESHOLD_PX ? rawInset : keyboardInset;

  const openComposer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setIsOpen(false);
    setInputValue("");
  }, []);

  useKeyboardShortcut(openComposer);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    const updateGap = () => {
      const visualHeight = viewport ? viewport.height : window.innerHeight;
      const gap = Math.max(0, window.innerHeight - visualHeight);
      setVisualViewportGap((previous) => (previous === gap ? previous : gap));
    };
    updateGap();
    window.addEventListener("resize", updateGap);
    viewport?.addEventListener("resize", updateGap);
    viewport?.addEventListener("scroll", updateGap);
    return () => {
      window.removeEventListener("resize", updateGap);
      viewport?.removeEventListener("resize", updateGap);
      viewport?.removeEventListener("scroll", updateGap);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (taskOverlayLogRafRef.current) {
        cancelAnimationFrame(taskOverlayLogRafRef.current);
        taskOverlayLogRafRef.current = 0;
      }
      taskOverlayLogPendingRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const shouldLog = (() => {
      if (window.__decoponImeDebug === true) return true;
      try {
        return window.localStorage.getItem("decopon:ime-debug") === "1";
      } catch {
        return false;
      }
    })();
    if (!shouldLog) return;
    const viewport = window.visualViewport;
    taskOverlayLogPendingRef.current = {
      keyboardInset,
      rawInset,
      effectiveKeyboardInset,
      layoutLoss,
      visualLoss: keyboardState.visualLoss,
      visualViewportGap,
      visualViewportHeight: viewport?.height ?? null,
      visualViewportOffsetTop: viewport?.offsetTop ?? null,
      innerHeight: window.innerHeight,
      isImeOpen: keyboardState.isOpen,
    };
    if (taskOverlayLogRafRef.current) return;
    taskOverlayLogRafRef.current = window.requestAnimationFrame(() => {
      if (taskOverlayLogPendingRef.current) {
        console.info("[ime-debug] task-overlay", taskOverlayLogPendingRef.current);
      }
      taskOverlayLogPendingRef.current = null;
      taskOverlayLogRafRef.current = 0;
    });
  }, [
    effectiveKeyboardInset,
    isOpen,
    keyboardInset,
    keyboardState.isOpen,
    visualViewportGap,
  ]);

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
        <div className="px-4 pt-4 pb-8">
          {!isOpen ? (
            <button
              type="button"
              onClick={openComposer}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-fg-muted text-sm transition",
                "hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                "dark:hover:bg-surface-inverse-muted",
              )}
            >
              <PlusCircle className="size-5" />
              <span>{t("task.add")}</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-line-subtle border-dashed bg-surface-elevated/60 p-3 shadow-sm dark:border-line dark:bg-surface">
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
          <div className="px-4 pt-4 pb-8">
            <button
              type="button"
              onClick={openComposer}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-fg-muted text-sm transition",
                "hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                "dark:hover:bg-surface-inverse-muted",
              )}
            >
              <PlusCircle className="size-5" />
              <span>{t("task.add")}</span>
            </button>
          </div>

          <TaskCreateOverlay
            isOpen={isOpen}
            isImeOpen={keyboardState.isOpen}
            inputValue={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onClose={closeComposer}
            isPending={createTask.isPending}
            bottomOffset={effectiveKeyboardInset}
          />
        </>
      )}
    </>
  );
};

export const TaskComposer = TaskTools;
