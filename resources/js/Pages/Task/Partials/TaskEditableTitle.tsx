import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Toggle } from "@/Components/ui/toggle";
import { useApi } from "@/Hooks/useApi";
import { tasksBatchAtom } from "@/Lib/atoms";
import type { Task } from "@/types";
import { Edit } from "@mynaui/icons-react";
import { type PrimitiveAtom, useAtom, useSetAtom } from "jotai";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const TaskEditableTitle = ({
	taskAtom,
	variant = "default",
}: {
	taskAtom: PrimitiveAtom<Task>;
	variant?: "default" | "lg";
}) => {
	const api = useApi();
	const [task, setTask] = useAtom(taskAtom);
	const batchTasks = useSetAtom(tasksBatchAtom);
	const [editable, setEditable] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const [inputChanged, setInputChanged] = useState<boolean>(false);

	const handleEditToggle = useCallback(() => {
		setEditable((prev) => !prev);
	}, []);

	const handleInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setInputChanged(true);
			setTask((prev) => ({ ...prev, title: event.target.value }));
		},
		[setTask],
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
				(response) => {
					batchTasks(response.data.tasks);
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
			api.put(
				route("api.tasks.update", task.id),
				{ title: task.title },
				(response) => {
					setTask((prev) => ({ ...prev, title: response.data.task.title }));
				},
				undefined,
				() => {
					setInputChanged(false);
				},
			);
		}
	}, [editable, api, setTask, task, inputChanged]);

	const titleElement = useMemo(() => {
		if (variant === "lg") {
			return <h2 className="text-lg font-bold">{task.title}</h2>;
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
