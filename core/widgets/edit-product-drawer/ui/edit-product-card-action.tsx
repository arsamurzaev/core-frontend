"use client";

import {
  ChangeProductCategoryPositionAction,
  SyncMoySkladProductAction,
} from "@/core/modules/product/actions/ui";
import { useEditProductDrawerHost } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-host";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import {
  ProductWithAttributesDtoStatus,
  useProductControllerDuplicate,
  useProductControllerToggleStatus,
} from "@/shared/api/generated/react-query";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Pencil } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface EditProductCardActionProps {
  categoryId?: string;
  categoryPosition?: number;
  isMoySkladLinked?: boolean;
  productId: string;
  status: ProductWithAttributesDtoStatus;
}

export const EditProductCardAction: React.FC<EditProductCardActionProps> = ({
  categoryId,
  categoryPosition,
  isMoySkladLinked = false,
  productId,
  status,
}) => {
  const { isAuthenticated } = useSession();
  const { openDrawer } = useEditProductDrawerHost();
  const queryClient = useQueryClient();
  const duplicateProduct = useProductControllerDuplicate();
  const toggleProductStatus = useProductControllerToggleStatus();
  const [isUpdatingCategoryPosition, setIsUpdatingCategoryPosition] =
    React.useState(false);
  const [isSyncingMoySklad, setIsSyncingMoySklad] = React.useState(false);
  const isStatusActive = status === ProductWithAttributesDtoStatus.ACTIVE;
  const isStatusHidden = status === ProductWithAttributesDtoStatus.HIDDEN;
  const canToggleStatus = isStatusActive || isStatusHidden;
  const isActionPending =
    duplicateProduct.isPending ||
    toggleProductStatus.isPending ||
    isUpdatingCategoryPosition ||
    isSyncingMoySklad;

  const handleTriggerClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      openDrawer(productId);
    },
    [openDrawer, productId],
  );

  const handleDuplicateClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      void confirm({
        title: "Дублировать товар?",
        description:
          "Будет создана скрытая копия товара со всеми медиа, атрибутами, вариантами и категориями.",
        confirmText: "Дублировать",
        pendingText: "Дублирование...",
        onConfirm: async () => {
          await duplicateProduct.mutateAsync({ id: productId });
          await invalidateProductQueries(queryClient);
          toast.success("Товар успешно дублирован.");
        },
        onError: (error) => {
          toast.error(extractApiErrorMessage(error));
        },
      });
    },
    [duplicateProduct, productId, queryClient],
  );

  const handleToggleStatusClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const isCurrentlyActive = status === ProductWithAttributesDtoStatus.ACTIVE;

      void confirm({
        title: isCurrentlyActive ? "Скрыть товар?" : "Показать товар?",
        description: isCurrentlyActive
          ? "Товар станет скрытым и перестанет показываться в каталоге."
          : "Товар снова станет активным и будет показываться в каталоге.",
        confirmText: isCurrentlyActive ? "Скрыть" : "Показать",
        pendingText: isCurrentlyActive ? "Скрываем..." : "Публикуем...",
        onConfirm: async () => {
          await toggleProductStatus.mutateAsync({ id: productId });
          await invalidateProductQueries(queryClient);
          toast.success(
            isCurrentlyActive ? "Товар скрыт." : "Товар опубликован.",
          );
        },
        onError: (error) => {
          toast.error(extractApiErrorMessage(error));
        },
      });
    },
    [productId, queryClient, status, toggleProductStatus],
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {isStatusHidden ? (
        <Button
          type="button"
          variant="ghost"
          disabled={isActionPending}
          onClick={handleToggleStatusClick}
          className="absolute inset-0 z-10 flex h-full rounded-lg bg-black/50 text-center text-white hover:bg-black/60"
        >
          <span className="text-sm leading-tight underline underline-offset-2">
            Показать
            <br />
            карточку снова
          </span>
        </Button>
      ) : null}

      {isMoySkladLinked ? (
        <div className="absolute top-11 left-2 z-20 opacity-60">
          <SyncMoySkladProductAction
            productId={productId}
            disabled={isActionPending}
            onPendingChange={setIsSyncingMoySklad}
          />
        </div>
      ) : null}

      <div className="absolute top-[5px] right-[5px] z-20 flex flex-col gap-2 opacity-60">
        {typeof categoryId === "string" && typeof categoryPosition === "number" ? (
          <ChangeProductCategoryPositionAction
            productId={productId}
            categoryId={categoryId}
            currentPosition={categoryPosition}
            disabled={isActionPending}
            onPendingChange={setIsUpdatingCategoryPosition}
          />
        ) : null}
        {canToggleStatus ? (
          <Button
            type="button"
            size="icon"
            disabled={isActionPending}
            onClick={handleToggleStatusClick}
            className="shadow-custom h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
            aria-label={isStatusActive ? "Скрыть товар" : "Показать товар"}
          >
            {isStatusActive ? (
              <EyeOff className="text-muted-foreground size-4" />
            ) : (
              <Eye className="text-muted-foreground size-4" />
            )}
          </Button>
        ) : null}
        <Button
          type="button"
          size="icon"
          disabled={isActionPending}
          onClick={handleDuplicateClick}
          className="shadow-custom h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
          aria-label="Дублировать товар"
        >
          <Copy className="text-muted-foreground size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          disabled={isActionPending}
          onClick={handleTriggerClick}
          className="shadow-custom h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
          aria-label="Редактировать товар"
        >
          <Pencil className="text-muted-foreground size-4" />
        </Button>
      </div>
    </>
  );
};
