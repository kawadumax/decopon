import type { Task } from "@/scripts/types";
import { Checkbox } from "@components/ui/checkbox";
import { Input } from "@components/ui/input";
import { Toggle } from "@components/ui/toggle";
import { Edit } from "@mynaui/icons-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTaskMutations } from "@/scripts/queries";

export const TaskEditableTitle = ({
  task,
  variant = "default",
  }: {
    task: Task;
    variant?: "default" | "lg";
  }) => {
  const [title, setTitle] = useState(task.title);
  const [editable, setEditable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateTask, toggleComplete } = useTaskMutations();
  const updateTaskMutate = updateTask.mutate;
  const toggleCompleteMutate = toggleComplete.mutate;
  const isTogglePending = toggleComplete.isPending;

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleCompleteEdit = useCallback(() => {
    setEditable(false);
    if (title !== task.title) {
      updateTaskMutate({ id: task.id, data: { title } });
    }
  }, [title, task.id, task.title, updateTaskMutate]);

  const handleEditToggle = useCallback(() => {
    if (editable) {
      handleCompleteEdit();
    } else {
      setEditable(true);
    }
  }, [editable, handleCompleteEdit]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleCompleteEdit();
      }
    },
    [handleCompleteEdit],
  );

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      toggleCompleteMutate({ id: task.id, completed: checked });
    },
    [task.id, toggleCompleteMutate],
  );

  useEffect(() => {
    if (editable) {
      inputRef.current?.focus();
    }
  }, [editable]);

  const titleElement = useMemo(() => {
    if (variant === "lg") {
      return <h2 className="font-bold text-lg">{title}</h2>;
    }
    return <span className="break-keep">{title}</span>;
  }, [variant, title]);

  return (
    <span className="my-1 flex flex-row items-center gap-2">
      <Checkbox
        onCheckedChange={handleCheckboxChange}
        checked={task.completed}
        disabled={isTogglePending}
      />
      {editable ? (
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCompleteEdit}
        />
      ) : (
        titleElement
      )}
      <Toggle
        variant={"default"}
        size={"sm"}
        onClick={handleEditToggle}
        data-state={editable ? "on" : "off"}
      >
        <Edit />
      </Toggle>
    </span>
  );
};
