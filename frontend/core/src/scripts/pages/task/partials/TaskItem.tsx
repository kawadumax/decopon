import type { Task, TaskStoreRequest } from "@/scripts/types";
import { Direction, StackCmdType, useStackView } from "@components/StackView";
import { Button } from "@components/ui/button";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { ChevronRight, PlusSquare, Trash } from "@mynaui/icons-react";
import { useTagStore } from "@store/tag";
import { useTaskStore } from "@store/task";
import type React from "react";
import { useState } from "react";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { cn } from "@/scripts/lib/utils";
import { useTaskMutations } from "@/scripts/queries";

export const TaskItem = ({
  task,
  children,
}: {
  task: Task;
  children?: React.ReactNode;
}) => {
  const currentTag = useTagStore((s) => s.currentTag); // 現在のタグを取得
  const { createTask, deleteTask } = useTaskMutations(currentTag?.id);

  const [isExpanded, setIsExpanded] = useState(true);

  const setCurrentTaskId = useTaskStore((s) => s.setCurrentTaskId);
  const deviceSize = useDeviceSize();
  const [_state, dispatch] = useStackView();

  const handleDelete = () => {
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

  const handleAddChild = (_event: React.MouseEvent) => {
    const taskTemplate: TaskStoreRequest = {
      title: "New Task",
      description: "New Task Description",
      parent_task_id: task.id,
      tag_ids: currentTag ? [currentTag.id] : [],
    };
    console.log("Adding child task:", taskTemplate, task.id);
    createTask.mutate(taskTemplate); // ミューテーションを呼び出して子タスクを追加
  };

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
          <Button variant={"ghost"} size={"icon"} onClick={handleAddChild}>
            <PlusSquare />
          </Button>
          <Button variant={"ghost"} size={"icon"} onClick={handleDelete}>
            <Trash />
          </Button>
        </span>
      </div>
      {isExpanded && children}
    </li>
  );
};
