import Index from "@/pages/task/Index";
import type { Task, User } from "@/types";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { t } from "i18next";

// ダミーの非同期関数（実際はAPI呼び出しなどに置き換えます）
const fetchTasks = async () => {
  // 例: await fetch('/api/tasks').then(res => res.json());
  const props = {
    auth: {
      user: {
        id: 1,
        name: "User",
      } as User,
    },
    tasks: [
      {
        id: 1,
        user_id: 1,
        completed: false,
        description: "This is task 1",
        tags: [],
        title: "Task 1",
      },
    ] as Task[],
  };
  return props;
};

export const Route = createFileRoute("/auth/tasks")({
  loader: async () => {
    const { auth, tasks } = await fetchTasks();
    return {
      auth,
      tasks,
    };
  },
  component: () => {
    const { auth, tasks } = useLoaderData({ from: "/auth/tasks" });
    return <Index auth={auth} tasks={tasks} />;
  },
  context: () => ({ title: t("task.title") }),
});
