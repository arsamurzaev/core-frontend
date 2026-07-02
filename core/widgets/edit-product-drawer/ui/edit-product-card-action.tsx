"use client";

import {
  ChangeProductCategoryPositionAction,
  SyncIikoProductAction,
  SyncMoySkladProductAction,
} from "@/core/modules/product";
import { useEditProductDrawerHost } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-host";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import {
  canManageCatalogContent,
  isChildCatalog,
} from "@/core/catalog-runtime/content-access";
import { invalidateProductQueries } from "@/core/modules/product";
import {
  ProductWithAttributesDtoStatus,
  useProductControllerDuplicate,
  useProductControllerToggleStatus,
} from "@/shared/api/generated/react-query";
import { PRODUCT_HIDDEN_BY_PARENT_CATALOG_STATE } from "@/core/widgets/product-drawer";
import { useSession } from "@/shared/providers/session-provider";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Pencil } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface EditProductCardActionProps {
  categoryId?: string;
  categoryPosition?: number;
  isIikoLinked?: boolean;
  isMoySkladLinked?: boolean;
  productId: string;
  status: ProductWithAttributesDtoStatus;
}

export const EditProductCardAction: React.FC<EditProductCardActionProps> = ({
  categoryId,
  categoryPosition,
  isIikoLinked = false,
  isMoySkladLinked = false,
  productId,
  status,
}) => {
  const { isAuthenticated } = useSession();
  const { catalog } = useCatalogState();
  const { openDrawer } = useEditProductDrawerHost();
  const queryClient = useQueryClient();
  const duplicateProduct = useProductControllerDuplicate();
  const toggleProductStatus = useProductControllerToggleStatus();
  const [isUpdatingCategoryPosition, setIsUpdatingCategoryPosition] =
    React.useState(false);
  const [isSyncingIiko, setIsSyncingIiko] = React.useState(false);
  const [isSyncingMoySklad, setIsSyncingMoySklad] = React.useState(false);
  const isStatusActive = status === ProductWithAttributesDtoStatus.ACTIVE;
  const isStatusHidden = status === ProductWithAttributesDtoStatus.HIDDEN;
  const isIntegrationLinked = isMoySkladLinked || isIikoLinked;
  const canManageContent = canManageCatalogContent(catalog);
  const isHiddenByParentCatalog = isStatusHidden && isChildCatalog(catalog);
  const canToggleStatus =
    canManageContent &&
    !isHiddenByParentCatalog &&
    !isIntegrationLinked &&
    (isStatusActive || isStatusHidden);
  const hiddenStatusLabel = isHiddenByParentCatalog
    ? PRODUCT_HIDDEN_BY_PARENT_CATALOG_STATE.title
    : isIntegrationLinked
      ? "Скрыто интеграцией"
      : "Скрыто";
  const isActionPending =
    duplicateProduct.isPending ||
    toggleProductStatus.isPending ||
    isUpdatingCategoryPosition ||
    isSyncingIiko ||
    isSyncingMoySklad;

  const handleTriggerClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      openDrawer(productId);
    },
    [openDrawer, productId],
  );

  const handleReadOnlyHiddenInteraction = React.useCallback(
    (event: React.SyntheticEvent<HTMLElement>) => {
      if (!isHiddenByParentCatalog) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [isHiddenByParentCatalog],
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

      const isCurrentlyActive =
        status === ProductWithAttributesDtoStatus.ACTIVE;

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

  if (!isAuthenticated || (!canManageContent && !isHiddenByParentCatalog)) {
    return null;
  }

  return (
    <>
      {isStatusHidden ? (
        canToggleStatus ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isActionPending}
            onClick={handleToggleStatusClick}
            className="absolute inset-0 z-10 flex h-full rounded-control bg-surface-inverse/50 text-center text-text-inverse hover:bg-surface-inverse/60"
          >
            <span className="text-sm leading-tight underline underline-offset-2">
              Показать
              <br />
              карточку снова
            </span>
          </Button>
        ) : (
          <div
            className={cn(
              "absolute inset-0 z-10 flex h-full items-center justify-center rounded-control bg-surface-inverse/50 px-3 text-center text-text-inverse",
              isHiddenByParentCatalog
                ? "pointer-events-auto cursor-not-allowed"
                : "pointer-events-none",
            )}
            aria-label={hiddenStatusLabel}
            onClick={handleReadOnlyHiddenInteraction}
            onPointerDown={handleReadOnlyHiddenInteraction}
          >
            <span className="rounded-control bg-surface-inverse/20 px-3 py-2 text-sm font-semibold leading-tight shadow-control">
              {hiddenStatusLabel}
            </span>
          </div>
        )
      ) : null}

      {canManageContent && isMoySkladLinked ? (
        <div className="absolute top-11 left-2 z-20 opacity-60">
          <SyncMoySkladProductAction
            productId={productId}
            disabled={isActionPending}
            onPendingChange={setIsSyncingMoySklad}
          />
        </div>
      ) : null}

      {canManageContent && !isMoySkladLinked && isIikoLinked ? (
        <div className="absolute top-11 left-2 z-20 opacity-60">
          <SyncIikoProductAction
            productId={productId}
            disabled={isActionPending}
            onPendingChange={setIsSyncingIiko}
          />
        </div>
      ) : null}

      {canManageContent ? (
        <div className="absolute top-[5px] right-[5px] z-20 flex flex-col gap-2 opacity-60">
          {typeof categoryId === "string" &&
          typeof categoryPosition === "number" ? (
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
              className="shadow-surface h-[30px] w-[30px] rounded-pill border-0 bg-surface-base hover:bg-surface-base"
              aria-label={isStatusActive ? "Скрыть товар" : "Показать товар"}
            >
              {isStatusActive ? (
                <EyeOff className="text-text-muted size-4" />
              ) : (
                <Eye className="text-text-muted size-4" />
              )}
            </Button>
          ) : null}
          {!isIntegrationLinked ? (
            <Button
              type="button"
              size="icon"
              disabled={isActionPending}
              onClick={handleDuplicateClick}
              className="shadow-surface h-[30px] w-[30px] rounded-pill border-0 bg-surface-base hover:bg-surface-base"
              aria-label="Дублировать товар"
            >
              <Copy className="text-text-muted size-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            disabled={isActionPending}
            onClick={handleTriggerClick}
            className="shadow-surface h-[30px] w-[30px] rounded-pill border-0 bg-surface-base hover:bg-surface-base"
            aria-label="Редактировать товар"
          >
            <Pencil className="text-text-muted size-4" />
          </Button>
        </div>
      ) : null}
    </>
  );
};
