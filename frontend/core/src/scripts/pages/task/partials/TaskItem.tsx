import { callApi } from "@/scripts/lib/apiClient";
import type { Task } from "@/scripts/types";
import { Direction, StackCmdType, useStackView } from "@components/StackView";
import { Button } from "@components/ui/button";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { currentTagAtom, currentTaskAtom } from "@lib/atoms";
import { ChevronRight, PlusSquare, Trash } from "@mynaui/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import type React from "react";
import { useState } from "react";
import { route } from "ziggy-js";
import { TaskEditableTitle } from "./TaskEditableTitle";

type ReqAddChildTask = Omit<Partial<Task>, "tags"> & { tags?: number[] };

export const TaskItem = ({
  task,
  children,
}: {
  task: Task;
  children?: React.ReactNode;
}) => {
  const queryClient = useQueryClient(); // キャッシュアクセス用
  const currentTag = useAtomValue(currentTagAtom); // 現在のタスクを取得

  const queryKey = currentTag ? ["tasks", currentTag.id] : ["tasks"]; // クエリキーを定義

  const deleteTask = useMutation({
    mutationFn: (id: number) =>
      callApi("delete", route("api.tasks.destroy", id)), // サーバーAPI呼び出し
    onMutate: async (id: number) => {
      // 1. Optimistic update: キャッシュから該当taskを削除
      await queryClient.cancelQueries({ queryKey }); // 同時リフェッチをキャンセル
      const previousTasks: Task[] | undefined = queryClient.getQueryData([
        "tasks",
      ]); // 現在のキャッシュ取得
      queryClient.setQueryData(queryKey, (old: Task[]) =>
        old.filter((t) => t.id !== id),
      ); // 一時更新
      return { previousTasks }; // ロールバック用に保存
    },
    onError: (_err, _id, context) => {
      // 失敗時ロールバック
      queryClient.setQueryData(queryKey, context?.previousTasks);
    },
    onSettled: () => {
      // 3. 成功/失敗後にリフェッチ
      queryClient.invalidateQueries({ queryKey });
      setCurrentTask(undefined); // 現在のタスクをクリア
    },
  });

  const addChildTask = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const newTaskWithTag: ReqAddChildTask = {
        ...newTask,
        tags: currentTag ? [currentTag.id] : [], // 現在のタグを設定
      };
      return await callApi("post", route("api.tasks.store"), newTaskWithTag);
    },
    onMutate: async (newTask) => {
      console.log("Adding child task:", newTask);
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: Task[]) => [
        ...old,
        { ...newTask, id: -1 },
      ]); // 仮IDで追加
      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // 失敗時ロールバック
      queryClient.setQueryData(queryKey, context?.previousTasks);
    },
    onSuccess: (result) =>
      // 成功時、サーバーから返されたデータをキャッシュに置き換え（仮IDを本物に）
      queryClient.setQueryData(queryKey, (old: Task[]) =>
        old.map((task) => (task.id === -1 ? result.task : task)),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const [isExpanded, setIsExpanded] = useState(true);

  const setCurrentTask = useSetAtom(currentTaskAtom);
  const deviceSize = useDeviceSize();
  const [_state, dispatch] = useStackView();

  const handleDelete = () => {
    deleteTask.mutate(task.id); // ミューテーションを呼び出して削除
  };

  const handleItemClicked = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCurrentTask(task);

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
    setCurrentTask(task);
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
      tags: currentTag ? [currentTag] : [],
    };
    console.log("Adding child task:", taskTemplate, task.id);
    addChildTask.mutate(taskTemplate); // ミューテーションを呼び出して子タスクを追加
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
