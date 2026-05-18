import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { resolveInitialProductVariantId } from "./product-variant-selection-model";

export interface ProductCardVariantState {
  isUnavailable: boolean;
  maxQuantity?: number;
  requiresVariantSelection: boolean;
  shouldOpenPicker: boolean;
  singleVariantId?: string;
}

interface ProductCardVariantStateOptions {
  canUseVariants?: boolean;
  shouldEnforceStock?: boolean;
}

function normalizeProductStock(stock: unknown): number | null {
  return typeof stock === "number" && Number.isFinite(stock)
    ? Math.max(0, stock)
    : null;
}

function resolveSimpleProductAvailabilityState(
  product: ProductWithAttributesDto,
  shouldEnforceStock: boolean,
): ProductCardVariantState {
  const stock = normalizeProductStock(product.stock);
  const isOutOfStock =
    product.availabilityState === "OUT_OF_STOCK" || stock === 0;

  return {
    isUnavailable:
      product.availabilityState === "UNAVAILABLE" ||
      (shouldEnforceStock && isOutOfStock),
    maxQuantity: shouldEnforceStock && stock !== null ? stock : undefined,
    requiresVariantSelection: false,
    shouldOpenPicker: false,
  };
}

export function resolveProductCardVariantState(
  product: ProductWithAttributesDto,
  options: ProductCardVariantStateOptions = {},
): ProductCardVariantState {
  const shouldEnforceStock = options.shouldEnforceStock !== false;
  const canUseVariants = options.canUseVariants !== false;
  const pickerOptions = product.variantPickerOptions ?? [];
  const activePickerOptionCount = pickerOptions.filter(
    (option) => option.status !== "DISABLED",
  ).length;
  const summaryActiveCount = Math.max(
    0,
    product.variantSummary?.activeCount ?? 0,
  );
  const hasVariantSignal = Boolean(
    product.productType?.id ||
      product.requiresVariantSelection ||
      product.defaultVariantId ||
      summaryActiveCount > 0 ||
      activePickerOptionCount > 0,
  );

  if (!canUseVariants || !hasVariantSignal) {
    return resolveSimpleProductAvailabilityState(product, shouldEnforceStock);
  }

  const activeVariantCount = Math.max(summaryActiveCount, activePickerOptionCount);
  const activePickerOptions = pickerOptions.filter(
    (option) => option.status !== "DISABLED",
  );
  const pickerTotalStock = activePickerOptions.some(
    (option) => option.stock === null,
  )
    ? null
    : activePickerOptions.reduce(
        (acc, option) => acc + Math.max(0, option.stock ?? 0),
        0,
      );
  const rawTotalStock = product.variantSummary?.totalStock ?? pickerTotalStock;
  const totalStock =
    typeof rawTotalStock === "number" && Number.isFinite(rawTotalStock)
      ? Math.max(0, rawTotalStock)
      : null;
  const singleVariantId =
    resolveInitialProductVariantId({
      queryVariantId: null,
      shouldEnforceStock,
      singleVariantId:
        product.variantSummary?.singleVariantId ?? product.defaultVariantId,
      variants: pickerOptions,
    }) ??
    product.variantSummary?.singleVariantId?.trim() ??
    product.defaultVariantId?.trim() ??
    undefined;
  const hasSingleConcreteVariant =
    !product.requiresVariantSelection &&
    activeVariantCount === 1 &&
    Boolean(singleVariantId);
  const requiresVariantSelection =
    product.requiresVariantSelection ||
    (activeVariantCount > 0 && !hasSingleConcreteVariant);

  return {
    isUnavailable:
      product.availabilityState === "UNAVAILABLE" ||
      shouldEnforceStock &&
        activeVariantCount > 0 &&
        totalStock !== null &&
        totalStock <= 0,
    maxQuantity:
      shouldEnforceStock &&
      hasSingleConcreteVariant &&
      totalStock !== null
        ? totalStock
        : undefined,
    requiresVariantSelection,
    shouldOpenPicker: requiresVariantSelection,
    singleVariantId: hasSingleConcreteVariant ? singleVariantId : undefined,
  };
}
