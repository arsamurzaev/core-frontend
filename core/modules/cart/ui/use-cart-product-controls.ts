"use client";

import type { CartProductSnapshot } from "@/core/modules/cart/model/cart-context.types";
import { useCart } from "@/core/modules/cart/model/cart-context";
import {
  getCartLineSelectionQuantity,
  normalizeCartLineSelection,
  type CartLineSelection,
  type CartQuantityScope,
} from "@/core/modules/cart/model/cart-line-selection";
import {
  CART_PRODUCT_CONTROL_MESSAGES,
  getCartProductControlErrorMessage,
  isCartIncrementDisabled,
  isVariantSelectionRequiredMessage,
  normalizeCartMaxQuantity,
  shouldConfirmCartLineRemoval,
  shouldRequireCartProductVariantSelection,
} from "@/core/modules/cart/model/cart-product-controls";
import { confirm } from "@/shared/ui/confirmation";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import React from "react";
import { toast } from "sonner";

type CartProductControlsProduct = CartProductSnapshot &
  Partial<Pick<ProductWithAttributesDto, "productType" | "variantSummary">>;

export function useCartProductControls(
  productIdOrSelection: string | CartLineSelection,
  product?: CartProductControlsProduct,
  options: {
    canUseProductVariants?: boolean;
    maxQuantity?: number;
    onVariantSelectionRequired?: () => void;
    quantityOverride?: number;
    quantityScope?: CartQuantityScope;
    requiresVariantSelection?: boolean;
    saleUnitId?: string | null;
    variantId?: string | null;
  } = {},
) {
  const {
    decrementLine,
    incrementLine,
    isBusy,
    quantityByLineKey,
    quantityByProductId,
  } = useCart();
  const selectionProductId =
    typeof productIdOrSelection === "string"
      ? productIdOrSelection
      : productIdOrSelection.productId;
  const selectionSaleUnitId =
    typeof productIdOrSelection === "string"
      ? options.saleUnitId
      : productIdOrSelection.saleUnitId ?? options.saleUnitId;
  const selectionVariantId =
    typeof productIdOrSelection === "string"
      ? options.variantId
      : productIdOrSelection.variantId ?? options.variantId;
  const selectionGuestName =
    typeof productIdOrSelection === "string"
      ? undefined
      : productIdOrSelection.guestName;
  const selectionGuestSessionId =
    typeof productIdOrSelection === "string"
      ? undefined
      : productIdOrSelection.guestSessionId;
  const selection = normalizeCartLineSelection({
    guestName: selectionGuestName,
    guestSessionId: selectionGuestSessionId,
    productId: selectionProductId,
    saleUnitId: selectionSaleUnitId,
    variantId: selectionVariantId,
  });
  const maxQuantity = normalizeCartMaxQuantity(options.maxQuantity);
  const quantity = getCartLineSelectionQuantity({
    quantityByLineKey,
    quantityByProductId,
    quantityScope: options.quantityScope,
    selection,
  });
  const resolvedQuantity = options.quantityOverride ?? quantity;
  const isMaxQuantityReached = isCartIncrementDisabled({
    maxQuantity,
    quantity: resolvedQuantity,
  });
  const onVariantSelectionRequired = options.onVariantSelectionRequired;
  const shouldRequestVariantSelection =
    shouldRequireCartProductVariantSelection({
      canUseProductVariants: options.canUseProductVariants,
      product,
      requiresVariantSelection: options.requiresVariantSelection,
      variantId: selection.variantId,
    });

  const handleIncrement = React.useCallback(async () => {
    if (shouldRequestVariantSelection) {
      if (onVariantSelectionRequired) {
        onVariantSelectionRequired();
        return;
      }

      toast.error(CART_PRODUCT_CONTROL_MESSAGES.variantSelectionRequired);
      return;
    }

    if (isMaxQuantityReached) {
      toast.error(CART_PRODUCT_CONTROL_MESSAGES.saleUnitUnavailable);
      return;
    }

    try {
      await incrementLine(selection, product);
    } catch (error) {
      const message = getCartProductControlErrorMessage(error);
      if (
        onVariantSelectionRequired &&
        isVariantSelectionRequiredMessage(message)
      ) {
        onVariantSelectionRequired();
        return;
      }

      toast.error(message);
    }
  }, [
    incrementLine,
    isMaxQuantityReached,
    onVariantSelectionRequired,
    product,
    selection,
    shouldRequestVariantSelection,
  ]);

  const handleDecrement = React.useCallback(async () => {
    if (!resolvedQuantity) {
      return;
    }

    if (shouldConfirmCartLineRemoval(resolvedQuantity)) {
      const isConfirmed = await confirm({
        title: CART_PRODUCT_CONTROL_MESSAGES.confirmRemoveTitle,
        description: CART_PRODUCT_CONTROL_MESSAGES.confirmRemoveDescription,
        confirmText: CART_PRODUCT_CONTROL_MESSAGES.confirmRemove,
        cancelText: CART_PRODUCT_CONTROL_MESSAGES.confirmCancel,
      });

      if (!isConfirmed) {
        return;
      }
    }

    try {
      await decrementLine(selection, product);
    } catch (error) {
      toast.error(getCartProductControlErrorMessage(error));
    }
  }, [
    decrementLine,
    product,
    resolvedQuantity,
    selection,
  ]);

  return {
    handleAdd: handleIncrement,
    handleDecrement,
    handleIncrement,
    isIncrementDisabled: isMaxQuantityReached,
    isBusy,
    selection,
    quantity: resolvedQuantity,
  };
}
