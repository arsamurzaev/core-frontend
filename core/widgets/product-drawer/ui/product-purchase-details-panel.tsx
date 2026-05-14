"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductDrawerFooterAction } from "@/core/modules/cart/ui/cart-product-drawer-footer-action";
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

  return (
    <ProductDetailsPanel
      attributeRows={viewModel.attributeRows}
      brandName={viewModel.brandName ?? undefined}
      className={className}
      currency={viewModel.currency}
      description={viewModel.description}
      displayName={viewModel.displayName}
      displayPrice={purchaseSelection.displayPrice}
      discount={viewModel.discount}
      footerAction={
        shouldUseCartUi && product?.id ? (
          <CartProductDrawerFooterAction
            disabled={purchaseSelection.isVariantSelectionRequired}
            product={purchaseSelection.cartProductSnapshot}
            productId={product.id}
            maxQuantity={purchaseSelection.maxQuantity}
            requiresVariantSelection={
              purchaseSelection.isVariantSelectionRequired
            }
            saleUnitId={
              canUseCatalogSaleUnits
                ? purchaseSelection.selectedSaleUnit?.id
                : undefined
            }
            variantId={
              canUseProductVariants
                ? purchaseSelection.selectedVariant?.id
                : undefined
            }
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
      price={purchaseSelection.selectedBasePrice}
      resetKey={resetKey}
      scrollAreaClassName={scrollAreaClassName}
      ScrollAreaComponent={ScrollAreaComponent}
      shareText={viewModel.shareText}
      subtitle={viewModel.subtitle}
      variantPicker={
        canUseProductVariants && product ? (
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
        canUseCatalogSaleUnits && product ? (
          <ProductSaleUnitPicker
            currency={viewModel.currency}
            onChange={purchaseSelection.setSelectedSaleUnitId}
            saleUnits={purchaseSelection.saleUnits}
            selectedSaleUnitId={purchaseSelection.selectedSaleUnit?.id ?? null}
          />
        ) : null
      }
      variantsSummary={canUseProductVariants ? viewModel.variantsSummary : null}
    />
  );
}
