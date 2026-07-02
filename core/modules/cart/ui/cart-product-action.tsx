"use client";

import {
  canOpenCartProductVariantDrawer,
  getCartProductActionAriaLabel,
  shouldRenderCartProductVariantDrawer,
  shouldShowCartProductActionQuantity,
} from "@/core/modules/cart/model/cart-product-action-state";
import { buildCartProductCardSnapshot } from "@/core/modules/cart/model/cart-product-snapshot";
import { resolveCartProductCardSelection } from "@/core/modules/cart/model/cart-product-selection";
import { CartProductActionButton } from "@/core/modules/cart/ui/cart-product-action-button";
import { CartProductVariantDrawer } from "@/core/modules/cart/ui/cart-product-variant-drawer";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import {
  filterActivePriceListVisibleItems,
  resolveProductCardVariantState,
} from "@/core/modules/product";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";

interface CartProductActionProps {
  className?: string;
  product: ProductWithAttributesDto;
}

const VARIANT_DRAWER_CLOSE_ANIMATION_MS = 350;

export const CartProductAction = React.memo(function CartProductAction({
  className,
  product,
}: CartProductActionProps) {
  const { catalog } = useCatalogState();
  const features = useCatalogCapabilities();
  const canUseProductVariants = features.canUseProductVariants;
  const canUseCatalogSaleUnits = features.canUseCatalogSaleUnits;
  const canUseCatalogModifiers = features.canUseCatalogModifiers;
  const fallbackCurrency = getCatalogCurrency(catalog, "RUB");
  const visibleVariantPickerOptions = React.useMemo(
    () =>
      filterActivePriceListVisibleItems(
        product,
        product.variantPickerOptions ?? [],
      ),
    [product],
  );
  const [isVariantDrawerOpen, setIsVariantDrawerOpen] = React.useState(false);
  const [isVariantDrawerMounted, setIsVariantDrawerMounted] =
    React.useState(false);
  const handleVariantSelectionRequired = React.useCallback(() => {
    setIsVariantDrawerOpen(true);
  }, [setIsVariantDrawerOpen]);
  const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
  const {
    isUnavailable,
    maxQuantity,
    requiresVariantSelection,
    singleVariantId,
  } = resolveProductCardVariantState(product, {
    canUseVariants: canUseProductVariants,
    shouldEnforceStock,
  });
  const canOpenVariantDrawer = canOpenCartProductVariantDrawer({
    activeVariantCount: product.variantSummary?.activeCount,
    canUseProductVariants,
    hasVariantPickerOptions: visibleVariantPickerOptions.length > 0,
    requiresVariantSelection,
  });
  React.useEffect(() => {
    if (!canOpenVariantDrawer) {
      setIsVariantDrawerOpen(false);
    }
  }, [canOpenVariantDrawer]);
  const productSnapshot = React.useMemo(
    () =>
      buildCartProductCardSnapshot(product, {
        canUseVariants: canUseProductVariants,
        fallbackCurrency,
      }),
    [canUseProductVariants, fallbackCurrency, product],
  );
  const selection = resolveCartProductCardSelection({
    product,
    variantId: singleVariantId,
  });
  const { handleAdd, isBusy, isIncrementDisabled, quantity } =
    useCartProductControls(selection, productSnapshot, {
      canUseProductVariants,
      maxQuantity,
      onVariantSelectionRequired: canOpenVariantDrawer
        ? handleVariantSelectionRequired
        : undefined,
      requiresVariantSelection,
    });
  const shouldShowQuantity = shouldShowCartProductActionQuantity({
    quantity,
    requiresVariantSelection,
  });
  const shouldOpenVariantDrawerOnAction =
    requiresVariantSelection ||
    canUseCatalogSaleUnits ||
    canUseCatalogModifiers;
  const canOpenExistingLineDrawer =
    shouldOpenVariantDrawerOnAction && quantity > 0;
  const isActionDisabled =
    (isUnavailable || isIncrementDisabled) && !canOpenExistingLineDrawer;
  const shouldRenderVariantDrawer = shouldRenderCartProductVariantDrawer({
    canUseCatalogModifiers,
    canUseCatalogSaleUnits,
    canUseProductVariants,
    isVariantDrawerOpen,
    requiresVariantSelection,
  });
  React.useEffect(() => {
    if (shouldRenderVariantDrawer) {
      setIsVariantDrawerMounted(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVariantDrawerMounted(false);
    }, VARIANT_DRAWER_CLOSE_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [shouldRenderVariantDrawer]);

  const ariaLabel = getCartProductActionAriaLabel({
    isUnavailable: isUnavailable && !canOpenExistingLineDrawer,
    quantity,
    requiresVariantSelection,
    shouldShowQuantity,
  });

  const handlePreventCardNavigation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handlePreventCardNavigation(event);

    if (isActionDisabled) {
      return;
    }

    if (shouldOpenVariantDrawerOnAction) {
      setIsVariantDrawerOpen(true);
      return;
    }

    void handleAdd();
  };

  return (
    <span
      className="contents"
      onClick={handlePreventCardNavigation}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <CartProductActionButton
        ariaLabel={ariaLabel}
        className={className}
        disabled={isActionDisabled}
        isBusy={isBusy}
        onClick={handleActionClick}
        quantity={quantity}
        shouldShowQuantity={shouldShowQuantity}
      />

      {isVariantDrawerMounted ? (
        <CartProductVariantDrawer
          open={isVariantDrawerOpen}
          canUseCatalogSaleUnits={canUseCatalogSaleUnits}
          canUseCatalogModifiers={canUseCatalogModifiers}
          canUseProductVariants={canUseProductVariants}
          onOpenChange={setIsVariantDrawerOpen}
          product={product}
        />
      ) : null}
    </span>
  );
});
