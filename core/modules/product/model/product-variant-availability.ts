export type ProductVariantAvailabilityReason =
  | "disabled"
  | "out_of_stock"
  | "unavailable";

export interface ProductVariantAvailabilityState {
  isSelectable: boolean;
  label: string | null;
  reason: ProductVariantAvailabilityReason | null;
}

interface ProductVariantAvailabilityLike {
  isAvailable?: boolean | null;
  maxQuantity?: number | null;
  status?: string | null;
  stock?: number | null;
}

interface ProductVariantAvailabilityOptions {
  shouldEnforceStock?: boolean;
}

export const PRODUCT_VARIANT_UNAVAILABLE_LABELS: Record<
  ProductVariantAvailabilityReason,
  string
> = {
  disabled: "Не используется",
  out_of_stock: "Нет в наличии",
  unavailable: "Недоступно",
};

export function resolveProductVariantAvailability(
  variant: ProductVariantAvailabilityLike | null | undefined,
  options: ProductVariantAvailabilityOptions = {},
): ProductVariantAvailabilityState {
  const shouldEnforceStock = options.shouldEnforceStock !== false;

  if (!variant) {
    return getUnavailableVariantState("unavailable");
  }

  if (variant.status === "DISABLED") {
    return getUnavailableVariantState("disabled");
  }

  const isOutOfStock =
    variant.status === "OUT_OF_STOCK" ||
    variant.stock === 0 ||
    variant.maxQuantity === 0;

  if (shouldEnforceStock && isOutOfStock) {
    return getUnavailableVariantState("out_of_stock");
  }

  if (variant.isAvailable === false && !isOutOfStock) {
    return getUnavailableVariantState("unavailable");
  }

  return {
    isSelectable: true,
    label: null,
    reason: null,
  };
}

export function isProductVariantSelectable(
  variant: ProductVariantAvailabilityLike | null | undefined,
  options: ProductVariantAvailabilityOptions = {},
): boolean {
  return resolveProductVariantAvailability(variant, options).isSelectable;
}

function getUnavailableVariantState(
  reason: ProductVariantAvailabilityReason,
): ProductVariantAvailabilityState {
  return {
    isSelectable: false,
    label: PRODUCT_VARIANT_UNAVAILABLE_LABELS[reason],
    reason,
  };
}
