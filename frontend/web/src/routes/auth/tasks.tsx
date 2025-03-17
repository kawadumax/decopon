import Index from "@/pages/task/Index";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

// ダミーの非同期関数（実際はAPI呼び出しなどに置き換えます）
const fetchTasks = async () => {
	// 例: await fetch('/api/tasks').then(res => res.json());
	const props = {
		auth: {
			user: {
				id: 1,
				name: "User",
			},
		},
		tasks: [
			{ id: 1, name: "Task 1" },
			{ id: 2, name: "Task 2" },
		],
	};
	return props;
};

export const Route = createFileRoute("/auth/tasks")({
	loader: async () => {
		const tasks = await fetchTasks();
		return {
			tasks,
		};
	},
	component: ({ loaderData }) => <Index {...loaderData} />,
	context: () => ({ title: t("task.title") }),
});
