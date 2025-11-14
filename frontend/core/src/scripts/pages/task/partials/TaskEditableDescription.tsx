import { Textarea } from "@components/ui/textarea";
import { useCurrentTask } from "@store/task";
import type React from "react";
import { useEffect, useState } from "react";
import { useTaskMutations } from "@/scripts/queries";

export const TaskEditableDescription = () => {
  const task = useCurrentTask();
  const [description, setDescription] = useState(task?.description ?? "");
  const { updateTask } = useTaskMutations();
  const updateTaskMutate = updateTask.mutate;
  useEffect(() => {
    if (task) {
      setDescription(task.description);
    }
  }, [task]);

  if (!task) {
    return null;
  }

  const handleOnBlur = (_event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (description !== task.description) {
      updateTaskMutate({
        id: task.id,
        data: { description },
      });
    }
  };

  const handleOnChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  return (
    <div>
      <Textarea
        value={description}
        onChange={handleOnChange}
        onBlur={handleOnBlur}
      />
    </div>
  );
};
