import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TagTableRow } from "@/scripts/pages/tag/partials/TagTableRow";
import type { TagWithCheck, Task } from "@/scripts/types";
import { Checkbox } from "@components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { useTranslation } from "react-i18next";
import { useTagStore } from "@store/tag";
import { TaskService } from "@/scripts/api/services/TaskService";

export const TagTable = () => {
  const { t } = useTranslation();
  const [checkableTags, addTagChecks] = [
    useTagStore((s) => s.getCheckableTags()),
    useTagStore((s) => s.addTagChecks),
  ];
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => TaskService.index(),
  });
  const tagTaskCountMap = useMemo(() => {
    const counts = new Map<number, number>();
    for (const task of tasks) {
      for (const tag of task.tags ?? []) {
        counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
      }
    }
    return counts;
  }, [tasks]);
  const handleHeadChecked = useCallback(
    (checked: boolean) => {
      addTagChecks(
        checkableTags.map((tag) => ({ id: tag.id, checked } as TagWithCheck)),
      );
    },
    [checkableTags, addTagChecks],
  );

  const handleBodyChecked = useCallback(
    (checkedTag: TagWithCheck) => {
      addTagChecks([checkedTag]);
    },
    [addTagChecks],
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {
              <Checkbox
                onCheckedChange={(checked) =>
                  handleHeadChecked(checked as boolean)
                }
              />
            }
          </TableHead>
          <TableHead>{t("tag.table.header.name")}</TableHead>
          <TableHead>{t("tag.table.header.taskCount")}</TableHead>
          <TableHead>{t("tag.table.header.createdAt")}</TableHead>
          <TableHead>{t("tag.table.header.updatedAt")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checkableTags.map((tag) => {
          return (
            <TagTableRow
              key={tag.id}
              tag={tag}
              taskCount={tagTaskCountMap.get(tag.id) ?? 0}
              onCheckedChange={(checked) => {
                handleBodyChecked({
                  id: tag.id,
                  checked,
                } as TagWithCheck);
              }}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};
