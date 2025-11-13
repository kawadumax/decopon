import DangerButton from "@components/DangerButton";
import SecondaryButton from "@components/SecondaryButton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { getTauriInvoke } from "@/scripts/api/client/transports/ipc/shared";
import { isSingleUserModeEnabled } from "@/scripts/lib/singleUserBootstrap";
import { cn } from "@/scripts/lib/utils";

type InitStatus = {
  initialized: boolean;
  appVersion?: string;
  dataDir?: string;
};

type Props = {
  className?: string;
};

export default function TauriDangerZone({ className = "" }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isBrowser = typeof window !== "undefined";
  const invoke = isBrowser ? getTauriInvoke() : null;
  const queryKey = ["tauri-init-status"] as const;
  const isSupported = isBrowser && isSingleUserModeEnabled() && Boolean(invoke);

  const statusQuery = useQuery<InitStatus, Error>({
    queryKey,
    enabled: isSupported,
    staleTime: 10_000,
    queryFn: async () => {
      if (!invoke) {
        throw new Error("Tauri invoke is unavailable");
      }
      return await invoke<InitStatus>("get_init_status");
    },
  });

  const resetMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!invoke) {
        throw new Error("Tauri invoke is unavailable");
      }
      await invoke("reset_application_data");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(t("preference.dangerZone.toast.resetSuccess"));
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : t("preference.dangerZone.status.unknown");
      toast.error(
        t("preference.dangerZone.toast.resetError", {
          message,
        }),
      );
    },
  });

  if (!isSupported) {
    return null;
  }

  const handleRefresh = () => {
    void statusQuery.refetch();
  };

  const handleReset = async () => {
    const confirmed = window.confirm(t("preference.dangerZone.confirm"));
    if (!confirmed) {
      return;
    }
    await resetMutation.mutateAsync();
  };

  const renderStatus = () => {
    if (statusQuery.isLoading) {
      return (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t("preference.dangerZone.loading")}
        </p>
      );
    }

    if (statusQuery.error) {
      return (
        <p className="text-sm text-red-700 dark:text-red-400">
          {t("preference.dangerZone.errors.status", {
            message: statusQuery.error.message,
          })}
        </p>
      );
    }

    if (!statusQuery.data) {
      return null;
    }

    const initializedLabel = statusQuery.data.initialized
      ? t("preference.dangerZone.status.initialized")
      : t("preference.dangerZone.status.notInitialized");
    const dataDir =
      statusQuery.data.dataDir ?? t("preference.dangerZone.status.unknown");
    const appVersion =
      statusQuery.data.appVersion ?? t("preference.dangerZone.status.unknown");

    return (
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-gray-900 dark:text-gray-100">
            {t("preference.dangerZone.status.label")}
          </dt>
          <dd className="text-gray-700 dark:text-gray-300">{initializedLabel}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900 dark:text-gray-100">
            {t("preference.dangerZone.status.dataDir")}
          </dt>
          <dd className="break-all font-mono text-xs text-gray-700 dark:text-gray-300">
            {dataDir}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900 dark:text-gray-100">
            {t("preference.dangerZone.status.appVersion")}
          </dt>
          <dd className="text-gray-700 dark:text-gray-300">{appVersion}</dd>
        </div>
      </dl>
    );
  };

  return (
    <section className={cn("space-y-4", className)}>
      <header>
        <h2 className="font-semibold text-red-700 text-lg dark:text-red-300">
          {t("preference.dangerZone.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          {t("preference.dangerZone.description")}
        </p>
      </header>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
        {renderStatus()}

        <div className="mt-4 flex flex-wrap gap-3">
          <SecondaryButton
            onClick={handleRefresh}
            disabled={statusQuery.isFetching || statusQuery.isLoading}
          >
            {t("preference.dangerZone.actions.refresh")}
          </SecondaryButton>

          <DangerButton
            onClick={handleReset}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending
              ? t("preference.dangerZone.actions.resetting")
              : t("preference.dangerZone.actions.reset")}
          </DangerButton>
        </div>
      </div>

      <p className="text-xs text-red-700 dark:text-red-400">
        {t("preference.dangerZone.note")}
      </p>
    </section>
  );
}
