"use client";

import { startIikoSyncProgressToast } from "@/core/modules/integration";
import { invalidateIikoIntegrationQueries } from "@/core/modules/product/actions/model/invalidate-iiko-integration-queries";
import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import { useIntegrationControllerSyncIikoProduct } from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface SyncIikoProductActionProps {
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
  productId: string;
}

export const SyncIikoProductAction: React.FC<SyncIikoProductActionProps> = ({
  disabled = false,
  onPendingChange,
  productId,
}) => {
  const queryClient = useQueryClient();
  const features = useCatalogCapabilities();
  const syncProductMutation = useIntegrationControllerSyncIikoProduct();

  React.useEffect(() => {
    onPendingChange?.(syncProductMutation.isPending);

    return () => {
      onPendingChange?.(false);
    };
  }, [onPendingChange, syncProductMutation.isPending]);

  const refreshProductAndIntegration = React.useCallback(async () => {
    await Promise.allSettled([
      invalidateProductQueries(queryClient),
      invalidateIikoIntegrationQueries(queryClient),
    ]);
  }, [queryClient]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      void confirm({
        title: "Синхронизировать блюдо с iiko?",
        description:
          "Данные этого товара будут обновлены из выбранного external menu iiko. Остальные товары каталога не затрагиваются.",
        confirmText: "Запустить sync",
        pendingText: "Ставим sync в очередь...",
        onConfirm: async () => {
          const queued = await syncProductMutation.mutateAsync({ id: productId });
          await refreshProductAndIntegration();
          startIikoSyncProgressToast({
            runId: queued.runId,
            title: "Синхронизация блюда iiko",
            onSettled: refreshProductAndIntegration,
          });
        },
        onError: (error) => {
          toast.error(extractApiErrorMessage(error));
        },
      });
    },
    [productId, refreshProductAndIntegration, syncProductMutation],
  );

  if (!features.canUseIikoIntegration) {
    return null;
  }

  return (
    <Button
      type="button"
      size="icon"
      disabled={disabled || syncProductMutation.isPending}
      onClick={handleClick}
      className="shadow-custom h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
      aria-label="Синхронизировать блюдо с iiko"
    >
      <RefreshCcw
        className={
          syncProductMutation.isPending
            ? "text-muted-foreground size-4 animate-spin"
            : "text-muted-foreground size-4"
        }
      />
    </Button>
  );
};
