"use client";

import {
  getCartProductActionAriaLabel,
  shouldRenderCartProductVariantDrawer,
  shouldShowCartProductActionQuantity,
} from "@/core/modules/cart/model/cart-product-action-state";
import { buildCartProductCardSnapshot } from "@/core/modules/cart/model/cart-product-snapshot";
import { CartProductActionButton } from "@/core/modules/cart/ui/cart-product-action-button";
import { CartProductVariantDrawer } from "@/core/modules/cart/ui/cart-product-variant-drawer";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { resolveProductCardVariantState } from "@/core/modules/product/model/product-card-variant";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";

interface CartProductActionProps {
  className?: string;
  product: ProductWithAttributesDto;
}

export const CartProductAction = React.memo(function CartProductAction({
  className,
  product,
}: CartProductActionProps) {
  const { catalog } = useCatalogState();
  const features = useCatalogCapabilities();
  const canUseProductVariants = features.canUseProductVariants;
  const fallbackCurrency = getCatalogCurrency(catalog, "RUB");
  const [isVariantDrawerOpen, setIsVariantDrawerOpen] = React.useState(false);
  const handleVariantSelectionRequired = React.useCallback(() => {
    setIsVariantDrawerOpen(true);
  }, []);

  React.useEffect(() => {
    if (!canUseProductVariants) {
      setIsVariantDrawerOpen(false);
    }
  }, [canUseProductVariants]);

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
  const productSnapshot = React.useMemo(
    () =>
      buildCartProductCardSnapshot(product, {
        canUseVariants: canUseProductVariants,
        fallbackCurrency,
      }),
    [canUseProductVariants, fallbackCurrency, product],
  );
  const { handleAdd, isBusy, isIncrementDisabled, quantity } =
    useCartProductControls(
      {
        productId: product.id,
        variantId: singleVariantId,
      },
      productSnapshot,
      {
        canUseProductVariants,
        maxQuantity,
        onVariantSelectionRequired: canUseProductVariants
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
    canUseProductVariants,
    isVariantDrawerOpen,
    requiresVariantSelection,
  });
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

    if (requiresVariantSelection) {
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

      {shouldRenderVariantDrawer ? (
        <CartProductVariantDrawer
          open={isVariantDrawerOpen}
          onOpenChange={setIsVariantDrawerOpen}
          product={product}
        />
      ) : null}
    </span>
  );
});
