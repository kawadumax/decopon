import { useTranslation } from "react-i18next";
import { TaskEditableDescription } from "./TaskEditableDescription";
import { TaskEditableTagList } from "./TaskEditableTagList";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { TaskLogger } from "./TaskLogger";
import { useTaskStore } from "@store/task";
export const TaskSideView = () => {
  const currentTask = useTaskStore((s) => s.currentTask);
  const { t } = useTranslation();
  const renderTaskContent = () => {
    if (!currentTask) {
      return t("task.noCurrent");
    }
    return (
      <>
        <TaskEditableTitle task={currentTask} variant="lg" />
        <TaskEditableTagList />
        <TaskEditableDescription />
        <TaskLogger />
      </>
    );
  };

  return <div className="flex h-full flex-col p-4">{renderTaskContent()}</div>;
};
