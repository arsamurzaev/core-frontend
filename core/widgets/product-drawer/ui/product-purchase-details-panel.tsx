"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductDrawerFooterAction } from "@/core/modules/cart/ui/cart-product-drawer-footer-action";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import type { ProductUnavailableState } from "@/core/widgets/product-drawer/model/product-availability";
import { resolveProductPurchaseTotalPricing } from "@/core/widgets/product-drawer/model/product-purchase-selection-model";
import type { ProductDrawerViewModel } from "@/core/widgets/product-drawer/model/product-drawer-view";
import { useProductPurchaseSelection } from "@/core/widgets/product-drawer/model/use-product-purchase-selection";
import { ProductDetailsPanel } from "@/core/widgets/product-drawer/ui/product-details-panel";
import { ProductSaleUnitPicker } from "@/core/widgets/product-drawer/ui/product-sale-unit-picker";
import { ProductVariantPicker } from "@/core/widgets/product-drawer/ui/product-variant-picker";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";

interface ProductPurchaseDetailsPanelProps {
  className?: string;
  footerClassName?: string;
  initialSaleUnitId?: string | null;
  initialVariantId?: string | null;
  isLoading: boolean;
  product: ProductWithDetailsDto | null;
  productKey: string;
  resetKey: string;
  scrollAreaClassName?: string;
  ScrollAreaComponent?: React.ElementType<{
    children?: React.ReactNode;
    className?: string;
  }>;
  unavailableState?: ProductUnavailableState | null;
  viewModel: ProductDrawerViewModel;
}

function hasVisibleProductVariantData(
  product: ProductWithDetailsDto | null,
): boolean {
  if (!product?.productType?.id) {
    return false;
  }

  return (
    product.variants.some((variant) => variant.status !== "DISABLED") ||
    product.variantPickerOptions.some(
      (option) => option.status !== "DISABLED",
    ) ||
    (product.variantSummary?.activeCount ?? 0) > 0
  );
}

function hasVisibleSaleUnitData(
  product: ProductWithDetailsDto | null,
): boolean {
  return (
    product?.variants.some((variant) =>
      variant.saleUnits.some((unit) => unit.isActive),
    ) ?? false
  );
}

export function ProductPurchaseDetailsPanel({
  className,
  footerClassName,
  initialSaleUnitId,
  initialVariantId,
  isLoading,
  product,
  productKey,
  resetKey,
  scrollAreaClassName,
  ScrollAreaComponent,
  unavailableState,
  viewModel,
}: ProductPurchaseDetailsPanelProps) {
  const { catalog } = useCatalogState();
  const features = useCatalogCapabilities();
  const { shouldUseCartUi } = useCart();
  const canUseProductVariants =
    features.canUseProductVariants || hasVisibleProductVariantData(product);
  const canUseCatalogSaleUnits =
    features.canUseCatalogSaleUnits || hasVisibleSaleUnitData(product);
  const shouldEnforceStock = catalog?.settings?.inventoryMode !== "NONE";
  const purchaseSelection = useProductPurchaseSelection({
    canUseCatalogSaleUnits,
    canUseProductVariants,
    initialSaleUnitId,
    initialVariantId,
    product,
    productKey,
    shouldEnforceStock,
    viewModel,
  });
  const selectedSaleUnitId = canUseCatalogSaleUnits
    ? purchaseSelection.selectedSaleUnit?.id
    : undefined;
  const selectedVariantId = canUseProductVariants
    ? purchaseSelection.selectedVariant?.id
    : undefined;
  const cartControls = useCartProductControls(
    {
      productId: product?.id ?? "",
      saleUnitId: selectedSaleUnitId,
      variantId: selectedVariantId,
    },
    purchaseSelection.cartProductSnapshot,
    {
      maxQuantity: purchaseSelection.maxQuantity,
      requiresVariantSelection: purchaseSelection.isVariantSelectionRequired,
    },
  );
  const totalPricing = React.useMemo(
    () =>
      resolveProductPurchaseTotalPricing({
        displayPrice: purchaseSelection.displayPrice,
        quantity: cartControls.quantity,
        selectedBasePrice: purchaseSelection.selectedBasePrice,
      }),
    [
      cartControls.quantity,
      purchaseSelection.displayPrice,
      purchaseSelection.selectedBasePrice,
    ],
  );

  return (
    <ProductDetailsPanel
      attributeRows={viewModel.attributeRows}
      brandName={viewModel.brandName ?? undefined}
      className={className}
      currency={viewModel.currency}
      description={viewModel.description}
      displayName={viewModel.displayName}
      displayPrice={totalPricing.displayPrice}
      discount={viewModel.discount}
      footerAction={
        !unavailableState && shouldUseCartUi && product?.id ? (
          <CartProductDrawerFooterAction
            controls={cartControls}
            disabled={purchaseSelection.isVariantSelectionRequired}
          />
        ) : null
      }
      footerClassName={footerClassName}
      hasDiscount={
        purchaseSelection.hasSelectedDiscount || viewModel.hasDiscount
      }
      hasError={viewModel.hasError}
      imageUrls={viewModel.imageUrls}
      isLoading={isLoading}
      price={totalPricing.selectedBasePrice}
      resetKey={resetKey}
      scrollAreaClassName={scrollAreaClassName}
      ScrollAreaComponent={ScrollAreaComponent}
      shareText={viewModel.shareText}
      subtitle={viewModel.subtitle}
      unavailableState={unavailableState}
      variantPicker={
        !unavailableState && canUseProductVariants && product ? (
          <ProductVariantPicker
            currency={viewModel.currency}
            onChange={purchaseSelection.setSelectedVariantId}
            selectedVariantId={purchaseSelection.selectedVariantId}
            shouldEnforceStock={shouldEnforceStock}
            variants={purchaseSelection.selectableVariants}
          />
        ) : null
      }
      saleUnitPicker={
        !unavailableState && canUseCatalogSaleUnits && product ? (
          <ProductSaleUnitPicker
            currency={viewModel.currency}
            onChange={purchaseSelection.setSelectedSaleUnitId}
            saleUnits={purchaseSelection.saleUnits}
            selectedSaleUnitId={purchaseSelection.selectedSaleUnit?.id ?? null}
          />
        ) : null
      }
      variantsSummary={
        !unavailableState && canUseProductVariants
          ? viewModel.variantsSummary
          : null
      }
    />
  );
}
