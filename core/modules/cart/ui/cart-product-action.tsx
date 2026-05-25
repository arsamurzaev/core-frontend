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
import { resolveProductCardVariantState } from "@/core/modules/product/model/product-card-variant";
import { getProductSaleUnits } from "@/core/modules/product/model/sale-units";
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
  const fallbackCurrency = getCatalogCurrency(catalog, "RUB");
  const hasProductSaleUnitChoices = React.useMemo(
    () => canUseCatalogSaleUnits && getProductSaleUnits(product).length > 0,
    [canUseCatalogSaleUnits, product],
  );
  const canOpenVariantDrawer = canOpenCartProductVariantDrawer({
    activeVariantCount: product.variantSummary?.activeCount,
    canUseProductVariants,
    hasVariantPickerOptions: (product.variantPickerOptions?.length ?? 0) > 0,
    requiresVariantSelection: product.requiresVariantSelection,
  });
  const [isVariantDrawerOpen, setIsVariantDrawerOpen] = React.useState(false);
  const [isVariantDrawerMounted, setIsVariantDrawerMounted] =
    React.useState(false);
  const handleVariantSelectionRequired = React.useCallback(() => {
    setIsVariantDrawerOpen(true);
  }, [setIsVariantDrawerOpen]);

  React.useEffect(() => {
    if (!canOpenVariantDrawer) {
      setIsVariantDrawerOpen(false);
    }
  }, [canOpenVariantDrawer]);

  const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
  const {
    isUnavailable,
    maxQuantity,
    requiresVariantSelection,
    singleVariantId,
  } = resolveProductCardVariantState(product, {
    canUseVariants: canOpenVariantDrawer,
    shouldEnforceStock,
  });
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
    useCartProductControls(
      selection,
      productSnapshot,
      {
        canUseProductVariants,
        maxQuantity,
        onVariantSelectionRequired: canOpenVariantDrawer
          ? handleVariantSelectionRequired
          : undefined,
        requiresVariantSelection,
      },
    );
  const shouldShowQuantity = shouldShowCartProductActionQuantity({
    quantity,
    requiresVariantSelection,
  });
  const shouldRenderVariantDrawer = shouldRenderCartProductVariantDrawer({
    canUseCatalogSaleUnits,
    canUseProductVariants: canOpenVariantDrawer,
    hasSaleUnitChoices: hasProductSaleUnitChoices,
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
    isUnavailable,
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

    if (isUnavailable || isIncrementDisabled) {
      return;
    }

    if (requiresVariantSelection || hasProductSaleUnitChoices) {
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
        disabled={isUnavailable || isIncrementDisabled}
        isBusy={isBusy}
        onClick={handleActionClick}
        quantity={quantity}
        shouldShowQuantity={shouldShowQuantity}
      />

      {isVariantDrawerMounted ? (
        <CartProductVariantDrawer
          open={isVariantDrawerOpen}
          canUseCatalogSaleUnits={canUseCatalogSaleUnits}
          canUseProductVariants={canOpenVariantDrawer}
          onOpenChange={setIsVariantDrawerOpen}
          product={product}
        />
      ) : null}
    </span>
  );
});
