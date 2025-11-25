import { fetchTagsQueryOptions } from "@/scripts/queries";
import { useQuery } from "@tanstack/react-query";
import { useLogFilterStore } from "@store/log";
import { useTranslation } from "react-i18next";

export const LogTagList = () => {
  const { t } = useTranslation();
  const { data: tags = [], isPending } = useQuery(fetchTagsQueryOptions);
  const selectedTagIds = useLogFilterStore((state) => state.selectedTagIds);
  const toggleTag = useLogFilterStore((state) => state.toggleTag);
  const clearTags = useLogFilterStore((state) => state.clearTags);
  const hasSelection = selectedTagIds.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="font-bold text-base">{t("tag.latestTags")}</h3>
        {hasSelection ? (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={clearTags}
          >
            {t("log.filter.clear")}
          </button>
        ) : null}
      </div>
      {hasSelection ? (
        <p className="px-3 text-xs text-muted-foreground">
          {t("log.filter.selected", { count: selectedTagIds.length })}
        </p>
      ) : null}
      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        ) : tags.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            {t("tag.noTags")}
          </p>
        ) : (
          <ul className="flex flex-col">
            {tags.map((tag) => {
              const isActive = selectedTagIds.includes(tag.id);
              return (
                <li key={tag.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-surface-elevated hover:text-fg dark:hover:bg-surface-elevated dark:hover:text-fg"
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full border ${
                        isActive
                        ? "border-primary bg-primary"
                        : "border-line-subtle"
                      }`}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
