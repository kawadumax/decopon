import { cn } from "@/scripts/lib/utils";
import { useTaskMutations } from "@/scripts/queries";
import type { Task, TaskStoreRequest } from "@/scripts/types";
import { Direction, StackCmdType, useStackView } from "@components/StackView";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { ChevronRight, PlusSquare, Trash } from "@mynaui/icons-react";
import { useTagStore } from "@store/tag";
import { useTaskStore } from "@store/task";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TaskEditableTitle } from "./TaskEditableTitle";

export const TaskItem = ({
  task,
  children,
}: {
  task: Task;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const currentTag = useTagStore((s) => s.currentTag); // 現在のタグを取得
  const { createTask, deleteTask } = useTaskMutations(currentTag?.id);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const childInputRef = useRef<HTMLInputElement>(null);
  const childComposerRef = useRef<HTMLDivElement>(null);

  const setCurrentTaskId = useTaskStore((s) => s.setCurrentTaskId);
  const deviceSize = useDeviceSize();
  const [_state, dispatch] = useStackView();

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    deleteTask.mutate(task.id); // ミューテーションを呼び出して削除
  };

  const handleItemClicked = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCurrentTaskId(task.id);

    if (deviceSize === "mobile") {
      dispatch({
        type: "push",
        payload: {
          type: StackCmdType.Push,
          to: "detail",
          direction: Direction.Left,
        },
      });
    }
  };

  const handleItemKeyDowned = (event: React.KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.stopPropagation();
    setCurrentTaskId(task.id);
  };

  const handleFold = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const openChildComposer = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsExpanded(true);
    setIsAddingChild(true);
  }, []);

  const closeChildComposer = useCallback((event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    setIsAddingChild(false);
    setChildTitle("");
  }, []);

  const submitChild = useCallback(() => {
    const trimmed = childTitle.trim();
    if (trimmed.length === 0 || createTask.isPending) return;

    const payload: TaskStoreRequest = {
      title: trimmed,
      description: "New Task Description",
      parent_task_id: task.id,
      tag_ids: currentTag ? [currentTag.id] : [],
    };

    createTask.mutate(payload, {
      onSuccess: () => {
        setChildTitle("");
        requestAnimationFrame(() => {
          childInputRef.current?.focus();
        });
      },
    });
  }, [childTitle, createTask, currentTag, task.id]);

  useEffect(() => {
    if (!isAddingChild) return;
    const id = requestAnimationFrame(() => {
      childComposerRef.current?.scrollIntoView({ block: "nearest" });
      childInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isAddingChild]);

  const renderIdInLocal = () => {
    if (import.meta.env.VITE_APP_ENV === "local") {
      return (
        <span className="my-1 flex flex-row items-center gap-1">
          <span>Id: {task.id}</span>
          <span>ParentId: {task.parent_task_id || "Undefined"}</span>
        </span>
      );
    }
  };

  return (
    <li
      className={"list-none pl-4 hover:bg-primary/5"}
      onClick={handleItemClicked}
      onKeyDown={handleItemKeyDowned}
    >
      <div className="flex flex-row flex-nowrap justify-between">
        <span className="flex flex-row items-center justify-start">
          {children && (
            <ChevronRight
              onClick={handleFold}
              className={cn(
                "-ml-1 mr-1 transition-transform",
                isExpanded && "rotate-90",
              )}
            />
          )}
          <TaskEditableTitle task={task} />
        </span>
        {
          // task_idをデバッグ時に表示させたいとき使う
          false && renderIdInLocal()
        }
        <span className="my-1 mr-2 flex flex-row gap-1">
          <Button variant={"ghost"} size={"icon"} onClick={openChildComposer}>
            <PlusSquare />
          </Button>
          <Button variant={"ghost"} size={"icon"} onClick={handleDelete}>
            <Trash />
          </Button>
        </span>
      </div>

      {isAddingChild && (
        <div
          ref={childComposerRef}
          className="mr-2 ml-6 my-2 rounded-xl border border-dashed border-line-subtle bg-surface-elevated/60 p-2 shadow-sm dark:border-line dark:bg-surface"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Input
            ref={childInputRef}
            value={childTitle}
            onChange={(event) => setChildTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitChild();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                closeChildComposer(event);
              }
            }}
            placeholder={t("task.add")}
            className="bg-transparent"
            aria-label={t("task.add")}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => closeChildComposer(event)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                submitChild();
              }}
              disabled={createTask.isPending || childTitle.trim() === ""}
            >
              {t("common.add")}
            </Button>
          </div>
        </div>
      )}
      {isExpanded && children}
    </li>
  );
};
