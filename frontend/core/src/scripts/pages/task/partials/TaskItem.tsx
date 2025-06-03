import type { Task } from "@/scripts/types";
import { Direction, StackCmdType, useStackView } from "@components/StackView";
import { Button } from "@components/ui/button";
import { useApi } from "@hooks/useApi";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { taskSelectorAtom } from "@lib/atoms";
import { ChevronRight, PlusSquare, Trash } from "@mynaui/icons-react";
import { type PrimitiveAtom, atom, useAtomValue, useSetAtom } from "jotai";
import type React from "react";
import { useState } from "react";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { route } from "ziggy-js";

export const TaskItem = ({
  taskAtom,
  remove,
  insert,
  children,
}: {
  taskAtom: PrimitiveAtom<Task>;
  remove: () => void;
  insert: (newTask: Task) => void;
  children?: React.ReactNode;
}) => {
  const api = useApi();
  const task = useAtomValue(taskAtom);
  const [isExpanded, setIsExpanded] = useState(true);
  const setCurrentTaskAtom = useSetAtom(taskSelectorAtom);
  const deviceSize = useDeviceSize();
  const [_state, dispatch] = useStackView();

  const handleDelete = () => {
    api.delete(route("api.tasks.destroy", task.id), undefined, (_res) => {
      remove();
      setCurrentTaskAtom(atom(undefined));
    });
  };

  const handleItemClicked = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCurrentTaskAtom(taskAtom);

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
    setCurrentTaskAtom(taskAtom);
  };

  const handleFold = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleAddChild = (_event: React.MouseEvent) => {
    const taskTemplate = {
      title: "New Task",
      description: "New Task Description",
      completed: false,
      parent_task_id: task.id,
    };

    api.post(route("api.tasks.store"), taskTemplate, (data) => {
      insert(data.task);
    });
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
              className={`-ml-1 mr-1 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          )}
          <TaskEditableTitle taskAtom={taskAtom} />
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
