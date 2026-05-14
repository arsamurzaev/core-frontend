"use client";

import type { CartProductSnapshot } from "@/core/modules/cart/model/cart-context.types";
import {
  findProductSaleUnit,
  type ProductSaleUnit,
} from "@/core/modules/product/model/sale-units";
import {
  buildProductPurchaseCartSnapshot,
  getAvailableProductSaleUnits,
  getSelectableProductVariants,
  isProductVariantSelectionRequired,
  resolveNextProductSaleUnitId,
  resolveProductPurchaseMaxQuantity,
  resolveProductPurchasePricing,
  resolveProductSaleUnitSource,
} from "@/core/widgets/product-drawer/model/product-purchase-selection-model";
import { useProductVariantSelection } from "@/core/widgets/product-drawer/model/product-variant-selection";
import type {
  ProductVariantDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import React from "react";

interface ProductPurchaseViewModel {
  discount: number;
  displayPrice: number;
  hasDiscount: boolean;
  price: number;
}

interface UseProductPurchaseSelectionParams {
  canUseCatalogSaleUnits: boolean;
  canUseProductVariants: boolean;
  initialSaleUnitId?: string | null;
  initialVariantId?: string | null;
  product: ProductWithDetailsDto | null;
  productKey?: string;
  shouldEnforceStock?: boolean;
  viewModel: ProductPurchaseViewModel;
}

export function useProductPurchaseSelection({
  canUseCatalogSaleUnits,
  canUseProductVariants,
  initialSaleUnitId,
  initialVariantId,
  product,
  productKey,
  shouldEnforceStock,
  viewModel,
}: UseProductPurchaseSelectionParams): {
  cartProductSnapshot?: CartProductSnapshot;
  displayPrice: number;
  hasSelectedDiscount: boolean;
  isVariantSelectionRequired: boolean;
  maxQuantity?: number;
  saleUnits: ProductSaleUnit[];
  selectedBasePrice: number;
  selectedSaleUnit: ProductSaleUnit | null;
  selectedSaleUnitId: string | null;
  selectedVariant: ProductVariantDto | null;
  selectedVariantId: string | null;
  selectableVariants: ProductVariantDto[];
  setSelectedSaleUnitId: (saleUnitId: string | null) => void;
  setSelectedVariantId: (variantId: string) => void;
} {
  const selectableVariants = React.useMemo(
    () =>
      getSelectableProductVariants({
        canUseProductVariants,
        product,
      }),
    [canUseProductVariants, product],
  );
  const { selectedVariant, selectedVariantId, setSelectedVariantId } =
    useProductVariantSelection({
      initialVariantId,
      productId: product?.id,
      shouldEnforceStock,
      singleVariantId: product?.productType?.id
        ? product?.variantSummary?.singleVariantId
        : null,
      variants: selectableVariants,
    });
  const saleUnitSource = React.useMemo(
    () =>
      resolveProductSaleUnitSource({
        canUseProductVariants,
        product,
        selectedVariant,
      }),
    [canUseProductVariants, product, selectedVariant],
  );
  const saleUnits = React.useMemo(
    () =>
      getAvailableProductSaleUnits({
        canUseCatalogSaleUnits,
        product,
        saleUnitSource,
      }),
    [canUseCatalogSaleUnits, product, saleUnitSource],
  );
  const [selectedSaleUnitId, setSelectedSaleUnitId] = React.useState<
    string | null
  >(null);
  const normalizedInitialSaleUnitId = initialSaleUnitId?.trim() || null;
  const initialSaleUnitSelectionKey = [
    product?.id ?? productKey ?? "",
    initialVariantId?.trim() ?? "",
    normalizedInitialSaleUnitId ?? "",
  ].join(":");
  const previousInitialSaleUnitSelectionKeyRef = React.useRef<string | null>(
    null,
  );

  React.useEffect(() => {
    setSelectedSaleUnitId((current) => {
      const shouldApplyInitialSaleUnit =
        previousInitialSaleUnitSelectionKeyRef.current !==
        initialSaleUnitSelectionKey;
      previousInitialSaleUnitSelectionKeyRef.current =
        initialSaleUnitSelectionKey;

      return resolveNextProductSaleUnitId({
        currentSaleUnitId: current,
        initialSaleUnitId: normalizedInitialSaleUnitId,
        saleUnits,
        shouldApplyInitialSaleUnit,
      });
    });
  }, [initialSaleUnitSelectionKey, normalizedInitialSaleUnitId, saleUnits]);

  const selectedSaleUnit = React.useMemo(
    () => findProductSaleUnit(saleUnits, selectedSaleUnitId),
    [saleUnits, selectedSaleUnitId],
  );
  const { displayPrice, hasSelectedDiscount, selectedBasePrice } = React.useMemo(
    () =>
      resolveProductPurchasePricing({
        discount: viewModel.discount,
        displayPrice: viewModel.displayPrice,
        hasDiscount: viewModel.hasDiscount,
        price: viewModel.price,
        selectedSaleUnit,
        selectedVariant,
      }),
    [selectedSaleUnit, selectedVariant, viewModel],
  );
  const maxQuantity = React.useMemo(
    () =>
      resolveProductPurchaseMaxQuantity({
        product,
        selectedSaleUnit,
        selectedVariant,
        shouldEnforceStock,
      }),
    [product, selectedSaleUnit, selectedVariant, shouldEnforceStock],
  );
  const cartProductSnapshot = React.useMemo(
    () =>
      buildProductPurchaseCartSnapshot({
        displayPrice,
        product,
      }),
    [displayPrice, product],
  );
  const isVariantSelectionRequired = isProductVariantSelectionRequired({
    selectableVariants,
    selectedVariant,
    shouldEnforceStock,
  });

  return {
    cartProductSnapshot,
    displayPrice,
    hasSelectedDiscount,
    isVariantSelectionRequired,
    maxQuantity,
    saleUnits,
    selectedBasePrice,
    selectedSaleUnit,
    selectedSaleUnitId,
    selectedVariant,
    selectedVariantId,
    selectableVariants,
    setSelectedSaleUnitId,
    setSelectedVariantId,
  };
}
