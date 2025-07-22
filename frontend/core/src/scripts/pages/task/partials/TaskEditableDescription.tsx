import { callApi } from "@/scripts/queries/apiClient";
import type { Task } from "@/scripts/types";
import { Textarea } from "@components/ui/textarea";
import { type PrimitiveAtom, useAtom } from "jotai";
import type React from "react";
import { useEffect, useState } from "react";
import { route } from "ziggy-js";

export const TaskEditableDescription = ({
  taskAtom,
}: {
  taskAtom: PrimitiveAtom<Task>;
}) => {
  const [task, setTask] = useAtom(taskAtom);
  const [description, setDescription] = useState(task.description);

  const handleOnBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (description !== task.description) {
      callApi("put", route("api.tasks.update", task.id), {
        description: description,
      }).then((data) => {
        setTask((prev) => ({
          ...prev,
          ...data.task,
        }));
      });
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
