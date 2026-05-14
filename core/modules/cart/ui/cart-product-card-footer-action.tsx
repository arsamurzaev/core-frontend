"use client";

import {
  getCartPricingForProduct,
} from "@/core/modules/cart/model/cart-item-view";
import { getCartItemMaxQuantity } from "@/core/modules/cart/model/cart-item-max-quantity";
import { useCart } from "@/core/modules/cart/model/cart-context";
import {
  buildCartLineSnapshot,
  getCartProductLinesSummary,
} from "@/core/modules/cart/model/cart-product-card-footer-state";
import { CartProductCardFooterPrice } from "@/core/modules/cart/ui/cart-product-card-footer-price";
import { CartProductCardFooterQuantity } from "@/core/modules/cart/ui/cart-product-card-footer-quantity";
import { CartProductCardFooterSummary } from "@/core/modules/cart/ui/cart-product-card-footer-summary";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { resolveProductCardVariantState } from "@/core/modules/product/model/product-card-variant";
import { buildProductCardView } from "@/core/modules/product/model/product-card-view";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";

interface CartProductCardFooterActionProps {
  className?: string;
  isDetailed?: boolean;
  product: ProductWithAttributesDto;
}

export const CartProductCardFooterAction = React.memo(
  function CartProductCardFooterAction({
    className,
    isDetailed = false,
    product,
  }: CartProductCardFooterActionProps) {
    const { catalog } = useCatalogState();
    const features = useCatalogCapabilities();
    const canUseProductVariants = features.canUseProductVariants;
    const { items } = useCart();
    const fallbackCurrency = getCatalogCurrency(catalog, "RUB");
    const productCartLines = React.useMemo(
      () => items.filter((item) => item.productId === product.id),
      [items, product.id],
    );
    const singleCartLine =
      productCartLines.length === 1 ? productCartLines[0] : null;
    const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
    const { isUnavailable, maxQuantity, singleVariantId } =
      resolveProductCardVariantState(product, {
        canUseVariants: canUseProductVariants,
        shouldEnforceStock,
      });
    const singleLineMaxQuantity = React.useMemo(
      () =>
        shouldEnforceStock && singleCartLine
          ? getCartItemMaxQuantity(singleCartLine)
          : undefined,
      [shouldEnforceStock, singleCartLine],
    );
    const singleLineProduct = React.useMemo(
      () =>
        singleCartLine
          ? buildCartLineSnapshot(product, singleCartLine)
          : product,
      [product, singleCartLine],
    );
    const productControls = useCartProductControls(
      {
        productId: product.id,
        variantId: singleVariantId,
      },
      product,
      {
        canUseProductVariants,
        maxQuantity,
      },
    );
    const singleLineControls = useCartProductControls(
      {
        productId: product.id,
        saleUnitId: singleCartLine?.saleUnitId,
        variantId: singleCartLine?.variantId,
      },
      singleLineProduct,
      {
        maxQuantity: singleLineMaxQuantity,
        quantityScope: "line",
      },
    );
    const controls = singleCartLine ? singleLineControls : productControls;
    const pricing =
      singleCartLine && controls.quantity
        ? {
            currency: singleCartLine.currency,
            displayTotal: singleCartLine.displayLineTotal,
          }
        : getCartPricingForProduct(product, controls.quantity, fallbackCurrency);

    const handlePreventCardNavigation = (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (productCartLines.length > 1) {
      return (
        <CartProductCardFooterSummary
          className={className}
          isDetailed={isDetailed}
          onClick={handlePreventCardNavigation}
          summary={getCartProductLinesSummary(
            productCartLines,
            fallbackCurrency,
          )}
        />
      );
    }

    if (
      !controls.quantity ||
      (isUnavailable && !singleVariantId && !singleCartLine)
    ) {
      const { displayPrice, currency, hasDiscount, pricePrefix } =
        buildProductCardView(product, {
          canUseVariants: canUseProductVariants,
          fallbackCurrency,
        });

      return (
        <CartProductCardFooterPrice
          className={className}
          currency={currency}
          displayPrice={displayPrice}
          hasDiscount={hasDiscount}
          pricePrefix={pricePrefix}
        />
      );
    }

    return (
      <CartProductCardFooterQuantity
        className={className}
        controls={controls}
        currency={pricing.currency}
        displayTotal={pricing.displayTotal}
        isDetailed={isDetailed}
        onClick={handlePreventCardNavigation}
      />
    );
  },
);
