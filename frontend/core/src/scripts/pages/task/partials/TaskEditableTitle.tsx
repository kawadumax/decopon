import { callApi } from "@/scripts/lib/apiClient";
import type { Task } from "@/scripts/types";
import { Checkbox } from "@components/ui/checkbox";
import { Input } from "@components/ui/input";
import { Toggle } from "@components/ui/toggle";
import { useApi } from "@hooks/useApi";
import { tasksBatchAtom } from "@lib/atoms";
import { Edit } from "@mynaui/icons-react";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { route } from "ziggy-js";

const updateTaskTitleCache = (
  queryClient: QueryClient,
  id: number,
  title: string,
) => {
  queryClient.setQueryData(["tasks"], (old: Task[]) => {
    return old.map((oldTask) =>
      oldTask.id === id ? { ...oldTask, title } : oldTask,
    );
  });
};

export const TaskEditableTitle = ({
  task,
  variant = "default",
}: {
  task: Task;
  variant?: "default" | "lg";
}) => {
  const api = useApi();
  // const [task, setTask] = useAtom(taskAtom);
  const queryClient = useQueryClient();
  const batchTasks = useSetAtom(tasksBatchAtom);
  const [editable, setEditable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputChanged, setInputChanged] = useState<boolean>(false);

  const updateTaskTitle = useMutation({
    mutationFn: (newTitle: string) =>
      callApi("put", route("api.tasks.update", task.id), { title: newTitle }),
    onSuccess: (data) => {
      setInputChanged(false);
      // タスクのタイトルを更新
      updateTaskTitleCache(queryClient, task.id, data.task.title);
    },
    onError: () => {
      // エラー処理
      console.error("Failed to update task title");
    },
  });

  const handleEditToggle = useCallback(() => {
    setEditable((prev) => !prev);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputChanged(true);
      updateTaskTitleCache(queryClient, task.id, event.target.value);
    },
    [queryClient, task.id],
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      // 入力状態を終了する。
      setEditable(false);
    }
  }, []);

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      api.put(
        route("api.tasks.update.complete", task.id),
        { completed: checked },
        (data) => {
          batchTasks(data.tasks);
        },
      );
    },
    [api, batchTasks, task.id],
  );

  useEffect(() => {
    if (editable) {
      inputRef.current?.focus();
    }

    if (inputChanged && !editable) {
      // フィールドが変化している時
      // editableがfalseになったときにupdateを呼び出す
      // api.put(
      //   route("api.tasks.update", task.id),
      //   { title: task.title },
      //   (data) => {
      //     setTask((prev) => ({ ...prev, title: data.task.title }));
      //   },
      //   undefined,
      //   () => {
      //     setInputChanged(false);
      //   },
      // );
      updateTaskTitle.mutate(task.title);
    }
  }, [editable, task, inputChanged, updateTaskTitle.mutate]);

  const titleElement = useMemo(() => {
    if (variant === "lg") {
      return <h2 className="font-bold text-lg">{task.title}</h2>;
    }
    return <span className="break-keep">{task.title}</span>;
  }, [variant, task.title]);

  return (
    <span className="my-1 flex flex-row items-center gap-2">
      <Checkbox
        onCheckedChange={handleCheckboxChange}
        checked={task.completed}
      />
      {editable ? (
        <Input
          ref={inputRef}
          defaultValue={task.title}
          onInput={handleInputChange}
          onKeyDown={handleKeyDown}
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
