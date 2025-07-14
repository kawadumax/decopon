import { currentTaskAtom } from "@/scripts/lib/atoms";
import type { Task } from "@/scripts/types";
import { useAtomValue } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { TaskEditableDescription } from "./TaskEditableDescription";
import { TaskEditableTagList } from "./TaskEditableTagList";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { TaskLogger } from "./TaskLogger";
export const TaskSideView = () => {
  // const currentTaskAtom = useAtomValue(taskSelectorAtom);
  const currentTask = useAtomValue(currentTaskAtom);
  const { t } = useTranslation();
  const renderTaskContent = () => {
    if (!currentTask) {
      return t("task.noCurrent");
    }
    return (
      <>
        <TaskEditableTitle task={currentTask} variant="lg" />
        <TaskEditableTagList
          taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
        />
        <TaskEditableDescription
          taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
        />
        <TaskLogger taskAtom={currentTaskAtom as PrimitiveAtom<Task>} />
      </>
    );
  };

  return <div className="flex h-full flex-col p-4">{renderTaskContent()}</div>;
};
