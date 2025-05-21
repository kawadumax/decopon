import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import type { Task } from "@/types";
import { type PrimitiveAtom, useAtom } from "jotai";
import type React from "react";
import { useEffect, useState } from "react";

export const TaskEditableDescription = ({
  taskAtom,
}: {
  taskAtom: PrimitiveAtom<Task>;
}) => {
  const api = useApi();
  const [task, setTask] = useAtom(taskAtom);
  const [description, setDescription] = useState(task.description);

  const handleOnBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (description !== task.description) {
      api.put(
        route("api.tasks.update", task.id),
        { description: description },
        (data) => {
          setTask((prev) => ({
            ...prev,
            ...data.task,
          }));
        },
      );
    }
  };

  const handleOnChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  useEffect(() => {
    setDescription(task.description);
  }, [task.description]);

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
