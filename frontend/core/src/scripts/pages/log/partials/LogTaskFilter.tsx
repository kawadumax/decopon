import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useLogFilterStore } from "@store/log";
import { useTranslation } from "react-i18next";
import type { ChangeEvent } from "react";

export const LogTaskFilter = () => {
  const { t } = useTranslation();
  const selectedTaskId = useLogFilterStore((state) => state.selectedTaskId);
  const taskName = useLogFilterStore((state) => state.taskName);
  const setTaskFilter = useLogFilterStore((state) => state.setTaskFilter);
  const clearTaskFilter = useLogFilterStore((state) => state.clearTaskFilter);

  const hasTaskFilter =
    selectedTaskId !== null || (taskName?.trim()?.length ?? 0) > 0;

  const handleTaskIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const nextId = value === "" ? null : Number(value);
    setTaskFilter(Number.isNaN(nextId) ? null : nextId, taskName);
  };

  const handleTaskNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTaskFilter(selectedTaskId, event.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-base">
          {t("log.filter.task.title")}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearTaskFilter}
          disabled={!hasTaskFilter}
        >
          {t("log.filter.task.clear")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder={t("log.filter.task.idPlaceholder")}
          value={selectedTaskId ?? ""}
          onChange={handleTaskIdChange}
        />
        <Input
          placeholder={t("log.filter.task.namePlaceholder")}
          value={taskName}
          onChange={handleTaskNameChange}
        />
      </div>
    </div>
  );
};
