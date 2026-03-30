"use client";

import { invalidateMoySkladIntegrationQueries } from "@/core/modules/product/actions/model/invalidate-moysklad-integration-queries";
import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import { useIntegrationControllerSyncMoySkladProduct } from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface SyncMoySkladProductActionProps {
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
  productId: string;
}

export const SyncMoySkladProductAction: React.FC<
  SyncMoySkladProductActionProps
> = ({ disabled = false, onPendingChange, productId }) => {
  const queryClient = useQueryClient();
  const syncProductMutation = useIntegrationControllerSyncMoySkladProduct();

  React.useEffect(() => {
    onPendingChange?.(syncProductMutation.isPending);

    return () => {
      onPendingChange?.(false);
    };
  }, [onPendingChange, syncProductMutation.isPending]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      void confirm({
        title: "Синхронизировать товар с MoySklad?",
        description:
          "Текущие данные товара будут обновлены из MoySklad. Актуальные изображения и значения из интеграции перезапишут локальные данные.",
        confirmText: "Запустить sync",
        pendingText: "Ставим sync в очередь...",
        onConfirm: async () => {
          await syncProductMutation.mutateAsync({ id: productId });
          await Promise.allSettled([
            invalidateProductQueries(queryClient),
            invalidateMoySkladIntegrationQueries(queryClient),
          ]);
          toast.success("Sync товара с MoySklad поставлен в очередь.");
        },
        onError: (error) => {
          toast.error(extractApiErrorMessage(error));
        },
      });
    },
    [productId, queryClient, syncProductMutation],
  );

  return (
    <Button
      type="button"
      size="icon"
      disabled={disabled || syncProductMutation.isPending}
      onClick={handleClick}
      className="shadow-custom h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
      aria-label="Синхронизировать товар с MoySklad"
    >
      <RefreshCcw
        className={syncProductMutation.isPending ? "text-muted-foreground size-4 animate-spin" : "text-muted-foreground size-4"}
      />
    </Button>
  );
};
